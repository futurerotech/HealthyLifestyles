/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { cmToFtIn, ftInToCm, inToCm, lbToKg, type Sex, type UnitSystem } from '../lib/units';
import ShareResult from '../components/ShareResult';

// ---------- options ----------
const ACTIVITY = [
  { v: 'sedentary', l: 'Sedentary — little or no exercise' },
  { v: 'light', l: 'Lightly active — 1–3 days/week' },
  { v: 'moderate', l: 'Moderately active — 3–5 days/week' },
  { v: 'active', l: 'Active — 6–7 days/week' },
  { v: 'veryactive', l: 'Very active — hard daily training' },
];
const SMOKING = [
  { v: 'never', l: 'Never smoked' },
  { v: 'former', l: 'Former smoker' },
  { v: 'occasional', l: 'Occasionally' },
  { v: 'daily', l: 'Daily' },
];
const STRESS = [
  { v: 'rarely', l: 'Rarely stressed' },
  { v: 'sometimes', l: 'Sometimes' },
  { v: 'often', l: 'Often' },
  { v: 'always', l: 'Almost always' },
];

interface Step {
  key: string;
  type: 'number' | 'sex' | 'height' | 'mass' | 'length' | 'select';
  label: string;
  help?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
  options?: { v: string; l: string }[];
}

const STEPS: Step[] = [
  { key: 'age', type: 'number', label: 'How old are you?', suffix: 'years', min: 13, max: 100 },
  { key: 'sex', type: 'sex', label: 'What is your biological sex?', help: 'Used for body-composition formulas that differ for men and women.' },
  { key: 'height', type: 'height', label: 'How tall are you?' },
  { key: 'weight', type: 'mass', label: 'What’s your weight?' },
  { key: 'waist', type: 'length', label: 'What’s your waist measurement?', optional: true, help: 'Optional — measure at the narrowest point. It sharpens your body-composition score.' },
  { key: 'activity', type: 'select', label: 'How active are you in a typical week?', options: ACTIVITY },
  { key: 'sleep', type: 'number', label: 'How many hours do you usually sleep?', suffix: 'hours', min: 3, max: 14, step: 0.5 },
  { key: 'smoking', type: 'select', label: 'Do you smoke?', options: SMOKING },
  { key: 'alcohol', type: 'number', label: 'How many alcoholic drinks per week?', suffix: 'drinks', min: 0, max: 60 },
  { key: 'fruitveg', type: 'number', label: 'Servings of fruit & veg on a typical day?', suffix: 'servings', min: 0, max: 15 },
  { key: 'water', type: 'number', label: 'How many glasses of water per day?', suffix: 'glasses', min: 0, max: 25, help: 'A glass is about 250 ml (8 oz).' },
  { key: 'stress', type: 'select', label: 'How often do you feel stressed?', options: STRESS },
  { key: 'restHr', type: 'number', label: 'Resting heart rate?', suffix: 'bpm', min: 30, max: 130, optional: true, help: 'Optional — your pulse at rest. Leave blank if you’re not sure.' },
];

// ---------- sub-score metadata ----------
interface SubMeta { key: string; label: string; color: string; tips: string[]; tools: { slug: string; title: string }[]; }
const SUBS: SubMeta[] = [
  { key: 'body', label: 'Body Composition', color: '#3b82f6',
    tips: ['Aim for a steady weight within the healthy BMI range.', 'Build lean muscle with resistance training twice a week.'],
    tools: [{ slug: 'bmi-calculator', title: 'BMI Calculator' }, { slug: 'ideal-weight-calculator', title: 'Ideal Weight Calculator' }, { slug: 'waist-to-height-ratio-calculator', title: 'Waist-to-Height Ratio' }] },
  { key: 'activity', label: 'Activity', color: '#8b5cf6',
    tips: ['Aim for at least 150 minutes of moderate activity a week.', 'Add short walks and take the stairs to lift your daily total.'],
    tools: [{ slug: 'calories-burned-calculator', title: 'Calories Burned' }, { slug: 'steps-to-calories-calculator', title: 'Steps to Calories' }, { slug: 'vo2-max-calculator', title: 'VO₂ Max Calculator' }] },
  { key: 'nutrition', label: 'Nutrition', color: '#f97316',
    tips: ['Aim for at least 5 servings of fruit & veg a day.', 'Set a calorie and protein target that fits your goal.'],
    tools: [{ slug: 'calorie-calculator', title: 'Calorie Calculator' }, { slug: 'macro-calculator', title: 'Macro Calculator' }, { slug: 'water-intake-calculator', title: 'Water Intake Calculator' }] },
  { key: 'sleep', label: 'Sleep', color: '#6366f1',
    tips: ['Target 7–9 hours with a consistent schedule.', 'Wind down screen-free in the hour before bed.'],
    tools: [{ slug: 'sleep-calculator', title: 'Sleep Calculator' }, { slug: 'sleep-debt-calculator', title: 'Sleep Debt Calculator' }, { slug: 'sleep-quality-check', title: 'Sleep Quality Self-Check' }] },
  { key: 'lifestyle', label: 'Lifestyle', color: '#d97706',
    tips: ['If you smoke, quitting is the single biggest win — free quitlines help.', 'Keep alcohol within low-risk limits and have drink-free days.'],
    tools: [{ slug: 'smoking-cost-calculator', title: 'Smoking Cost Calculator' }, { slug: 'alcohol-units-calculator', title: 'Alcohol Units Calculator' }] },
  { key: 'stress', label: 'Stress', color: '#0ea5e9',
    tips: ['Try a few minutes of slow breathing when tension builds.', 'Protect downtime and talk to someone you trust.'],
    tools: [{ slug: 'stress-level-check', title: 'Stress Self-Check' }, { slug: 'box-breathing-timer', title: 'Box Breathing Timer' }, { slug: 'burnout-self-check', title: 'Burnout Self-Check' }] },
];
const WEIGHTS: Record<string, number> = { body: 0.2, activity: 0.2, nutrition: 0.2, sleep: 0.15, lifestyle: 0.15, stress: 0.1 };

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n));

type Answers = Record<string, string>;

function defaults(units: UnitSystem): Answers {
  return units === 'metric'
    ? { age: '35', sex: '', height: '170', weight: '70', waist: '', activity: '', sleep: '7', smoking: '', alcohol: '3', fruitveg: '3', water: '6', stress: '', restHr: '' }
    : { age: '35', sex: '', heightFt: '5', heightIn: '7', weight: '154', waist: '', activity: '', sleep: '7', smoking: '', alcohol: '3', fruitveg: '3', water: '6', stress: '', restHr: '' };
}

// ---------- scoring ----------
function computeScores(a: Answers, units: UnitSystem) {
  const heightCm = units === 'metric' ? num(a.height) : ftInToCm(num(a.heightFt), num(a.heightIn));
  const weightKg = units === 'metric' ? num(a.weight) : lbToKg(num(a.weight));
  const waistCm = a.waist ? (units === 'metric' ? num(a.waist) : inToCm(num(a.waist))) : 0;
  const m = heightCm / 100;
  const bmi = m > 0 ? weightKg / (m * m) : 0;

  // Body composition
  const bmiScore =
    bmi < 16 ? 40 : bmi < 18.5 ? 75 : bmi < 25 ? 100 : bmi < 27.5 ? 85 : bmi < 30 ? 70 : bmi < 35 ? 50 : bmi < 40 ? 35 : 25;
  let body = bmiScore;
  if (waistCm > 0 && heightCm > 0) {
    const whtr = waistCm / heightCm;
    const whtrScore = whtr < 0.5 ? 100 : whtr < 0.55 ? 80 : whtr < 0.6 ? 60 : 40;
    body = Math.round((bmiScore + whtrScore) / 2);
  }

  // Activity (+ optional resting HR bonus)
  const actMap: Record<string, number> = { sedentary: 25, light: 50, moderate: 75, active: 90, veryactive: 100 };
  let activity = actMap[a.activity] ?? 50;
  if (a.restHr) {
    const r = num(a.restHr);
    const rScore = r > 0 ? (r < 60 ? 100 : r < 70 ? 85 : r < 80 ? 65 : r < 90 ? 45 : 30) : activity;
    activity = Math.round(0.8 * activity + 0.2 * rScore);
  }

  // Nutrition
  const fv = clamp((num(a.fruitveg) / 5) * 100);
  const water = clamp((num(a.water) / 8) * 100);
  const nutrition = Math.round(0.65 * fv + 0.35 * water);

  // Sleep
  const h = num(a.sleep);
  const sleep = h >= 7 && h <= 9 ? 100 : (h >= 6 && h < 7) || (h > 9 && h <= 10) ? 80 : (h >= 5 && h < 6) || (h > 10 && h <= 11) ? 55 : 30;

  // Lifestyle (smoking + alcohol)
  const smokeMap: Record<string, number> = { never: 100, former: 80, occasional: 50, daily: 15 };
  const smoke = smokeMap[a.smoking] ?? 70;
  const d = num(a.alcohol);
  const alc = d === 0 ? 100 : d <= 7 ? 90 : d <= 14 ? 75 : d <= 21 ? 50 : 25;
  const lifestyle = Math.round(0.6 * smoke + 0.4 * alc);

  // Stress
  const stressMap: Record<string, number> = { rarely: 90, sometimes: 70, often: 45, always: 20 };
  const stress = stressMap[a.stress] ?? 60;

  const scores: Record<string, number> = { body, activity, nutrition, sleep, lifestyle, stress };
  const overall = Math.round(SUBS.reduce((sum, s) => sum + scores[s.key] * WEIGHTS[s.key], 0));
  return { scores, overall, bmi };
}

function bandFor(overall: number) {
  if (overall < 40) return { label: 'Needs attention', color: '#ef4444' };
  if (overall < 60) return { label: 'Fair', color: '#f59e0b' };
  if (overall < 80) return { label: 'Good', color: '#14b8a6' };
  return { label: 'Excellent', color: '#16a34a' };
}

// ---------- animated dial ----------
function Dial({ score, color, band }: { score: number; color: string; band: string }) {
  const C = 2 * Math.PI * 85;
  const [shown, setShown] = useState(0);
  const [offset, setOffset] = useState(C);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(score); setOffset(C * (1 - score / 100)); return; }
    const raf0 = requestAnimationFrame(() => setOffset(C * (1 - score / 100)));
    const dur = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setShown(Math.round(score * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf0); cancelAnimationFrame(raf); };
  }, [score]);
  return (
    <div class="hs-dial" role="img" aria-label={`Health score ${score} out of 100 — ${band}`}>
      <svg viewBox="0 0 200 200">
        <circle class="hs-dial__track" cx="100" cy="100" r="85" />
        <circle class="hs-dial__prog" cx="100" cy="100" r="85" stroke={color} style={`stroke-dasharray:${C};stroke-dashoffset:${offset}`} />
      </svg>
      <div class="hs-dial__center">
        <span class="hs-dial__num">{shown}</span>
        <span class="hs-dial__of">out of 100</span>
        <span class="hs-dial__band" style={`color:${color}`}>{band}</span>
      </div>
    </div>
  );
}

// ---------- main ----------
const STORE = 'hls-health-score';

export default function HealthScore() {
  const [screen, setScreen] = useState<'intro' | 'q' | 'result'>('intro');
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [answers, setAnswers] = useState<Answers>(() => defaults('metric'));
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof computeScores> | null>(null);
  const [saved, setSaved] = useState<{ savedAt: string; overall: number } | null>(null);
  const [prevForCompare, setPrevForCompare] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Load any previous result (client-only — avoids hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.overall === 'number') setSaved({ savedAt: p.savedAt ?? '', overall: p.overall });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (screen === 'q') headingRef.current?.focus();
  }, [step, screen]);

  const set = (key: string, val: string) => setAnswers((a) => ({ ...a, [key]: val }));

  const startFresh = (u: UnitSystem) => { setUnits(u); setAnswers(defaults(u)); setStep(0); setScreen('q'); };

  const current = STEPS[step];
  const stepValid = (() => {
    if (!current) return false;
    if (current.optional) return true;
    if (current.type === 'sex' || current.type === 'select') return !!answers[current.key];
    if (current.type === 'height' && units === 'imperial') return num(answers.heightFt) > 0;
    return num(answers[current.key]) > 0;
  })();

  const next = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    // finish — capture the previous saved score (for comparison) before overwriting
    const r = computeScores(answers, units);
    let prev: number | null = null;
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) { const p = JSON.parse(raw); if (typeof p?.overall === 'number') prev = p.overall; }
    } catch { /* ignore */ }
    setPrevForCompare(prev);
    setResult(r);
    setScreen('result');
    try {
      const stamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      localStorage.setItem(STORE, JSON.stringify({ savedAt: stamp, overall: r.overall, scores: r.scores }));
      setSaved({ savedAt: stamp, overall: r.overall });
    } catch { /* ignore */ }
  };
  const back = () => { if (step > 0) setStep(step - 1); else setScreen('intro'); };

  const clearSaved = () => { try { localStorage.removeItem(STORE); } catch {} setSaved(null); };

  // ----- intro -----
  if (screen === 'intro') {
    return (
      <div class="hs">
        <div class="hs-intro">
          <span class="pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7" /></svg> Under 3 minutes · 13 quick questions</span>
          <h2>Ready when you are</h2>
          <p>Answer a few private questions to get your overall Health Score, six sub-scores, and a personalised plan. Nothing is uploaded — your answers stay on this device.</p>

          {saved && (
            <div class="hs-intro__last">
              <div>
                <span class="hs-intro__last-label">Your last score</span>
                <strong>{saved.overall}<span>/100</span></strong>
                {saved.savedAt && <span class="hs-intro__last-date">on {saved.savedAt}</span>}
              </div>
              <button type="button" class="btn-link" onClick={clearSaved}>Clear saved data</button>
            </div>
          )}

          <div class="hs-intro__units" role="group" aria-label="Units">
            <span>Units</span>
            <div class="seg">
              <button type="button" class={`seg__btn${units === 'metric' ? ' is-active' : ''}`} aria-pressed={units === 'metric'} onClick={() => setUnits('metric')}>Metric</button>
              <button type="button" class={`seg__btn${units === 'imperial' ? ' is-active' : ''}`} aria-pressed={units === 'imperial'} onClick={() => setUnits('imperial')}>Imperial</button>
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-lg hs-start" onClick={() => startFresh(units)}>
            {saved ? 'Retake assessment' : 'Start my Health Score'}
          </button>
          <p class="hs-intro__privacy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Private &amp; free. Your data never leaves your browser.</p>
        </div>
      </div>
    );
  }

  // ----- questions -----
  if (screen === 'q' && current) {
    const pct = Math.round(((step + 1) / STEPS.length) * 100);
    return (
      <div class="hs">
        <div class="hs-quiz">
          <div class="hs-progress">
            <div class="hs-progress__bar"><span style={`width:${pct}%`} /></div>
            <span class="hs-progress__label">Question {step + 1} of {STEPS.length}</span>
          </div>

          <h2 class="hs-q__label" tabIndex={-1} ref={headingRef}>
            {current.label}
            {current.optional && <span class="hs-q__opt">Optional</span>}
          </h2>
          {current.help && <p class="hs-q__help">{current.help}</p>}

          <div class="hs-q__input">
            {current.type === 'sex' && (
              <div class="hs-choices">
                {[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }].map((o) => (
                  <button type="button" class={`hs-choice${answers.sex === o.v ? ' is-on' : ''}`} aria-pressed={answers.sex === o.v} onClick={() => { set('sex', o.v); }}>{o.l}</button>
                ))}
              </div>
            )}
            {current.type === 'select' && (
              <div class="hs-choices hs-choices--col">
                {current.options!.map((o) => (
                  <button type="button" class={`hs-choice${answers[current.key] === o.v ? ' is-on' : ''}`} aria-pressed={answers[current.key] === o.v} onClick={() => set(current.key, o.v)}>{o.l}</button>
                ))}
              </div>
            )}
            {current.type === 'height' && units === 'imperial' && (
              <div class="hs-field hs-field--two">
                <span class="hs-input"><input type="number" inputMode="numeric" min="3" max="8" aria-label="Feet" value={answers.heightFt} onInput={(e) => set('heightFt', (e.target as HTMLInputElement).value)} /><span>ft</span></span>
                <span class="hs-input"><input type="number" inputMode="decimal" min="0" max="11.5" step="0.5" aria-label="Inches" value={answers.heightIn} onInput={(e) => set('heightIn', (e.target as HTMLInputElement).value)} /><span>in</span></span>
              </div>
            )}
            {((current.type === 'number') || (current.type === 'mass') || (current.type === 'length') || (current.type === 'height' && units === 'metric')) && (
              <span class="hs-input hs-input--solo">
                <input
                  type="number" inputMode="decimal"
                  min={current.min} max={current.max} step={current.step ?? (current.type === 'number' ? 1 : 0.1)}
                  aria-label={current.label}
                  value={answers[current.key]}
                  onInput={(e) => set(current.key, (e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && stepValid) next(); }}
                />
                <span>{current.suffix ?? (current.type === 'mass' ? (units === 'metric' ? 'kg' : 'lb') : units === 'metric' ? 'cm' : 'in')}</span>
              </span>
            )}
          </div>

          <div class="hs-nav">
            <button type="button" class="btn btn-outline" onClick={back}>Back</button>
            <div class="hs-nav__right">
              {current.optional && <button type="button" class="btn-link" onClick={() => { set(current.key, ''); next(); }}>Skip</button>}
              <button type="button" class="btn btn-primary" disabled={!stepValid} onClick={next}>
                {step === STEPS.length - 1 ? 'See my results' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----- results -----
  if (screen === 'result' && result) {
    const band = bandFor(result.overall);
    const ordered = SUBS.map((s) => ({ ...s, score: result.scores[s.key] }));
    const strengths = [...ordered].sort((a, b) => b.score - a.score).slice(0, 3);
    const improvements = [...ordered].sort((a, b) => a.score - b.score).slice(0, 3);
    const delta = prevForCompare !== null ? result.overall - prevForCompare : null;

    return (
      <div class="hs">
        <p class="sr-only" role="status" aria-live="polite">
          Your Health Score is {result.overall} out of 100: {band.label}.
        </p>
        <div class="hs-result" id="hs-report">
          <div class="hs-result__top">
            <Dial score={result.overall} color={band.color} band={band.label} />
            <div class="hs-result__intro">
              <h2>Your Health Score</h2>
              <p>Here’s your personalised wellness snapshot. Use the strengths to stay motivated and the focus areas to choose your next step.</p>
              {delta !== null && (
                <p class="hs-delta">
                  {delta === 0 ? 'Same as your last check.' : delta > 0 ? `Up ${delta} from your last check (${prevForCompare}). Nice work!` : `Down ${Math.abs(delta)} from your last check (${prevForCompare}).`}
                </p>
              )}
            </div>
          </div>

          <div class="hs-subs">
            {ordered.map((s) => (
              <div class="hs-sub">
                <div class="hs-sub__head"><span>{s.label}</span><strong style={`color:${s.color}`}>{s.score}</strong></div>
                <div class="hs-sub__bar"><span style={`width:${s.score}%;background:${s.color}`} /></div>
              </div>
            ))}
          </div>

          <div class="hs-report-grid">
            <section class="hs-panel">
              <h3>Your top strengths</h3>
              <ul class="hs-strengths">
                {strengths.map((s) => (
                  <li><span class="hs-dot" style={`background:${s.color}`} /> <strong>{s.label}</strong> — scoring {s.score}/100. Keep it up.</li>
                ))}
              </ul>
            </section>
            <section class="hs-panel">
              <h3>Where to focus next</h3>
              <ul class="hs-improve">
                {improvements.map((s) => (
                  <li>
                    <div class="hs-improve__head"><strong>{s.label}</strong><span class="hs-improve__score" style={`color:${s.color}`}>{s.score}/100</span></div>
                    <p>{s.tips[0]}</p>
                    <div class="hs-improve__tools">
                      <span>Tools that help:</span>
                      {s.tools.map((t) => <a href={`/tools/${t.slug}`}>{t.title}</a>)}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p class="hs-disclaimer">
            <strong>Educational, not medical advice.</strong> Your Health Score is a general wellness indicator built from validated formulas. It is not a medical assessment and cannot diagnose any condition. Always consult a qualified healthcare professional about your health.
          </p>
        </div>

        <div class="hs-result__actions">
          <button type="button" class="btn btn-primary" onClick={downloadPdf}>Download PDF report</button>
          <button type="button" class="btn btn-outline" onClick={() => { setScreen('intro'); }}>Retake</button>
          <a href="/tools" class="btn btn-outline">Browse all tools</a>
        </div>
        <ShareResult
          tool="Health Score"
          value={`${result.overall}/100`}
          label="Your Health Score"
          category={band.label}
          categoryColor={band.color}
          toolSlug="health-score"
        />
        <p class="hs-intro__privacy" style="text-align:center">Saved on this device so you can compare next time — nothing is uploaded.</p>
      </div>
    );

    async function downloadPdf() {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      let y = 56;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor('#0f172a');
      doc.text('HealthyLifeStyles — Your Health Score', 40, y); y += 26;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor('#64748b');
      doc.text(`Overall score: ${result!.overall}/100 (${band.label})`, 40, y); y += 28;

      doc.setTextColor('#0f172a'); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('Sub-scores', 40, y); y += 8;
      ordered.forEach((s) => {
        y += 18;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#334155');
        doc.text(`${s.label}`, 40, y);
        doc.setFillColor('#e2e8f0'); doc.rect(180, y - 8, 200, 8, 'F');
        doc.setFillColor(s.color); doc.rect(180, y - 8, 200 * (s.score / 100), 8, 'F');
        doc.text(`${s.score}`, 392, y);
      });
      y += 30;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor('#0f172a');
      doc.text('Where to focus next', 40, y);
      improvements.forEach((s) => {
        y += 20; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor('#0f172a');
        doc.text(`${s.label} (${s.score}/100)`, 40, y);
        y += 15; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#334155');
        doc.text(doc.splitTextToSize(s.tips[0], W - 80), 40, y);
      });
      y += 36;
      doc.setFontSize(8); doc.setTextColor('#94a3b8');
      const disc = 'Educational, not medical advice. Your Health Score is a general wellness indicator and cannot diagnose any condition. Always consult a qualified healthcare professional. Generated by HealthyLifeStyles.';
      doc.text(doc.splitTextToSize(disc, W - 80), 40, y);
      doc.save('healthylifestyles-health-score.pdf');
    }
  }

  return null;
}
