/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import {
  buildProgram,
  roundToIncrement,
  LIFT_NAMES,
  LIFT_ORDER,
  type Goal,
  type Experience,
  type Units,
  type LiftKey,
  type Program,
} from '../lib/strength-program';

interface LiftState { enabled: boolean; oneRm: number; }

const DEFAULTS: Record<Units, Record<LiftKey, number>> = {
  kg: { squat: 100, bench: 80, deadlift: 120, ohp: 50, row: 70 },
  lb: { squat: 225, bench: 185, deadlift: 275, ohp: 115, row: 155 },
};
const INITIAL_ENABLED: Record<LiftKey, boolean> = {
  squat: true, bench: true, deadlift: true, ohp: true, row: false,
};
const CHART_COLORS: Record<LiftKey, string> = {
  squat: '#3b82f6', bench: '#8b5cf6', deadlift: '#ef4444', ohp: '#14b8a6', row: '#f59e0b',
};

const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};
const reduceMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function initLifts(units: Units): Record<LiftKey, LiftState> {
  const out = {} as Record<LiftKey, LiftState>;
  for (const k of LIFT_ORDER) out[k] = { enabled: INITIAL_ENABLED[k], oneRm: DEFAULTS[units][k] };
  return out;
}

export default function StrengthProgram() {
  const [units, setUnits] = useState<Units>('kg');
  const [lifts, setLifts] = useState<Record<LiftKey, LiftState>>(() => initLifts('kg'));
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [experience, setExperience] = useState<Experience>('intermediate');
  const [goal, setGoal] = useState<Goal>('strength');
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState('');

  // Prefill 1RMs from URL params (?squat=&bench=&deadlift=&ohp=&row=&units=).
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const u = p.get('units');
      const startUnits: Units = u === 'lb' ? 'lb' : 'kg';
      const next = initLifts(startUnits);
      let any = false;
      for (const k of LIFT_ORDER) {
        const v = p.get(k);
        if (v && Number.isFinite(parseFloat(v))) {
          next[k] = { enabled: true, oneRm: Math.round(parseFloat(v)) };
          any = true;
        }
      }
      if (u === 'lb') setUnits('lb');
      if (any || u) setLifts(next);
    } catch {
      /* no-op */
    }
  }, []);

  const switchUnits = (next: Units) => {
    if (next === units) return;
    const factor = next === 'lb' ? 2.20462 : 1 / 2.20462;
    setLifts((cur) => {
      const out = {} as Record<LiftKey, LiftState>;
      for (const k of LIFT_ORDER) out[k] = { enabled: cur[k].enabled, oneRm: roundToIncrement(cur[k].oneRm * factor, next) };
      return out;
    });
    setUnits(next);
  };

  const setOneRm = (k: LiftKey, v: number) => setLifts((l) => ({ ...l, [k]: { ...l[k], oneRm: v } }));
  const toggleLift = (k: LiftKey) => setLifts((l) => ({ ...l, [k]: { ...l[k], enabled: !l[k].enabled } }));

  const generate = () => {
    const selected = LIFT_ORDER.filter((k) => lifts[k].enabled);
    if (selected.length === 0) { setError('Pick at least one lift to train.'); setProgram(null); return; }
    const bad = selected.find((k) => !(lifts[k].oneRm > 0) || lifts[k].oneRm > (units === 'kg' ? 600 : 1300));
    if (bad) { setError(`Please enter a realistic 1RM for ${LIFT_NAMES[bad]}.`); setProgram(null); return; }
    setError('');
    const prog = buildProgram({
      lifts: selected.map((k) => ({ key: k, oneRm: lifts[k].oneRm })),
      daysPerWeek, experience, goal, units,
    });
    setProgram(prog);
    setTimeout(() => {
      document.getElementById('sp-result')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    }, 60);
  };

  const downloadPdf = async () => {
    if (!program) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const M = 40; const H = doc.internal.pageSize.getHeight();
    let y = M;
    const line = (text: string, size = 10, bold = false, gap = 14) => {
      if (y > H - M) { doc.addPage(); y = M; }
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size); doc.setTextColor(15, 23, 42);
      doc.text(text, M, y); y += gap;
    };
    line('Your 4-Week Strength Program', 18, true, 22);
    line(`${cap(program.goal)} · ${cap(program.experience)} · ${program.daysPerWeek} days/week · weights in ${program.units}`, 10, false, 20);
    line('Weekly schedule', 13, true, 16);
    program.schedule.forEach((d) => line(`   Day ${d.day}: ${d.lifts.map((l) => LIFT_NAMES[l]).join(', ') || 'Rest / accessories'}`, 9, false, 12));
    y += 6;
    program.lifts.forEach((lift) => {
      line(`${lift.name}  (1RM ${lift.oneRm} ${program.units})`, 13, true, 16);
      line(`   Warm-up: ${lift.warmups.map((w) => `${w.label.replace(' ', ' ')} @ ${w.weight}`).join('  ·  ')}`, 8, false, 12);
      lift.weeks.forEach((w) => line(`   ${w.label}: ${w.sets} × ${w.reps} @ ${w.percent}% = ${w.weight} ${program.units}`, 9, false, 12));
      y += 6;
    });
    line(program.restGuidance, 9, false, 12);
    line('Educational estimate, not coaching. Prioritize form, warm up, and never train through pain.', 8, false, 10);
    doc.save('healthylifestyles-strength-program.pdf');
  };

  const lengthLabel = units;

  return (
    <div class="sp">
      {/* ---------------- Form ---------------- */}
      <div class="sp__form card">
        <div class="sp__form-head">
          <h2>Your lifts &amp; goal</h2>
          <div class="sp__units" role="group" aria-label="Units">
            <button type="button" class={units === 'kg' ? 'is-on' : ''} onClick={() => switchUnits('kg')}>kg</button>
            <button type="button" class={units === 'lb' ? 'is-on' : ''} onClick={() => switchUnits('lb')}>lb</button>
          </div>
        </div>

        <p class="sp__lifts-hint">Enter your 1-rep max for each lift. Not sure? Estimate it first with the <a href="/tools/one-rep-max-calculator">1RM Calculator</a>.</p>
        <div class="sp__lifts">
          {LIFT_ORDER.map((k) => (
            <div class={`sp__lift ${lifts[k].enabled ? '' : 'is-off'}`}>
              <label class="sp__lift-toggle">
                <input type="checkbox" checked={lifts[k].enabled} onChange={() => toggleLift(k)} />
                <span>{LIFT_NAMES[k]}</span>
              </label>
              <div class="sp__lift-input">
                <input type="number" min="0" value={lifts[k].oneRm} disabled={!lifts[k].enabled}
                  onInput={(e) => setOneRm(k, num((e.target as HTMLInputElement).value, 0))} />
                <small>{lengthLabel}</small>
              </div>
            </div>
          ))}
        </div>

        <div class="sp__opts">
          <label class="sp__field">
            <span>Goal</span>
            <select value={goal} onChange={(e) => setGoal((e.target as HTMLSelectElement).value as Goal)}>
              <option value="strength">Strength (heavy, low reps)</option>
              <option value="hypertrophy">Hypertrophy (muscle size)</option>
            </select>
          </label>
          <label class="sp__field">
            <span>Experience</span>
            <select value={experience} onChange={(e) => setExperience((e.target as HTMLSelectElement).value as Experience)}>
              <option value="beginner">Beginner (start conservative)</option>
              <option value="intermediate">Intermediate</option>
            </select>
          </label>
          <label class="sp__field">
            <span>Training days/week</span>
            <select value={String(daysPerWeek)} onChange={(e) => setDaysPerWeek(Number((e.target as HTMLSelectElement).value))}>
              <option value="2">2 days</option>
              <option value="3">3 days</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
            </select>
          </label>
        </div>

        {error && <p class="sp__error" role="alert">{error}</p>}
        <button type="button" class="btn btn-primary btn-lg sp__go" onClick={generate}>Build my 4-week program</button>
      </div>

      {/* ---------------- Result ---------------- */}
      {program && (
        <div class="sp__result" id="sp-result">
          <p class="sp__sr sr-only" role="status" aria-live="polite">
            Your 4-week {program.goal} program is ready — {program.daysPerWeek} days per week, weights in {program.units}.
          </p>
          <div class="sp__summary card">
            <div>
              <h2 class="sp__h">Your 4-week {program.goal} block</h2>
              <p class="sp__summary-sub">{cap(program.experience)} · {program.daysPerWeek} days/week · weights rounded to the nearest {program.units === 'kg' ? '2.5 kg' : '5 lb'}</p>
            </div>
            <button type="button" class="btn btn-outline" onClick={downloadPdf}>Download PDF program</button>
          </div>

          {/* Weekly schedule */}
          <section class="sp__schedule card">
            <h3 class="sp__h">Weekly schedule</h3>
            <div class="sp__days">
              {program.schedule.map((d) => (
                <div class="sp__day">
                  <span class="sp__day-num">Day {d.day}</span>
                  <span class="sp__day-lifts">{d.lifts.map((l) => LIFT_NAMES[l]).join(' · ') || 'Rest / accessories'}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Per-lift tables */}
          {program.lifts.map((lift) => (
            <section class="sp__lift-block card">
              <div class="sp__lift-block-head">
                <h3>{lift.name}</h3>
                <span class="sp__lift-1rm">1RM {lift.oneRm} {program.units}</span>
              </div>
              <p class="sp__warmup">
                <strong>Warm-up:</strong> {lift.warmups.map((w) => `${w.label} @ ${w.weight} ${program.units}`).join('  ·  ')}
              </p>
              <div class="sp__table-wrap">
                <table class="sp__table">
                  <thead>
                    <tr><th>Week</th><th>Sets × reps</th><th>Intensity</th><th>Working weight</th></tr>
                  </thead>
                  <tbody>
                    {lift.weeks.map((w) => (
                      <tr class={w.deload ? 'is-deload' : ''}>
                        <td>{w.label}</td>
                        <td>{w.sets} × {w.reps}</td>
                        <td>{w.percent}%</td>
                        <td class="sp__weight">{w.weight} {program.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {/* Progression chart */}
          <section class="sp__chart-block card">
            <h3 class="sp__h">Top-set progression</h3>
            <ProgressionChart program={program} />
            <div class="sp__legend">
              {program.lifts.map((l) => (
                <span class="sp__legend-item"><i style={`background:${CHART_COLORS[l.key]}`}></i>{l.name}</span>
              ))}
            </div>
          </section>

          <p class="sp__rest">{program.restGuidance} {program.warmupNote}</p>
        </div>
      )}
    </div>
  );
}

function ProgressionChart({ program }: { program: Program }) {
  const W = 560, Hgt = 240, pad = { l: 44, r: 12, t: 16, b: 28 };
  const weeks = [1, 2, 3, 4];
  const all = program.lifts.flatMap((l) => l.topWeights);
  const min = Math.min(...all), max = Math.max(...all);
  const lo = Math.floor((min * 0.92) / 5) * 5;
  const hi = Math.ceil((max * 1.04) / 5) * 5;
  const span = Math.max(1, hi - lo);
  const x = (w: number) => pad.l + ((w - 1) / 3) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / span) * (Hgt - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${Hgt}`} class="sp__chart" role="img" aria-label="Working weight progression by week">
      {/* gridlines */}
      {[0, 0.5, 1].map((f) => {
        const val = lo + f * span;
        const yy = y(val);
        return (
          <g>
            <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#e2e8f0" stroke-width="1" />
            <text x={pad.l - 8} y={yy + 4} text-anchor="end" font-size="11" fill="#64748b">{Math.round(val)}</text>
          </g>
        );
      })}
      {weeks.map((w) => (
        <text x={x(w)} y={Hgt - 8} text-anchor="middle" font-size="11" fill="#64748b">{w === 4 ? 'Deload' : `Wk ${w}`}</text>
      ))}
      {program.lifts.map((l) => {
        const pts = l.topWeights.map((v, i) => `${x(i + 1)},${y(v)}`).join(' ');
        const c = CHART_COLORS[l.key];
        return (
          <g>
            <polyline points={pts} fill="none" stroke={c} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
            {l.topWeights.map((v, i) => <circle cx={x(i + 1)} cy={y(v)} r="3.5" fill={c} />)}
          </g>
        );
      })}
    </svg>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
