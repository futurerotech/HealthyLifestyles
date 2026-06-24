/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import {
  computeMusclePreservation,
  type Training,
  type AgeBand,
  type RiskBand,
} from '../lib/muscle-preservation';

type Units = 'kg' | 'lb';

const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};
const LB = 2.20462;

const BAND_ORDER: RiskBand[] = ['Low', 'Moderate', 'Higher'];
const STATUS_LABEL: Record<string, string> = { good: 'Good', watch: 'Watch', risk: 'Risk' };

export default function MusclePreservation() {
  const [units, setUnits] = useState<Units>('kg');
  const [weight, setWeight] = useState(85);
  const [weeklyLoss, setWeeklyLoss] = useState(0.7);
  const [protein, setProtein] = useState(90);
  const [training, setTraining] = useState<Training>('some');
  const [age, setAge] = useState<AgeBand>('under40');

  const switchUnits = (next: Units) => {
    if (next === units) return;
    const f = next === 'lb' ? LB : 1 / LB;
    setWeight((w) => Math.round(w * f));
    setWeeklyLoss((w) => Math.round(w * f * 10) / 10);
    setUnits(next);
  };

  const weightKg = units === 'kg' ? weight : weight / LB;
  const weeklyLossKg = units === 'kg' ? weeklyLoss : weeklyLoss / LB;
  const r = computeMusclePreservation({ weightKg, weeklyLossKg, proteinG: protein, training, age });

  return (
    <div class="mp">
      {/* ---------------- Inputs ---------------- */}
      <div class="mp__form card">
        <div class="mp__form-head">
          <h2>Your details</h2>
          <div class="mp__units" role="group" aria-label="Units">
            <button type="button" class={units === 'kg' ? 'is-on' : ''} onClick={() => switchUnits('kg')}>kg</button>
            <button type="button" class={units === 'lb' ? 'is-on' : ''} onClick={() => switchUnits('lb')}>lb</button>
          </div>
        </div>
        <div class="mp__grid">
          <label class="mp__field">
            <span>Current weight</span>
            <div class="mp__input-unit">
              <input type="number" min="1" value={weight} onInput={(e) => setWeight(num((e.target as HTMLInputElement).value, 0))} />
              <small>{units}</small>
            </div>
          </label>
          <label class="mp__field">
            <span>Weekly weight loss</span>
            <div class="mp__input-unit">
              <input type="number" min="0" step="0.1" value={weeklyLoss} onInput={(e) => setWeeklyLoss(num((e.target as HTMLInputElement).value, 0))} />
              <small>{units}/week</small>
            </div>
          </label>
          <label class="mp__field">
            <span>Current daily protein</span>
            <div class="mp__input-unit">
              <input type="number" min="0" value={protein} onInput={(e) => setProtein(num((e.target as HTMLInputElement).value, 0))} />
              <small>g</small>
            </div>
          </label>
          <label class="mp__field">
            <span>Resistance training</span>
            <select value={training} onChange={(e) => setTraining((e.target as HTMLSelectElement).value as Training)}>
              <option value="none">None</option>
              <option value="some">1–2 days/week</option>
              <option value="regular">3+ days/week</option>
            </select>
          </label>
          <label class="mp__field">
            <span>Age</span>
            <select value={age} onChange={(e) => setAge((e.target as HTMLSelectElement).value as AgeBand)}>
              <option value="under40">Under 40</option>
              <option value="40to59">40–59</option>
              <option value="60plus">60+</option>
            </select>
          </label>
        </div>
      </div>

      <p class="sr-only" role="status" aria-live="polite">
        Protein target {r.targetGrams} grams per day. Muscle-loss risk: {r.riskBand}.
      </p>

      {/* ---------------- Protein target ---------------- */}
      <div class="mp__target card">
        <div class="mp__target-main">
          <span class="mp__target-cap">Protein target while losing weight</span>
          <span class="mp__target-num">{r.targetGrams} g<small>/day</small></span>
          <span class="mp__target-perkg">≈ {r.perKg} g per kg of body weight</span>
        </div>
        <div class={`mp__gap ${r.proteinMet ? 'is-met' : ''}`}>
          {r.proteinMet ? (
            <><strong>You're hitting your target ✓</strong><span>Currently ~{r.currentProtein} g/day.</span></>
          ) : (
            <><strong>Add ~{r.gapGrams} g/day</strong><span>You're at ~{r.currentProtein} g; aim for {r.targetGrams} g.</span></>
          )}
        </div>
      </div>

      {/* ---------------- Safety flag ---------------- */}
      {r.rapid && (
        <div class="mp__safety" role="note">
          <strong>Your pace is fast ({r.weeklyLossPct}% of body weight/week).</strong>
          <p>Losing faster than about 1% of your body weight per week (~{r.safeWeeklyKg} kg/week for you) raises the share of weight that comes from muscle. Please discuss your target pace with your healthcare provider — and prioritize protein and resistance training.</p>
        </div>
      )}

      {/* ---------------- Risk band ---------------- */}
      <section class="mp__risk card">
        <div class="mp__risk-head">
          <h2 class="mp__h">Muscle-loss risk</h2>
          <span class={`mp__band mp__band--${r.riskBand.toLowerCase()}`}>{r.riskBand}</span>
        </div>
        <div class="mp__band-bar" aria-hidden="true">
          {BAND_ORDER.map((b) => (
            <span class={`mp__band-seg mp__band-seg--${b.toLowerCase()} ${r.riskBand === b ? 'is-on' : ''}`}>{b}</span>
          ))}
        </div>
        <p class="mp__risk-note">A general guide, not a precise measurement — driven by your loss rate, protein, and training.</p>
        <ul class="mp__drivers">
          {r.drivers.map((d) => (
            <li class="mp__driver">
              <span class={`mp__driver-status mp__driver-status--${d.status}`}>{STATUS_LABEL[d.status]}</span>
              <span class="mp__driver-body">
                <strong>{d.label}</strong>
                <small>{d.text}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- Checklist ---------------- */}
      <section class="mp__checklist card">
        <h2 class="mp__h">Your muscle-saving checklist</h2>
        <ul>
          {r.checklist.map((c) => (
            <li><span class="mp__check" aria-hidden="true">✓</span><span>{c}</span></li>
          ))}
        </ul>
        <p class="mp__links">
          Dial it in: <a href="/tools/protein-intake-calculator">Protein Intake Calculator</a> · <a href="/tools/macro-calculator">Macro Calculator</a>
        </p>
      </section>

      {/* ---------------- Disclaimer ---------------- */}
      <p class="mp__disclaimer" role="note">
        <strong>Educational only, not medical advice.</strong> This tool gives general nutrition guidance and says nothing about any
        medication, dose, or timing. If you're on a weight-loss program or medication, follow your prescriber's and dietitian's
        guidance — do not change your treatment based on this tool.
      </p>
    </div>
  );
}
