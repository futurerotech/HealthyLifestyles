/** @jsxImportSource preact */
import { useRef, useState } from 'preact/hooks';
import {
  computeHealthspan,
  type HealthspanInput,
  type HealthspanResult,
  type Sex,
  type Smoking,
  type Social,
  type Stress,
  type Upf,
} from '../lib/healthspan';

type Units = 'metric' | 'imperial';

interface FormState {
  age: number;
  sex: Sex;
  activityMinutes: number;
  fruitVeg: number;
  ultraProcessed: Upf;
  smoking: Smoking;
  drinksPerWeek: number;
  sleepHours: number;
  stress: Stress;
  social: Social;
  /** Optional — 0 means "not provided". */
  waist: number;
  height: number;
}

const DEFAULTS: FormState = {
  age: 35,
  sex: 'female',
  activityMinutes: 90,
  fruitVeg: 3,
  ultraProcessed: 'sometimes',
  smoking: 'never',
  drinksPerWeek: 3,
  sleepHours: 7,
  stress: 'moderate',
  social: 'some',
  waist: 0,
  height: 0,
};

const num = (v: string, fb = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};

const BAND_COLOR: Record<HealthspanResult['band'], string> = {
  excellent: '#15803d',
  good: '#b45309',
  'needs-attention': '#b91c1c',
};

const ratioColor = (r: number) => (r >= 0.8 ? '#16a34a' : r >= 0.4 ? '#d97706' : '#dc2626');

export default function HealthspanScore() {
  const [units, setUnits] = useState<Units>('metric');
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [result, setResult] = useState<HealthspanResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const switchUnits = (next: Units) => {
    if (next === units) return;
    const toIn = (cm: number) => Math.round(cm * 0.393701);
    const toCm = (inch: number) => Math.round(inch / 0.393701);
    setForm((f) => ({
      ...f,
      waist: f.waist ? (next === 'imperial' ? toIn(f.waist) : toCm(f.waist)) : 0,
      height: f.height ? (next === 'imperial' ? toIn(f.height) : toCm(f.height)) : 0,
    }));
    setUnits(next);
  };
  const lengthLabel = units === 'metric' ? 'cm' : 'in';

  const validate = (): string => {
    const f = form;
    if (f.age < 18 || f.age > 100) return 'Please enter an age between 18 and 100.';
    if (f.activityMinutes < 0 || f.activityMinutes > 3000) return 'Activity minutes per week looks off — please double-check.';
    if (f.fruitVeg < 0 || f.fruitVeg > 20) return 'Please enter realistic daily fruit & veg servings (0–20).';
    if (f.drinksPerWeek < 0 || f.drinksPerWeek > 70) return 'Please enter a realistic number of weekly drinks.';
    if (f.sleepHours < 0 || f.sleepHours > 16) return 'Sleep hours should be between 0 and 16.';
    const hasWaist = f.waist > 0 || f.height > 0;
    if (hasWaist) {
      if (f.waist <= 0 || f.height <= 0) return 'Enter BOTH waist and height (or leave both empty to skip that factor).';
      const r = f.waist / f.height;
      if (r < 0.3 || r > 0.9) return 'Please double-check waist and height — that ratio looks off.';
    }
    return '';
  };

  const calculate = () => {
    const err = validate();
    if (err) {
      setError(err);
      setResult(null);
      return;
    }
    setError('');
    const input: HealthspanInput = {
      age: form.age,
      sex: form.sex,
      activityMinutes: form.activityMinutes,
      fruitVeg: form.fruitVeg,
      ultraProcessed: form.ultraProcessed,
      smoking: form.smoking,
      drinksPerWeek: form.drinksPerWeek,
      sleepHours: form.sleepHours,
      stress: form.stress,
      social: form.social,
      waistToHeight: form.waist > 0 && form.height > 0 ? form.waist / form.height : null,
    };
    const res = computeHealthspan(input);
    setResult(res);
    setCopied(false);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  const copyResult = async () => {
    if (!result) return;
    const lines = [
      `My Healthspan Habits Score: ${result.score}/100 (${result.bandLabel})`,
      ...result.factors.map((f) => `  ${f.label}: ${f.earned}/${f.max}`),
      'Educational habits score — not a medical prediction. via healthylifesstyles.com',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div class="hs">
      <form
        class="hs__form"
        onSubmit={(e) => {
          e.preventDefault();
          calculate();
        }}
      >
        <div class="hs__grid">
          <label class="hs__field">
            <span class="hs__label">Age</span>
            <input type="number" min={18} max={100} value={form.age} onInput={(e) => set('age', num((e.target as HTMLInputElement).value, DEFAULTS.age))} />
            <span class="hs__help">Habits matter at every age — age is context only and doesn’t change the score.</span>
          </label>

          <label class="hs__field">
            <span class="hs__label">Sex</span>
            <select value={form.sex} onChange={(e) => set('sex', (e.target as HTMLSelectElement).value as Sex)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <span class="hs__help">Used only for the alcohol guideline.</span>
          </label>

          <label class="hs__field">
            <span class="hs__label">Moderate activity (minutes/week)</span>
            <input type="number" min={0} max={3000} step={10} value={form.activityMinutes} onInput={(e) => set('activityMinutes', num((e.target as HTMLInputElement).value))} />
            <span class="hs__help">Brisk walking, cycling, sport — WHO target is 150+.</span>
          </label>

          <label class="hs__field">
            <span class="hs__label">Fruit & veg (servings/day)</span>
            <input type="number" min={0} max={20} step={0.5} value={form.fruitVeg} onInput={(e) => set('fruitVeg', num((e.target as HTMLInputElement).value))} />
          </label>

          <label class="hs__field">
            <span class="hs__label">Ultra-processed food</span>
            <select value={form.ultraProcessed} onChange={(e) => set('ultraProcessed', (e.target as HTMLSelectElement).value as Upf)}>
              <option value="rarely">Rarely</option>
              <option value="sometimes">Some days</option>
              <option value="daily">Most days</option>
            </select>
          </label>

          <label class="hs__field">
            <span class="hs__label">Smoking</span>
            <select value={form.smoking} onChange={(e) => set('smoking', (e.target as HTMLSelectElement).value as Smoking)}>
              <option value="never">Never smoked</option>
              <option value="former">Former smoker</option>
              <option value="current">Current smoker</option>
            </select>
          </label>

          <label class="hs__field">
            <span class="hs__label">Alcohol (standard drinks/week)</span>
            <input type="number" min={0} max={70} value={form.drinksPerWeek} onInput={(e) => set('drinksPerWeek', num((e.target as HTMLInputElement).value))} />
          </label>

          <label class="hs__field">
            <span class="hs__label">Sleep (hours/night)</span>
            <input type="number" min={0} max={16} step={0.5} value={form.sleepHours} onInput={(e) => set('sleepHours', num((e.target as HTMLInputElement).value, 7))} />
          </label>

          <label class="hs__field">
            <span class="hs__label">Day-to-day stress</span>
            <select value={form.stress} onChange={(e) => set('stress', (e.target as HTMLSelectElement).value as Stress)}>
              <option value="low">Mostly low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High most days</option>
            </select>
          </label>

          <label class="hs__field">
            <span class="hs__label">Social connection</span>
            <select value={form.social} onChange={(e) => set('social', (e.target as HTMLSelectElement).value as Social)}>
              <option value="strong">Strong & regular</option>
              <option value="some">Some connection</option>
              <option value="limited">Often isolated</option>
            </select>
          </label>
        </div>

        <fieldset class="hs__optional">
          <legend>
            Waist &amp; height <span class="hs__optional-tag">optional</span>
            <span class="hs__unit-toggle" role="group" aria-label="Units">
              <button type="button" class={units === 'metric' ? 'is-active' : ''} onClick={() => switchUnits('metric')}>Metric</button>
              <button type="button" class={units === 'imperial' ? 'is-active' : ''} onClick={() => switchUnits('imperial')}>Imperial</button>
            </span>
          </legend>
          <div class="hs__grid">
            <label class="hs__field">
              <span class="hs__label">Waist ({lengthLabel})</span>
              <input type="number" min={0} value={form.waist || ''} placeholder="skip" onInput={(e) => set('waist', num((e.target as HTMLInputElement).value))} />
            </label>
            <label class="hs__field">
              <span class="hs__label">Height ({lengthLabel})</span>
              <input type="number" min={0} value={form.height || ''} placeholder="skip" onInput={(e) => set('height', num((e.target as HTMLInputElement).value))} />
            </label>
          </div>
          <p class="hs__help">Leave both empty to skip — the score rescales so skipping never penalizes you.</p>
        </fieldset>

        {error && <p class="hs__error" role="alert">{error}</p>}

        <button type="submit" class="hs__submit">Get my healthspan habits score</button>
      </form>

      {result && (
        <div class="hs__result" ref={resultRef} aria-live="polite">
          <div class="hs__score-row">
            <div class="hs__score" style={{ borderColor: BAND_COLOR[result.band] }}>
              <span class="hs__score-num">{result.score}</span>
              <span class="hs__score-max">/100</span>
            </div>
            <div>
              <span class="hs__band" style={{ background: BAND_COLOR[result.band] }}>{result.bandLabel}</span>
              <p class="hs__band-note">
                Habits score{result.usedWaist ? '' : ' (waist factor skipped — rescaled)'} — reflects everyday habits linked
                with healthy years, <strong>not</strong> a medical prediction or diagnosis.
              </p>
            </div>
          </div>

          <h3 class="hs__h3">Where your points come from</h3>
          <ul class="hs__bars">
            {result.factors.map((f) => {
              const ratio = f.earned / f.max;
              return (
                <li class="hs__bar-row" key={f.key}>
                  <span class="hs__bar-label">{f.label}</span>
                  <span class="hs__bar-track">
                    <span class="hs__bar-fill" style={{ width: `${Math.max(ratio * 100, 3)}%`, background: ratioColor(ratio) }} />
                  </span>
                  <span class="hs__bar-pts">{f.earned}/{f.max} pts</span>
                </li>
              );
            })}
          </ul>

          {result.improvements.length > 0 && (
            <>
              <h3 class="hs__h3">Your highest-impact next steps</h3>
              <ol class="hs__improve">
                {result.improvements.map((f) => (
                  <li key={f.key}>
                    <strong>{f.label}</strong> (+{f.max - f.earned} pts available): {f.tip}
                  </li>
                ))}
              </ol>
            </>
          )}

          <div class="hs__actions">
            <button type="button" class="hs__copy" onClick={copyResult}>
              {copied ? 'Copied!' : 'Copy my result'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
