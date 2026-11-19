/** Guard the frontend-to-Payload nutrition boundary without guessing USDA values. */
export const RECIPE_TEXT_MAX = 5000;
export const RECIPE_SERVINGS_MAX = 100;
export const NUTRIENT_KEYS = [
  'calories', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'sodium',
] as const;
export type NutrientKey = typeof NUTRIENT_KEYS[number];
export type NutrientSet = Record<NutrientKey, number | null>;

export interface IngredientResult {
  raw: string;
  name: string;
  quantity: number; // grams; already converted by the CMS parser
  unit: string;
  originalQuantity: number | string;
  originalUnit: string;
  unitConverted: boolean;
  usedFood: string; // USDA description reported by the CMS
  nutrients: NutrientSet;
  /**
   * USDA provenance returned by CMS PR #76 (fdcId and dataType come from USDA, never inferred
   * from descriptions). Null when the connected CMS does not report it (older CMS); a
   * malformed value makes the whole response fail closed.
   */
  provenance: IngredientProvenance | null;
  /** Raw/cooked state requested by the user's text compared with the matched USDA food. */
  preparation: PreparationCheck;
}
/** Data types the CMS searches (SR Legacy, Foundation, then Branded). */
export const USDA_DATA_TYPES = ['SR Legacy', 'Foundation', 'Branded'] as const;
export type UsdaDataType = typeof USDA_DATA_TYPES[number];
/** Heuristic word-overlap confidence from the CMS; "none" matches are never returned as matched. */
export type MatchConfidence = 'exact' | 'approx';
export interface IngredientProvenance {
  fdcId: number;
  dataType: UsdaDataType;
  matchConfidence: MatchConfidence;
  /** Official FoodData Central page for the matched record. */
  fdcUrl: string;
}
export type PreparationState = 'raw' | 'cooked';
export interface PreparationCheck {
  requested: PreparationState | null;
  matched: PreparationState | null;
  /** consistent: both state the same; unspecified: the user gave no state; unknown: USDA name gives none. */
  status: 'consistent' | 'unspecified' | 'unknown';
}
export interface AnalyzeResponse {
  perRecipe: NutrientSet;
  perServing: NutrientSet;
  ingredients: IngredientResult[];
  unmatched: { raw: string; name: string }[];
  servings: number;
  notes: string[];
}
export interface VerifiedRecipeResponse extends AnalyzeResponse {
  coverage: {
    partial: boolean;
    missingNutrients: NutrientKey[];
    unmatchedCount: number;
    /** True only when every matched ingredient carries a validated USDA FDC ID and data type. */
    hasVerifiableFdcIds: boolean;
    /** Matched ingredients whose heuristic match is only approximate. */
    approximateCount: number;
    /** Matched ingredients where the user did not state raw or cooked but the USDA food does. */
    unspecifiedPreparationCount: number;
  };
}
type InputCheck =
  | { ok: true; value: { text: string; servings: number } }
  | { ok: false; error: string };

const record = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === 'object' && !Array.isArray(x);

export function validateRecipeRequest(raw: unknown): InputCheck {
  if (!record(raw)) return { ok: false, error: 'Provide recipe text and a whole-number serving count.' };
  if (typeof raw.text !== 'string' || raw.text.trim().length < 5)
    return { ok: false, error: 'Enter at least five characters of recipe or ingredient text.' };
  if (raw.text.trim().length > RECIPE_TEXT_MAX || raw.text.length > RECIPE_TEXT_MAX)
    return { ok: false, error: 'Recipe text must be at most 5,000 characters.' };
  if (typeof raw.servings !== 'number' || !Number.isInteger(raw.servings) ||
      raw.servings < 1 || raw.servings > RECIPE_SERVINGS_MAX)
    return { ok: false, error: 'Servings must be a whole number between 1 and 100.' };
  return { ok: true, value: { text: raw.text.trim(), servings: raw.servings } };
}

function nutrientSet(value: unknown): NutrientSet | null {
  if (!record(value)) return null;
  for (const key of NUTRIENT_KEYS) {
    const n = value[key];
    if (n !== null && (typeof n !== 'number' || !Number.isFinite(n) || n < 0))
      return null;
  }
  return Object.fromEntries(NUTRIENT_KEYS.map(k => [k, value[k]])) as NutrientSet;
}
const bounded = (x: unknown, max = RECIPE_TEXT_MAX): x is string =>
  typeof x === 'string' && x.length <= max;
const nonempty = (x: unknown, max = RECIPE_TEXT_MAX): x is string =>
  bounded(x, max) && !!x.trim();

const RAW_WORDS = ['raw', 'uncooked'];
const COOKED_WORDS = ['cooked', 'boiled', 'baked', 'steamed', 'roasted', 'grilled', 'fried', 'braised'];
/** Same word lists as the CMS (usda.ts stateOf); "ambiguous" means both kinds of words appear. */
export function preparationState(text: string): PreparationState | 'ambiguous' | null {
  const words = new Set(text.toLowerCase().replace(/[()[\],;:]+/g, ' ').split(/\s+/).filter(Boolean));
  const raw = RAW_WORDS.some(w => words.has(w));
  const cooked = COOKED_WORDS.some(w => words.has(w));
  return raw && cooked ? 'ambiguous' : raw ? 'raw' : cooked ? 'cooked' : null;
}
/**
 * The CMS refuses explicit raw/cooked contradictions (matchConfidence "none" → unmatched).
 * If one reaches the frontend anyway, the contract is broken: fail closed rather than show
 * nutrition for the wrong preparation state.
 */
function preparationCheck(raw: string, name: string, usedFood: string): PreparationCheck | null {
  const asked = [preparationState(raw), preparationState(name)];
  if (asked.includes('ambiguous')) return null;
  const explicit = [...new Set(asked.filter((s): s is PreparationState => s === 'raw' || s === 'cooked'))];
  if (explicit.length > 1) return null;
  const matched = preparationState(usedFood);
  if (matched === 'ambiguous') return null;
  const requested = explicit[0] ?? null;
  if (requested && matched !== requested) return null;
  return { requested, matched, status: requested ? 'consistent' : matched ? 'unspecified' : 'unknown' };
}
function provenance(x: Record<string, unknown>): IngredientProvenance | null | undefined {
  const present = ['fdcId', 'dataType', 'matchConfidence'].filter(k => x[k] !== undefined);
  if (!present.length) return null; // older CMS: no provenance reported
  if (present.length !== 3 || !Number.isSafeInteger(x.fdcId) || (x.fdcId as number) <= 0 ||
      !USDA_DATA_TYPES.includes(x.dataType as UsdaDataType) ||
      (x.matchConfidence !== 'exact' && x.matchConfidence !== 'approx')) return undefined;
  const fdcId = x.fdcId as number;
  return { fdcId, dataType: x.dataType as UsdaDataType, matchConfidence: x.matchConfidence as MatchConfidence,
    fdcUrl: `https://fdc.nal.usda.gov/food-details/${fdcId}/nutrients` };
}

function ingredient(x: unknown): IngredientResult | null {
  if (!record(x) || !bounded(x.raw) || !nonempty(x.name) ||
      !nonempty(x.usedFood) || !Number.isFinite(x.quantity) ||
      (x.quantity as number) <= 0 || x.unit !== 'g' ||
      !(typeof x.originalQuantity === 'string' || 
        (typeof x.originalQuantity === 'number' && Number.isFinite(x.originalQuantity))) ||
      !bounded(x.originalUnit) || typeof x.unitConverted !== 'boolean')
    return null;
  const n = nutrientSet(x.nutrients);
  if (!n) return null;
  const source = provenance(x);
  if (source === undefined) return null;
  const preparation = preparationCheck(x.raw, x.name, x.usedFood);
  if (!preparation) return null;
  return {
    raw: x.raw, name: x.name, quantity: x.quantity as number, unit: 'g',
    originalQuantity: x.originalQuantity, originalUnit: x.originalUnit,
    unitConverted: x.unitConverted, usedFood: x.usedFood, nutrients: n,
    provenance: source, preparation,
  };
}

/**
 * CMS PR #76 returns null for unknown nutrients; the CMS currently in production initialized
 * totals at 0 and skipped nulls. Either way: mask any nutrient that is unavailable for a
 * matched ingredient, validate remaining 100g/portion arithmetic, mark unmatched items as
 * excluded and validate (never fabricate) USDA FDC IDs and data types.
 */
export function verifyRecipeResponse(payload: unknown, requestedServings: number): VerifiedRecipeResponse {
  if (!record(payload) || !Number.isInteger(requestedServings) || requestedServings < 1 ||
      requestedServings > RECIPE_SERVINGS_MAX || payload.servings !== requestedServings ||
      !Array.isArray(payload.ingredients) || !Array.isArray(payload.unmatched) ||
      !Array.isArray(payload.notes)) throw new Error('Invalid recipe analysis response.');
  if (payload.ingredients.length > 200 || payload.unmatched.length > 200 || payload.notes.length > 200)
    throw new Error('Unexpectedly large recipe analysis response.');

  const parsed = payload.ingredients.map(ingredient);
  if (parsed.some(x => x === null)) throw new Error('Invalid ingredient values returned.');
  const ingredients = parsed as IngredientResult[];
  const ids = ingredients.map(i => i.provenance).filter(Boolean);
  if (ids.length && ids.length !== ingredients.length)
    throw new Error('USDA provenance was reported for only some matched ingredients.');
  const unmatched: AnalyzeResponse['unmatched'] = [];
  for (const item of payload.unmatched) {
    if (!record(item) || !bounded(item.raw) || !bounded(item.name))
      throw new Error('Invalid unmatched ingredient data.');
    unmatched.push({ raw: item.raw, name: item.name });
  }
  const notes: string[] = [];
  for (const note of payload.notes) {
    if (!bounded(note, 2000)) throw new Error('Invalid analysis note.');
    notes.push(note);
  }

  if (!ingredients.length)
    throw new Error('No ingredient has a usable nutrition match. Try clearer quantities and ingredient names.');

  const recipe = nutrientSet(payload.perRecipe);
  const serving = nutrientSet(payload.perServing);
  if (!recipe || !serving) throw new Error('Invalid nutrient totals returned.');

  const missingNutrients: NutrientKey[] = [];
  const displayedRecipe = { ...recipe };
  const displayedServing = { ...serving };
  for (const key of NUTRIENT_KEYS) {
    if (ingredients.some(ing => ing.nutrients[key] === null) ||
        recipe[key] === null || serving[key] === null) {
      missingNutrients.push(key);
      displayedRecipe[key] = null;
      displayedServing[key] = null;
      continue;
    }
    const sum = ingredients.reduce((total, ing) => total + ing.nutrients[key]!, 0);
    // CMS rounds both displayed ingredient nutrients and final totals to 0.1.
    const ingredientTolerance = ingredients.length * 0.051 + 0.051;
    const portionTolerance = requestedServings * 0.051 + 0.051;
    if (Math.abs(sum - recipe[key]!) > ingredientTolerance ||
        Math.abs(serving[key]! * requestedServings - recipe[key]!) > portionTolerance)
      throw new Error('Inconsistent ingredient or serving totals returned. No nutrition totals shown.');
  }

  return {
    perRecipe: displayedRecipe,
    perServing: displayedServing,
    servings: requestedServings,
    ingredients,
    unmatched,
    notes,
    coverage: {
      partial: unmatched.length > 0 || missingNutrients.length > 0,
      missingNutrients,
      unmatchedCount: unmatched.length,
      hasVerifiableFdcIds: ingredients.length > 0 && ingredients.every(i => i.provenance !== null),
      approximateCount: ingredients.filter(i => i.provenance?.matchConfidence === 'approx').length,
      unspecifiedPreparationCount: ingredients.filter(i => i.preparation.status === 'unspecified').length,
    },
  };
}

/**
 * Map a non-OK CMS status to the fixed message the proxy returns. Upstream bodies are never
 * forwarded (they could echo recipe text or provider details).
 */
export function upstreamFailure(status: number): { status: number; error: string } {
  if (status === 429) return { status: 429, error: 'Recipe analysis is busy. Try again later.' };
  if (status === 503) return { status: 503, error: 'Nutrition lookup or ingredient parsing is unavailable.' };
  if (status === 400) return { status: 400, error: 'The recipe could not be analyzed. Review ingredient quantities.' };
  // 422: the recipe was parsed but NO ingredient matched usable USDA data (CMS PR #76).
  if (status === 422) return { status: 422, error: 'No ingredient could be matched to usable USDA nutrition data, so no totals are shown. Add amounts in grams or common units, and clear food names with raw or cooked state.' };
  return { status: 502, error: 'The nutrition analysis provider could not complete this request.' };
}
