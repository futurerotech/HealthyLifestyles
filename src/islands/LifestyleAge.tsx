/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  computeLifestyleAge,
  MAX_SWING,
  type Activity,
  type Smoking,
  type Stress,
  type LifestyleAgeResult,
  type FactorResult,
} from '../lib/lifestyle-age';

type Units = 'metric' | 'imperial';

interface FormState {
  age: number;
  restingHr: number;
  sleepHours: number;
  waist: number;
  height: number;
  activity: Activity;
  smoking: Smoking;
  alcoholPerWeek: number;
  fruitVegPerDay: number;
  stress: Stress;
}

const METRIC_DEFAULTS: FormState = {
  age: 35, restingHr: 68, sleepHours: 7, waist: 85, height: 175,
  activity: 'light', smoking: 'never', alcoholPerWeek: 5, fruitVegPerDay: 3, stress: 'moderate',
};

const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};
const reduceMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function LifestyleAge() {
  const [units, setUnits] = useState<Units>('metric');
  const [form, setForm] = useState<FormState>(METRIC_DEFAULTS);
  const [result, setResult] = useState<LifestyleAgeResult | null>(null);
  const [error, setError] = useState('');
  const [animAge, setAnimAge] = useState(0);
  const [barsIn, setBarsIn] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const switchUnits = (next: Units) => {
    if (next === units) return;
    const toIn = (cm: number) => Math.round(cm * 0.393701);
    const toCm = (inch: number) => Math.round(inch / 0.393701);
    setForm((f) => ({
      ...f,
      waist: next === 'imperial' ? toIn(f.waist) : toCm(f.waist),
      height: next === 'imperial' ? toIn(f.height) : toCm(f.height),
    }));
    setUnits(next);
  };

  const lengthLabel = units === 'metric' ? 'cm' : 'in';

  const validate = (): string => {
    const f = form;
    if (f.age < 18 || f.age > 100) return 'Please enter an age between 18 and 100.';
    if (f.restingHr < 30 || f.restingHr > 130) return 'Resting heart rate should be between 30 and 130 bpm.';
    if (f.sleepHours < 0 || f.sleepHours > 16) return 'Sleep hours should be between 0 and 16.';
    if (f.waist <= 0 || f.height <= 0) return 'Please enter your waist and height.';
    const ratio = f.waist / f.height;
    if (ratio < 0.3 || ratio > 0.9) return 'Please double-check your waist and height — that ratio looks off.';
    if (f.alcoholPerWeek < 0 || f.alcoholPerWeek > 70) return 'Please enter a realistic number of weekly drinks.';
    if (f.fruitVegPerDay < 0 || f.fruitVegPerDay > 20) return 'Please enter realistic daily fruit & veg servings.';
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
    const res = computeLifestyleAge({ ...form });
    setResult(res);
    setBarsIn(false);
    // Animate body age from real age → estimate.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (reduceMotion()) {
      setAnimAge(res.bodyAge);
      setBarsIn(true);
    } else {
      const from = res.realAge;
      const to = res.bodyAge;
      const start = performance.now();
      const dur = 1100;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimAge(Math.round(from + (to - from) * eased));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setTimeout(() => setBarsIn(true), 60);
    }
    setShareMsg('');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }), 80);
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ---- Shareable card (canvas → PNG) ----
  const makeCardBlob = (res: LifestyleAgeResult): Promise<Blob | null> =>
    new Promise((resolve) => {
      const W = 1200, H = 630;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(null);
      // Background
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W, 0, 0, W, 0, 900);
      g.addColorStop(0, 'rgba(34,197,94,0.35)');
      g.addColorStop(1, 'rgba(34,197,94,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const sans = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textBaseline = 'alphabetic';
      // Brand
      ctx.fillStyle = '#22c55e';
      ctx.font = `bold 30px ${sans}`;
      ctx.fillText('HealthyLifeStyles', 64, 90);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 24px ${sans}`;
      ctx.fillText('My Lifestyle Age', 64, 128);
      // Big number
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 150px ${sans}`;
      ctx.fillText(`${res.low}–${res.high}`, 60, 340);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `600 34px ${sans}`;
      ctx.fillText(`estimated lifestyle age  ·  real age ${res.realAge}`, 64, 396);
      // Delta
      const d = res.deltaYears;
      const deltaText = d < 0 ? `About ${Math.abs(d)} years younger` : d > 0 ? `About ${d} years older` : 'Right on track';
      ctx.fillStyle = d <= 0 ? '#22c55e' : '#fbbf24';
      ctx.font = `800 46px ${sans}`;
      ctx.fillText(deltaText, 64, 474);
      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = `500 24px ${sans}`;
      ctx.fillText('Educational lifestyle estimate — not a medical or biological-age test', 64, 560);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('healthylifesstyles.com/tools/lifestyle-age-test', 64, 596);
      c.toBlob((b) => resolve(b), 'image/png');
    });

  const shareCard = async () => {
    if (!result) return;
    setShareMsg('');
    const blob = await makeCardBlob(result);
    if (!blob) return;
    const file = new File([blob], 'my-lifestyle-age.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: 'My Lifestyle Age',
          text: `My estimated lifestyle age is ${result.low}–${result.high} (real age ${result.realAge}). What's yours?`,
        });
        return;
      } catch {
        /* user cancelled — fall through to download */
      }
    }
    downloadBlob(blob);
    setShareMsg('Image saved — share it anywhere!');
  };

  const downloadCard = async () => {
    if (!result) return;
    const blob = await makeCardBlob(result);
    if (blob) {
      downloadBlob(blob);
      setShareMsg('Image saved to your downloads.');
    }
  };

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-lifestyle-age.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const maxMag = result ? Math.max(4, ...result.factors.map((f) => Math.abs(f.years))) : 4;
  const delta = result?.deltaYears ?? 0;
  const deltaLabel = delta < 0 ? `${Math.abs(delta)} yr younger` : delta > 0 ? `${delta} yr older` : 'On track';

  return (
    <div class="la">
      {/* ---------------- Form ---------------- */}
      <div class="la__form card">
        <div class="la__form-head">
          <h2>Your details</h2>
          <div class="la__units" role="group" aria-label="Units">
            <button type="button" class={units === 'metric' ? 'is-on' : ''} onClick={() => switchUnits('metric')}>Metric</button>
            <button type="button" class={units === 'imperial' ? 'is-on' : ''} onClick={() => switchUnits('imperial')}>Imperial</button>
          </div>
        </div>

        <div class="la__grid">
          <label class="la__field">
            <span>Your age</span>
            <input type="number" min="18" max="100" value={form.age}
              onInput={(e) => set('age', num((e.target as HTMLInputElement).value, 35))} />
          </label>
          <label class="la__field">
            <span>Resting heart rate</span>
            <input type="number" min="30" max="130" value={form.restingHr}
              onInput={(e) => set('restingHr', num((e.target as HTMLInputElement).value, 68))} />
            <small>bpm — measure at rest</small>
          </label>
          <label class="la__field">
            <span>Average sleep</span>
            <input type="number" min="0" max="16" step="0.5" value={form.sleepHours}
              onInput={(e) => set('sleepHours', num((e.target as HTMLInputElement).value, 7))} />
            <small>hours/night</small>
          </label>
          <label class="la__field">
            <span>Waist</span>
            <input type="number" min="0" value={form.waist}
              onInput={(e) => set('waist', num((e.target as HTMLInputElement).value, 85))} />
            <small>{lengthLabel} — at the navel</small>
          </label>
          <label class="la__field">
            <span>Height</span>
            <input type="number" min="0" value={form.height}
              onInput={(e) => set('height', num((e.target as HTMLInputElement).value, 175))} />
            <small>{lengthLabel}</small>
          </label>
          <label class="la__field">
            <span>Activity level</span>
            <select value={form.activity} onChange={(e) => set('activity', (e.target as HTMLSelectElement).value as Activity)}>
              <option value="sedentary">Sedentary (little exercise)</option>
              <option value="light">Lightly active (1–2×/week)</option>
              <option value="moderate">Moderately active (3–4×/week)</option>
              <option value="active">Very active (5+×/week)</option>
            </select>
          </label>
          <label class="la__field">
            <span>Smoking</span>
            <select value={form.smoking} onChange={(e) => set('smoking', (e.target as HTMLSelectElement).value as Smoking)}>
              <option value="never">Never smoked</option>
              <option value="former">Former smoker</option>
              <option value="current">Current smoker</option>
            </select>
          </label>
          <label class="la__field">
            <span>Alcohol</span>
            <input type="number" min="0" max="70" value={form.alcoholPerWeek}
              onInput={(e) => set('alcoholPerWeek', num((e.target as HTMLInputElement).value, 0))} />
            <small>drinks/week</small>
          </label>
          <label class="la__field">
            <span>Fruit &amp; veg</span>
            <input type="number" min="0" max="20" value={form.fruitVegPerDay}
              onInput={(e) => set('fruitVegPerDay', num((e.target as HTMLInputElement).value, 0))} />
            <small>servings/day</small>
          </label>
          <label class="la__field">
            <span>Stress level</span>
            <select value={form.stress} onChange={(e) => set('stress', (e.target as HTMLSelectElement).value as Stress)}>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="severe">Very high</option>
            </select>
          </label>
        </div>

        {error && <p class="la__error" role="alert">{error}</p>}

        <button type="button" class="btn btn-primary btn-lg la__go" onClick={calculate}>
          Reveal my lifestyle age
        </button>
      </div>

      {/* ---------------- Result ---------------- */}
      {result && (
        <div class="la__result" ref={resultRef}>
          <p class="sr-only" role="status" aria-live="polite">
            Your estimated lifestyle age is {result.low} to {result.high}; your real age is {result.realAge}.
          </p>
          <div class="la__hero card">
            <div class="la__ages">
              <div class="la__age-block">
                <span class="la__age-num la__age-real">{result.realAge}</span>
                <span class="la__age-cap">Your real age</span>
              </div>
              <div class="la__vs" aria-hidden="true">vs</div>
              <div class="la__age-block">
                <span class="la__age-num la__age-body">{result.low}–{result.high}</span>
                <span class="la__age-cap">Estimated lifestyle age</span>
              </div>
            </div>
            <div class={`la__delta ${delta <= 0 ? 'is-good' : 'is-warn'}`}>
              {delta < 0
                ? `Your habits suggest a body about ${Math.abs(delta)} year${Math.abs(delta) === 1 ? '' : 's'} younger than your age. 🎉`
                : delta > 0
                ? `Your habits may be adding about ${delta} year${delta === 1 ? '' : 's'} — here's what you can change.`
                : `Your habits line up closely with your real age.`}
            </div>
            <p class="la__hero-note">
              Educational estimate based on lifestyle factors. It does not measure biological age and is not a medical assessment.
            </p>
          </div>

          {/* Top drivers */}
          <section class="la__drivers">
            <h2 class="la__h">What's moving your number most</h2>
            <div class="la__driver-grid">
              {result.topDrivers.map((f) => (
                <div class={`la__driver card ${f.good ? 'is-good' : 'is-warn'}`}>
                  <div class="la__driver-top">
                    <span class="la__driver-label">{f.label}</span>
                    <span class={`la__driver-badge ${f.good ? 'is-good' : 'is-warn'}`}>{yrs(f.years)}</span>
                  </div>
                  <p class="la__driver-detail">{f.detail}</p>
                  <p class="la__driver-tip">{f.tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Full breakdown */}
          <section class="la__breakdown card">
            <h2 class="la__h">Full breakdown</h2>
            <p class="la__breakdown-sub">How each habit nudges your estimate. Green pulls it down (younger); amber pushes it up.</p>
            <ul class="la__bars">
              {result.factors.map((f) => {
                const magPct = (Math.abs(f.years) / maxMag) * 50;
                const w = barsIn ? magPct : 0;
                return (
                  <li class="la__bar-row">
                    <span class="la__bar-label">{f.label}</span>
                    <div class="la__bar-track">
                      <span class="la__bar-center" aria-hidden="true"></span>
                      <span
                        class={`la__bar-fill ${f.good ? 'is-good' : 'is-warn'}`}
                        style={f.years <= 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`}
                      ></span>
                    </div>
                    <span class={`la__bar-yr ${f.good ? 'is-good' : 'is-warn'}`}>{yrs(f.years)}</span>
                  </li>
                );
              })}
            </ul>
            <p class="la__cap-note">Total adjustment is capped at ±{MAX_SWING} years to keep this estimate conservative.</p>
          </section>

          {/* Share */}
          <section class="la__share card">
            <div>
              <h2 class="la__h">Share your result</h2>
              <p class="la__share-sub">Get a card to post — and challenge a friend to beat their number.</p>
            </div>
            <div class="la__share-btns">
              <button type="button" class="btn btn-primary" onClick={shareCard}>Share result</button>
              <button type="button" class="btn btn-outline" onClick={downloadCard}>Download card</button>
            </div>
            {shareMsg && <p class="la__share-msg">{shareMsg}</p>}
          </section>
        </div>
      )}
    </div>
  );
}

function yrs(y: number): string {
  if (y === 0) return '0 yr';
  const v = Math.abs(y) % 1 === 0 ? Math.abs(y).toString() : Math.abs(y).toFixed(1);
  return `${y < 0 ? '−' : '+'}${v} yr`;
}
