/** @jsxImportSource preact */
import { useState } from 'preact/hooks';

import {
  type NutrientSet, type VerifiedRecipeResponse, RECIPE_TEXT_MAX,
  validateRecipeRequest, verifyRecipeResponse,
} from '../lib/recipeAnalysis';

/* ── Constants ─────────────────────────────────────────────────────── */
const MACRO_COLORS = { protein: '#3b82f6', carbs: '#f97316', fat: '#16a34a' };
const NUTRIENT_LABELS: { key: keyof NutrientSet; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g' },
  { key: 'fat', label: 'Total Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugars', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
];

const EXAMPLE = `200g chicken breast
1 cup white rice (raw)
1 tbsp olive oil
2 large eggs
1 medium onion`;

const fmt = (v: number | null, unit: string): string =>
  v != null ? `${Math.round(v * 10) / 10}${unit ? ' ' + unit : ''}` : '\u2014';

/* ── Macro Ring (SVG donut) ────────────────────────────────────────── */
function MacroRing({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  // Approximate macro-derived *energy* shares, not grams or USDA energy.
  const kcalP = protein * 4;
  const kcalC = carbs * 4;
  const kcalF = fat * 9;
  const total = kcalP + kcalC + kcalF;
  if (!Number.isFinite(total) || total <= 0) return null;

  const pPct = (kcalP / total) * 100;
  const cPct = (kcalC / total) * 100;
  const fPct = (kcalF / total) * 100;

  // SVG donut segments
  const dashP = pPct;
  const dashC = cPct;
  const dashF = fPct;
  const offsetP = 0;
  const offsetC = dashP;
  const offsetF = dashP + dashC;

  return (
    <div class="ra__ring-wrap">
      <svg viewBox="0 0 36 36" class="ra__ring" role="img" aria-label="Approximate energy shares from protein carbohydrate and fat using 4 4 9 kcal per gram">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" stroke-width="5" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke={MACRO_COLORS.protein} stroke-width="5"
          stroke-dasharray={`${dashP} ${100 - dashP}`} stroke-dashoffset={offsetP} transform="rotate(-90 18 18)" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke={MACRO_COLORS.carbs} stroke-width="5"
          stroke-dasharray={`${dashC} ${100 - dashC}`} stroke-dashoffset={-offsetC} transform="rotate(-90 18 18)" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke={MACRO_COLORS.fat} stroke-width="5"
          stroke-dasharray={`${dashF} ${100 - dashF}`} stroke-dashoffset={-offsetF} transform="rotate(-90 18 18)" />
      </svg>
      <div class="ra__ring-legend">
        <strong class="ra__ring-label">Approx. macro energy (4/4/9 kcal/g)</strong>
        <span class="ra__legend-item"><span class="ra__dot" style={{ background: MACRO_COLORS.protein }} />Protein {pPct.toFixed(0)}%</span>
        <span class="ra__legend-item"><span class="ra__dot" style={{ background: MACRO_COLORS.carbs }} />Carbs {cPct.toFixed(0)}%</span>
        <span class="ra__legend-item"><span class="ra__dot" style={{ background: MACRO_COLORS.fat }} />Fat {fPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────── */
export default function RecipeAnalyzer() {
  const [text, setText] = useState('');
  const [servings, setServings] = useState('4');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedRecipeResponse | null>(null);
  const [error, setError] = useState('');

  const analyze = async (e: Event) => {
    e.preventDefault();
    if (loading) return;
    const input = validateRecipeRequest({ text, servings: Number(servings) });
    if (!input.ok) {
      setError(input.error);
      setResult(null);
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.value),
        cache: 'no-store',
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data &&
          typeof data.error === 'string' ? data.error : 'Recipe analysis failed. Please try again.';
        setError(message);
      } else {
        try { setResult(verifyRecipeResponse(data, input.value.servings)); }
        catch { setError('The nutrition totals could not be verified. No result was displayed.'); }
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="calc ra">
      {/* ── Form ─────────────────────────────────────────────────── */}
      <form class="ra__form" onSubmit={analyze}>
        <div class="ra__field">
          <label class="ra__label" for="ra-text">Paste your recipe or ingredient list</label>
          <textarea
            id="ra-text"
            class="ra__textarea"
            rows={6}
            placeholder={EXAMPLE}
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            maxLength={RECIPE_TEXT_MAX}
            aria-describedby="ra-text-count"
            required
          />
          {/* Browsers cut pasted text at maxLength without notice; show the limit. */}
          <p class="ra__hint" id="ra-text-count">
            {text.length.toLocaleString('en-US')} / {RECIPE_TEXT_MAX.toLocaleString('en-US')} characters{text.length >= RECIPE_TEXT_MAX ? ' — limit reached; longer text was cut off, so check that every ingredient is included.' : ''}
          </p>
          <p class="ra__hint">
            Include specific amounts and raw/cooked state (e.g., "200 g raw chicken",
            "0.5 cup cooked rice"). Cups, tablespoons and whole items are converted
            to approximate grams; the service may not recognize every amount or food.
          </p>
          <p class="ra__privacy" role="note">
            <strong>Before submitting:</strong> Recipe text is sent to the website server
            and may be forwarded to the configured third-party AI parsing provider;
            ingredient search names are sent to USDA FoodData Central. This tool
            does not verify third-party retention or deletion practices. Do not
            include names, medical details or other sensitive information.
          </p>
        </div>
        <div class="ra__field-row">
          <div class="ra__field ra__field--servings">
            <label class="ra__label" for="ra-servings">Servings</label>
            <input
              id="ra-servings"
              type="number"
              class="ra__input"
              min="1"
              max="100"
              step="1"
              inputMode="numeric"
              value={servings}
              onInput={(e) => setServings((e.target as HTMLInputElement).value)}
              required
            />
          </div>
          <button type="submit" class="ra__btn ra__btn--primary" disabled={loading || !text.trim()}>
            {loading ? 'Analyzing...' : 'Analyze recipe'}
          </button>
        </div>
      </form>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div class="ra__error" role="alert">
          {error}
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div class="ra__loading">
          <div class="ra__spinner" />
          <p>Parsing ingredients and looking up USDA nutrition data...</p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {result && !loading && (
        <div class="ra__results">
          {result.coverage.partial && (
            <div class="ra__error" role="status">
              <strong>Partial nutrition estimate:</strong> {result.coverage.unmatchedCount > 0
                ? result.coverage.unmatchedCount + ' ingredient(s) were not matched and are excluded. '
                : ''}
              {result.coverage.missingNutrients.length > 0
                ? 'Some nutrient values were not reported for all matched foods and are shown as —. '
                : ''}
              The remaining values describe the matched-ingredient subtotal,
              divided by your requested servings; they are NOT complete recipe totals.
            </div>
          )}
          <p class="ra__provenance" role="note">
            {result.coverage.hasVerifiableFdcIds
              ? <>Each matched food shows its USDA FoodData Central record (FDC ID and data type) so
                  you can check the selection on the USDA site.</>
              : <>Food matches come from USDA FoodData Central searches, but this response does not
                  supply USDA FDC IDs or data types for individual matches, so each selection cannot
                  be independently verified here.</>}
            {' '}<strong>Match confidence is a heuristic</strong>: “exact” means most words of your
            ingredient name appear in the USDA description; “approximate” means only some do. Neither
            confirms the same food, brand, cut or preparation. Check ingredients and quantities.
          </p>
          {(result.coverage.approximateCount > 0 || result.coverage.unspecifiedPreparationCount > 0) && (
            <p class="ra__provenance" role="status">
              {result.coverage.approximateCount > 0 && <>{result.coverage.approximateCount} ingredient(s) matched only approximately. </>}
              {result.coverage.unspecifiedPreparationCount > 0 && <>{result.coverage.unspecifiedPreparationCount} ingredient(s) did not say raw or cooked; the matched USDA food states one, and raw and cooked values differ substantially. </>}
              Review those rows below.
            </p>
          )}
          {/* Per-serving headline + macro ring */}
          <div class="ra__headline card">
            <div class="ra__headline-left">
              <span class="ra__headline-label">{result.coverage.partial ? 'Matched-food contribution' : 'Estimated per serving'} ({result.servings} planned servings)</span>
              <span class="ra__headline-calories">
                {fmt(result.perServing.calories, 'kcal')}
              </span>
              <span class="ra__headline-sub">
                Protein {fmt(result.perServing.protein, 'g')} · Carbs {fmt(result.perServing.carbs, 'g')} · Fat {fmt(result.perServing.fat, 'g')}
              </span>
            </div>
            {result.perServing.protein != null && result.perServing.carbs != null && result.perServing.fat != null && (
              <MacroRing
                protein={result.perServing.protein}
                carbs={result.perServing.carbs}
                fat={result.perServing.fat}
              />
            )}
          </div>

          {/* Full nutrient table */}
          <div class="ra__table-block card">
            <h3 class="ra__section-title">Estimated nutrition from matched ingredients</h3>
            <table class="ra__table">
              <thead>
                <tr><th>Nutrient</th><th>Per planned serving</th><th>Matched-food subtotal</th></tr>
              </thead>
              <tbody>
                {NUTRIENT_LABELS.map(({ key, label, unit }) => (
                  <tr key={key}>
                    <td class="ra__cell-label">{label}</td>
                    <td class="ra__cell-val">{fmt(result.perServing[key], unit)}</td>
                    <td class="ra__cell-val ra__cell-muted">{fmt(result.perRecipe[key], unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p class="ra__table-note">
              A dash (&mdash;) means at least one matched ingredient lacks a
              usable value for that nutrient; it does <strong>not</strong> mean
              zero. Numbers are rounded, approximate and may exclude unmatched foods.
              Per-serving values divide the matched-food subtotal by the planned
              serving count. Different USDA food types, preparation and ingredient
              substitutions can change the outcome.
            </p>
          </div>

          {/* Per-ingredient list */}
          <div class="ra__ingredients card">
            <h3 class="ra__section-title">Ingredients &amp; USDA matches</h3>
            <ul class="ra__ing-list">
              {result.ingredients.map((ing, i) => (
                <li key={i} class="ra__ing">
                  <div class="ra__ing-head">
                    <span class="ra__ing-raw">{ing.raw}</span>
                    {ing.unitConverted && (
                      <span class="ra__badge ra__badge--converted" title="Volume or count converted using an approximate food-specific or generic weight assumption">converted</span>
                    )}
                  </div>
                  <div class="ra__ing-detail">
                    <span class="ra__ing-grams">{fmt(ing.quantity, 'g')}</span>
                    <span class="ra__ing-match">Reported database match: {ing.usedFood}</span>
                  </div>
                  {ing.provenance && (
                    <div class="ra__ing-source">
                      <span class={`ra__badge ra__badge--${ing.provenance.matchConfidence}`}
                        title={ing.provenance.matchConfidence === 'exact'
                          ? 'Heuristic: most words of the ingredient name appear in the USDA description'
                          : 'Heuristic: only some words match; verify the food and preparation state'}>
                        {ing.provenance.matchConfidence === 'exact' ? 'name match' : 'approximate match'}
                      </span>
                      <span>USDA {ing.provenance.dataType}, FDC ID{' '}
                        <a href={ing.provenance.fdcUrl} target="_blank" rel="noopener noreferrer">{ing.provenance.fdcId}</a>
                      </span>
                    </div>
                  )}
                  {ing.preparation.status === 'unspecified' && (
                    <p class="ra__ing-note">
                      You did not state raw or cooked; this USDA food is <strong>{ing.preparation.matched}</strong>.
                      Add the state to your ingredient line if it differs.
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {result.unmatched.length > 0 && (
              <div class="ra__unmatched">
                <h4 class="ra__unmatched-title">Could not identify:</h4>
                <ul class="ra__unmatched-list">
                  {result.unmatched.map((u, i) => (
                    <li key={i}>{u.raw}</li>
                  ))}
                </ul>
                <p class="ra__unmatched-note">These foods were excluded from the matched-food subtotal; the result does not represent a complete recipe. Include clearer amounts, units and raw/cooked descriptions.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {result.notes.length > 0 && (
            <div class="ra__notes">
              <h4>Notes on accuracy</h4>
              <ul>{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}

          {/* Disclaimer */}
          <p class="ra__disclaimer">
            Nutrition values are educational approximations, not medical advice
            or laboratory measurements. CMS parsing and household-unit assumptions
            may be wrong; USDA matches may represent SR Legacy, Foundation or Branded
            data, and nutrients can be missing. Do not rely on this tool for insulin
            dosing, food-allergen safety, a prescribed nutrient restriction or
            medical nutrition therapy. Check product labels and consult a registered
            dietitian or clinician when accurate values matter.
          </p>
        </div>
      )}
    </div>
  );
}
