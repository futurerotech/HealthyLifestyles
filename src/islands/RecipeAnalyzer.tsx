/** @jsxImportSource preact */
import { useState } from 'preact/hooks';

/* ── Types ─────────────────────────────────────────────────────────── */
interface NutrientSet {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

interface IngredientResult {
  raw: string;
  name: string;
  quantity: number;
  unit: string;
  originalQuantity: number | string;
  originalUnit: string;
  unitConverted: boolean;
  usedFood: string;
  nutrients: NutrientSet;
}

interface AnalyzeResponse {
  perRecipe: NutrientSet;
  perServing: NutrientSet;
  ingredients: IngredientResult[];
  unmatched: { raw: string; name: string }[];
  servings: number;
  notes: string[];
}

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
  const total = protein + carbs + fat;
  if (total <= 0) return null;

  const pPct = (protein / total) * 100;
  const cPct = (carbs / total) * 100;
  const fPct = (fat / total) * 100;

  // SVG donut segments
  const R = 15.915; // circumference = 100
  const dashP = pPct;
  const dashC = cPct;
  const dashF = fPct;
  const offsetP = 0;
  const offsetC = dashP;
  const offsetF = dashP + dashC;

  return (
    <div class="ra__ring-wrap">
      <svg viewBox="0 0 36 36" class="ra__ring" role="img" aria-label="Macro breakdown">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" stroke-width="5" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke={MACRO_COLORS.protein} stroke-width="5"
          stroke-dasharray={`${dashP} ${100 - dashP}`} stroke-dashoffset={offsetP} transform="rotate(-90 18 18)" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke={MACRO_COLORS.carbs} stroke-width="5"
          stroke-dasharray={`${dashC} ${100 - dashC}`} stroke-dashoffset={-offsetC} transform="rotate(-90 18 18)" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke={MACRO_COLORS.fat} stroke-width="5"
          stroke-dasharray={`${dashF} ${100 - dashF}`} stroke-dashoffset={-offsetF} transform="rotate(-90 18 18)" />
      </svg>
      <div class="ra__ring-legend">
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
  const [servings, setServings] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState('');

  const analyze = async (e: Event) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), servings }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Analysis failed. Please try again.');
      } else {
        setResult(data);
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
            maxLength={5000}
            required
          />
          <p class="ra__hint">Include quantities and units for the best results. e.g. "200g chicken breast, 1 cup rice, 2 eggs"</p>
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
              value={servings}
              onInput={(e) => setServings(Number((e.target as HTMLInputElement).value) || 1)}
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
          {/* Per-serving headline + macro ring */}
          <div class="ra__headline card">
            <div class="ra__headline-left">
              <span class="ra__headline-label">Per serving ({result.servings} servings)</span>
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
            <h3 class="ra__section-title">Full nutrition per serving</h3>
            <table class="ra__table">
              <thead>
                <tr><th>Nutrient</th><th>Per serving</th><th>Per recipe</th></tr>
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
              Values shown as &ldquo;&mdash;&rdquo; mean the USDA did not report that nutrient for one or more ingredients.
              A missing value does <strong>not</strong> mean zero.
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
                      <span class="ra__badge ra__badge--converted" title="Volume or count was converted to grams">converted</span>
                    )}
                  </div>
                  <div class="ra__ing-detail">
                    <span class="ra__ing-grams">{ing.quantity.toFixed(0)}g</span>
                    <span class="ra__ing-match">USDA: {ing.usedFood}</span>
                  </div>
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
                <p class="ra__unmatched-note">These items were excluded from the nutrition totals. Try rephrasing with more specific ingredient names.</p>
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
            Nutrition values are estimates for general education, not medical or dietary advice.
            Values are based on USDA generic ingredient data; brands, preparation methods, and cooking
            can change actual values significantly. For medical nutrition therapy, consult a registered
            dietitian or your clinician.
          </p>
        </div>
      )}
    </div>
  );
}
