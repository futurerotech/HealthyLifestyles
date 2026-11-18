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
  usedFood: string; // only a name; CMS does NOT return an FDC ID or data type
  nutrients: NutrientSet;
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
    /** Per-ingredient database identifiers are not returned by this CMS API. */
    hasVerifiableFdcIds: false;
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
  return {
    raw: x.raw, name: x.name, quantity: x.quantity as number, unit: 'g',
    originalQuantity: x.originalQuantity, originalUnit: x.originalUnit,
    unitConverted: x.unitConverted, usedFood: x.usedFood, nutrients: n,
  };
}

/**
 * The CMS totals currently initialize all nutrients at 0 and skip null values.
 * This can silently present unavailable nutrients as zero. We cannot fix the
 * CMS in a frontend PR: mask any nutrient that is unavailable for a matched
 * ingredient, validate remaining 100g/portion arithmetic and mark unmatched
 * items as excluded. Never fabricate missing USDA FDC IDs or data types.
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
      hasVerifiableFdcIds: false,
    },
  };
}
