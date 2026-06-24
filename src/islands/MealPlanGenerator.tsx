/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { RECIPES, DIET_OPTIONS, ALLERGEN_OPTIONS, type Allergen, type Diet } from '../data/recipes';
import {
  generatePlan,
  swapMeal,
  setServings,
  recomputeDay,
  groceryList,
  isBelowFloor,
  SAFE_CALORIE_FLOOR,
  MACRO_TOLERANCE,
  withinTolerance,
  type MacroTargets,
  type PlanInputs,
  type PlannedDay,
  type MealPlan,
} from '../lib/mealplan';
import { MEAL_PLAN } from '../consts';

type Status = 'idle' | 'ok' | 'below-floor' | 'no-pool';

const DEFAULTS: MacroTargets = { calories: 2000, protein: 150, carbs: 200, fat: 67 };
const DAY_NAMES = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const num = (v: string, fallback: number): number => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};
const r0 = (n: number) => Math.round(n);

export default function MealPlanGenerator() {
  const [targets, setTargets] = useState<MacroTargets>(DEFAULTS);
  const [diet, setDiet] = useState<'omnivore' | Diet>('omnivore');
  const [mealsPerDay, setMealsPerDay] = useState<3 | 4 | 5>(4);
  const [excludeAllergens, setExcludeAllergens] = useState<Allergen[]>([]);
  const [excludeText, setExcludeText] = useState('');

  const [days, setDays] = useState<PlannedDay[] | null>(null);
  const [planTargets, setPlanTargets] = useState<MacroTargets | null>(null);
  const [inputsUsed, setInputsUsed] = useState<PlanInputs | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [aiNote, setAiNote] = useState('');
  const [busy, setBusy] = useState(false);
  const seedRef = useRef(1);

  // Pre-fill targets from the Macro/Calorie calculators via URL params.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const next = { ...DEFAULTS };
      let any = false;
      for (const k of ['calories', 'protein', 'carbs', 'fat'] as const) {
        const v = p.get(k);
        if (v && Number.isFinite(parseFloat(v))) {
          next[k] = Math.round(parseFloat(v));
          any = true;
        }
      }
      if (any) setTargets(next);
    } catch {
      /* no-op */
    }
  }, []);

  const buildInputs = (): PlanInputs => ({
    targets,
    diet,
    mealsPerDay,
    excludeAllergens,
    excludeText,
  });

  const runLocal = (inputs: PlanInputs, seed: number) => {
    const plan = generatePlan(RECIPES, inputs, seed);
    if (!plan) {
      setStatus('no-pool');
      setDays(null);
      return;
    }
    setDays(plan.days);
    setPlanTargets(inputs.targets);
    setInputsUsed(inputs);
    setStatus('ok');
  };

  const generate = () => {
    setAiNote('');
    if (isBelowFloor(targets.calories)) {
      setStatus('below-floor');
      setDays(null);
      return;
    }
    seedRef.current += 1;
    runLocal(buildInputs(), seedRef.current);
  };

  const regenerate = () => {
    if (status !== 'ok') return;
    seedRef.current += 1;
    runLocal(inputsUsed ?? buildInputs(), seedRef.current);
  };

  // Optional AI generation (only when an endpoint is configured). Validated
  // against the macro math; falls back to the local algorithm on any problem.
  const generateAI = async () => {
    if (isBelowFloor(targets.calories)) {
      setStatus('below-floor');
      setDays(null);
      return;
    }
    const inputs = buildInputs();
    setBusy(true);
    setAiNote('');
    try {
      const res = await fetch(MEAL_PLAN.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error('bad response');
      const data = (await res.json()) as { days?: { meals?: any[] }[] };
      const plan = normalizeAi(data, inputs);
      if (!plan) throw new Error('invalid plan');
      setDays(plan.days);
      setPlanTargets(inputs.targets);
      setInputsUsed(inputs);
      setStatus('ok');
      setAiNote('Generated with AI and checked against your macro targets.');
    } catch {
      seedRef.current += 1;
      runLocal(inputs, seedRef.current);
      setAiNote('AI generation was unavailable, so we built your plan from our recipe library instead.');
    } finally {
      setBusy(false);
    }
  };

  const toggleAllergen = (a: Allergen) =>
    setExcludeAllergens((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const doSwap = (dayIdx: number, mealIdx: number) => {
    if (!inputsUsed || !days) return;
    seedRef.current += 1;
    const next = swapMeal(RECIPES, inputsUsed, days[dayIdx], mealIdx, seedRef.current);
    if (!next) return;
    const meals = days[dayIdx].meals.map((m, i) => (i === mealIdx ? next : m));
    const updated = days.map((d, i) => (i === dayIdx ? recomputeDay(meals) : d));
    setDays(updated);
  };

  const changeServings = (dayIdx: number, mealIdx: number, delta: number) => {
    if (!days) return;
    const meal = days[dayIdx].meals[mealIdx];
    const next = setServings(RECIPES, meal, meal.servings + delta);
    const meals = days[dayIdx].meals.map((m, i) => (i === mealIdx ? next : m));
    const updated = days.map((d, i) => (i === dayIdx ? recomputeDay(meals) : d));
    setDays(updated);
  };

  const downloadPdf = async () => {
    if (!days || !planTargets) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const M = 40;
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = M;
    const line = (text: string, size = 10, bold = false, gap = 14) => {
      if (y > H - M) {
        doc.addPage();
        y = M;
      }
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.text(text, M, y);
      y += gap;
    };
    doc.setTextColor(15, 23, 42);
    line('Your 7-Day Meal Plan', 18, true, 22);
    line(
      `Target: ${r0(planTargets.calories)} kcal · ${r0(planTargets.protein)}g protein · ${r0(planTargets.carbs)}g carbs · ${r0(planTargets.fat)}g fat`,
      10,
      false,
      20,
    );
    days.forEach((d, i) => {
      const t = d.totals;
      line(
        `${DAY_NAMES[i]} — ${r0(t.calories)} kcal · ${r0(t.protein)}P / ${r0(t.carbs)}C / ${r0(t.fat)}F`,
        12,
        true,
        16,
      );
      d.meals.forEach((m) => {
        line(
          `   ${MEAL_LABEL[m.type]}: ${m.name} (${m.servings}x) — ${m.kcal} kcal, ${r0(m.protein)}P/${r0(m.carbs)}C/${r0(m.fat)}F`,
          9,
          false,
          12,
        );
      });
      y += 6;
    });
    if (y > H - M - 40) {
      doc.addPage();
      y = M;
    }
    y += 6;
    line('Grocery list', 14, true, 18);
    groceryList({ days, targets: planTargets, allWithinTolerance: false }).forEach((g) => {
      line(`   • ${g.name}${g.count > 1 ? `  (x${g.count})` : ''}`, 9, false, 12);
    });
    y += 8;
    line(
      'Educational estimate, not medical advice. Consult a qualified professional.',
      8,
      false,
      10,
    );
    doc.save('healthylifestyles-meal-plan.pdf');
  };

  const macroKcal = targets.protein * 4 + targets.carbs * 4 + targets.fat * 9;
  const macroMismatch = Math.abs(macroKcal - targets.calories) / Math.max(targets.calories, 1) > 0.1;
  const grocery = days && planTargets ? groceryList({ days, targets: planTargets, allWithinTolerance: false }) : [];
  const aiEnabled = !!MEAL_PLAN.endpoint;

  return (
    <div class="mpg">
      {/* ---------------- Inputs ---------------- */}
      <div class="mpg__form card">
        <h2 class="mpg__h">Your daily targets</h2>
        <div class="mpg__targets">
          <label class="mpg__field">
            <span>Calories</span>
            <input type="number" min="0" value={targets.calories}
              onInput={(e) => { const v = num((e.target as HTMLInputElement).value, 0); setTargets((t) => ({ ...t, calories: v })); }} />
            <small>kcal/day</small>
          </label>
          <label class="mpg__field">
            <span>Protein</span>
            <input type="number" min="0" value={targets.protein}
              onInput={(e) => { const v = num((e.target as HTMLInputElement).value, 0); setTargets((t) => ({ ...t, protein: v })); }} />
            <small>g</small>
          </label>
          <label class="mpg__field">
            <span>Carbs</span>
            <input type="number" min="0" value={targets.carbs}
              onInput={(e) => { const v = num((e.target as HTMLInputElement).value, 0); setTargets((t) => ({ ...t, carbs: v })); }} />
            <small>g</small>
          </label>
          <label class="mpg__field">
            <span>Fat</span>
            <input type="number" min="0" value={targets.fat}
              onInput={(e) => { const v = num((e.target as HTMLInputElement).value, 0); setTargets((t) => ({ ...t, fat: v })); }} />
            <small>g</small>
          </label>
        </div>
        {macroMismatch && (
          <p class="mpg__hint">
            Heads up: your macros add up to about {r0(macroKcal)} kcal, which differs from your calorie target.
            That’s fine — we plan to your calorie number. Use the{' '}
            <a href="/tools/macro-calculator">Macro Calculator</a> for balanced numbers.
          </p>
        )}

        <div class="mpg__row">
          <label class="mpg__field">
            <span>Diet style</span>
            <select value={diet} onChange={(e) => setDiet((e.target as HTMLSelectElement).value as any)}>
              {DIET_OPTIONS.map((d) => <option value={d.value}>{d.label}</option>)}
            </select>
          </label>
          <label class="mpg__field">
            <span>Meals per day</span>
            <select value={String(mealsPerDay)}
              onChange={(e) => setMealsPerDay(Number((e.target as HTMLSelectElement).value) as 3 | 4 | 5)}>
              <option value="3">3 (breakfast, lunch, dinner)</option>
              <option value="4">4 (+ 1 snack)</option>
              <option value="5">5 (+ 2 snacks)</option>
            </select>
          </label>
        </div>

        <fieldset class="mpg__allergens">
          <legend>Avoid allergens</legend>
          <div class="mpg__chips">
            {ALLERGEN_OPTIONS.map((a) => (
              <label class={`mpg__chip${excludeAllergens.includes(a.value) ? ' is-on' : ''}`}>
                <input type="checkbox" checked={excludeAllergens.includes(a.value)} onChange={() => toggleAllergen(a.value)} />
                <span>{a.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label class="mpg__field">
          <span>Other foods to exclude (optional)</span>
          <input type="text" value={excludeText} placeholder="e.g. pork, mushrooms, tuna"
            onInput={(e) => setExcludeText((e.target as HTMLInputElement).value)} />
        </label>

        <div class="mpg__actions">
          <button type="button" class="btn btn-primary btn-lg" onClick={generate} disabled={busy}>
            {days ? 'Rebuild plan' : 'Generate my 7-day plan'}
          </button>
          {aiEnabled && (
            <button type="button" class="btn btn-outline" onClick={generateAI} disabled={busy}>
              {busy ? 'Generating…' : '✨ Generate with AI'}
            </button>
          )}
          {status === 'ok' && (
            <button type="button" class="btn btn-outline" onClick={regenerate} disabled={busy}>
              Shuffle
            </button>
          )}
        </div>
      </div>

      {/* ---------------- Safety / errors ---------------- */}
      {status === 'below-floor' && (
        <div class="mpg__safety" role="note">
          <strong>Let’s keep this safe.</strong>
          <p>
            A target of {r0(targets.calories)} kcal/day is below the level we’ll build a plan for
            (about {SAFE_CALORIE_FLOOR} kcal). Very-low-calorie diets can be unsafe and tend to
            backfire. Please raise your calories — and if a very low intake was recommended to you,
            work with a registered dietitian or your doctor rather than a generator.
          </p>
          <p class="mpg__safety-links">
            Try the <a href="/tools/calorie-calculator">Calorie Calculator</a> for a sustainable
            target, or read <a href="/wellness-hub/how-many-calories-to-lose-weight">how many calories
            to eat to lose weight</a>.
          </p>
        </div>
      )}
      {status === 'no-pool' && (
        <div class="mpg__safety mpg__safety--soft" role="note">
          <strong>Not enough recipes for those filters.</strong>
          <p>Your diet + exclusions ruled out too many meals. Try removing an exclusion or choosing a broader diet style.</p>
        </div>
      )}
      {aiNote && <p class="mpg__ainote">{aiNote}</p>}

      {/* ---------------- Plan ---------------- */}
      {status === 'ok' && days && planTargets && (
        <div class="mpg__plan">
          <p class="sr-only" role="status" aria-live="polite">
            Your 7-day meal plan is ready, built for {planTargets.calories} calories per day.
          </p>
          <div class="mpg__plan-head">
            <h2 class="mpg__h">Your week</h2>
            <button type="button" class="btn btn-outline mpg__pdf" onClick={downloadPdf}>
              Download PDF
            </button>
          </div>

          <div class="mpg__days">
            {days.map((day, di) => (
              <section class="mpg__day card">
                <header class="mpg__day-head">
                  <h3>{DAY_NAMES[di]}</h3>
                  <span class={`mpg__day-badge${withinTolerance(day, planTargets) ? ' is-on' : ''}`}>
                    {withinTolerance(day, planTargets) ? 'On target' : 'Close'}
                  </span>
                </header>

                <div class="mpg__bars">
                  {([
                    ['Calories', day.totals.calories, planTargets.calories, 'kcal'],
                    ['Protein', day.totals.protein, planTargets.protein, 'g'],
                    ['Carbs', day.totals.carbs, planTargets.carbs, 'g'],
                    ['Fat', day.totals.fat, planTargets.fat, 'g'],
                  ] as [string, number, number, string][]).map(([label, got, want, unit]) => {
                    const pct = want > 0 ? Math.min(100, (got / want) * 100) : 0;
                    const ok = want <= 0 || Math.abs(got - want) / want <= MACRO_TOLERANCE;
                    return (
                      <div class="mpg__bar">
                        <div class="mpg__bar-top">
                          <span>{label}</span>
                          <span>{r0(got)}/{r0(want)} {unit}</span>
                        </div>
                        <div class="mpg__bar-track">
                          <div class={`mpg__bar-fill ${ok ? 'is-ok' : 'is-off'}`} style={`width:${pct}%`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <ul class="mpg__meals">
                  {day.meals.map((m, mi) => (
                    <li class="mpg__meal">
                      <div class="mpg__meal-main">
                        <span class="mpg__meal-type">{MEAL_LABEL[m.type]}</span>
                        <span class="mpg__meal-name">{m.name}</span>
                        <span class="mpg__meal-macros">{m.kcal} kcal · {r0(m.protein)}P / {r0(m.carbs)}C / {r0(m.fat)}F</span>
                      </div>
                      <div class="mpg__meal-controls">
                        <div class="mpg__stepper" role="group" aria-label={`Servings for ${m.name}`}>
                          <button type="button" onClick={() => changeServings(di, mi, -0.25)} aria-label="Fewer servings">−</button>
                          <span>{m.servings}×</span>
                          <button type="button" onClick={() => changeServings(di, mi, 0.25)} aria-label="More servings">+</button>
                        </div>
                        <button type="button" class="mpg__swap" onClick={() => doSwap(di, mi)}>Swap</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Grocery list */}
          <section class="mpg__grocery card">
            <h2 class="mpg__h">Grocery list</h2>
            <p class="mpg__grocery-sub">Everything you need for the week, deduplicated. The number shows how many meals use it.</p>
            <ul class="mpg__grocery-list">
              {grocery.map((g) => (
                <li>
                  <span>{g.name}</span>
                  {g.count > 1 && <span class="mpg__grocery-count">×{g.count}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );

  // ---- AI response normalizer (defensive; validates macros) ----
  function normalizeAi(data: { days?: { meals?: any[] }[] }, inputs: PlanInputs): MealPlan | null {
    if (!data || !Array.isArray(data.days) || data.days.length < 1) return null;
    const out: PlannedDay[] = [];
    for (const d of data.days.slice(0, 7)) {
      if (!Array.isArray(d.meals) || !d.meals.length) return null;
      const meals = d.meals.map((m: any) => ({
        type: (['breakfast', 'lunch', 'dinner', 'snack'].includes(m.type) ? m.type : 'lunch'),
        recipeId: 'ai-' + Math.abs(hash(String(m.name || ''))),
        name: String(m.name || 'Meal'),
        servings: Number(m.servings) > 0 ? Number(m.servings) : 1,
        kcal: Math.round(Number(m.kcal ?? m.calories) || 0),
        protein: Number(m.protein) || 0,
        carbs: Number(m.carbs) || 0,
        fat: Number(m.fat) || 0,
        ingredients: Array.isArray(m.ingredients) ? m.ingredients.map(String) : [],
      }));
      out.push(recomputeDay(meals));
    }
    // Validate: at least most days must land within tolerance, else reject.
    const okDays = out.filter((day) => withinTolerance(day, inputs.targets)).length;
    if (okDays < Math.ceil(out.length / 2)) return null;
    return { days: out, targets: inputs.targets, allWithinTolerance: okDays === out.length };
  }

  function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
  }
}
