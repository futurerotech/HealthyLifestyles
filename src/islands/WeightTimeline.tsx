/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { computeWeightTimeline, projectDate, type WeightTimelineResult } from '../lib/weight-timeline';

type Units = 'kg' | 'lb';
const LB = 2.20462;
const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};

export default function WeightTimeline() {
  const [units, setUnits] = useState<Units>('kg');
  const [current, setCurrent] = useState(90);
  const [goal, setGoal] = useState(75);
  const [rate, setRate] = useState(0.5); // per week, active unit

  const toKg = (v: number) => (units === 'kg' ? v : v / LB);
  const toDisp = (kg: number) => Math.round((units === 'kg' ? kg : kg * LB) * 10) / 10;
  const u = units;

  const switchUnits = (next: Units) => {
    if (next === units) return;
    const f = next === 'lb' ? LB : 1 / LB;
    setCurrent((w) => Math.round(w * f));
    setGoal((w) => Math.round(w * f));
    setRate((w) => Math.round(w * f * 10) / 10);
    setUnits(next);
  };

  const r = computeWeightTimeline({ currentKg: toKg(current), goalKg: toKg(goal), weeklyRateKg: toKg(rate) });
  const safeMaxDisp = toDisp(r.safeMaxKg);

  if (r.isGain) {
    return (
      <div class="wt">
        <Inputs {...{ units, current, goal, rate, setCurrent, setGoal, setRate, switchUnits, u, safeMaxDisp, tooFast: false }} />
        <div class="wt__gain card">
          <strong>Set a goal below your current weight.</strong>
          <p>This planner is for weight loss. Enter a goal weight lower than your current weight to see your timeline.</p>
        </div>
      </div>
    );
  }

  const projected = projectDate(new Date(), r.weeks);
  const months = Math.round((r.weeks / 4.345) * 10) / 10;

  return (
    <div class="wt">
      <Inputs {...{ units, current, goal, rate, setCurrent, setGoal, setRate, switchUnits, u, safeMaxDisp, tooFast: r.tooFast }} />

      <p class="sr-only" role="status" aria-live="polite">
        At {toDisp(r.effectiveRateKg)} {u} per week, you could reach {toDisp(r.goalKg)} {u} in about {r.weeks} weeks, by {projected}.
      </p>

      <div class="wt__hero card">
        <span class="wt__hero-cap">Reach {toDisp(r.goalKg)} {u} by about</span>
        <span class="wt__hero-date">{projected}</span>
        <span class="wt__hero-sub">~{r.weeks} weeks ({months} months) to lose {toDisp(r.toLoseKg)} {u} at {toDisp(r.effectiveRateKg)} {u}/week</span>
      </div>

      {r.tooFast && (
        <div class="wt__warn" role="note">
          <strong>We’ve planned at a safe pace.</strong> Losing faster than about {safeMaxDisp} {u}/week (1% of your body weight)
          tends to cost muscle and rarely lasts. Your timeline uses that safe maximum instead of the faster rate you entered.
        </div>
      )}

      <section class="wt__chart-block card">
        <h2 class="wt__h">Your projected progress</h2>
        <TimelineChart r={r} toDisp={toDisp} unit={u} />
      </section>

      <section class="wt__milestones card">
        <h2 class="wt__h">Milestones</h2>
        <ol class="wt__ms-list">
          {r.milestones.map((m) => (
            <li>
              <span class="wt__ms-week">Week {m.week}</span>
              <span class="wt__ms-body"><strong>{toDisp(m.weightKg)} {u}</strong><small>{m.label}</small></span>
              <span class="wt__ms-date">{projectDate(new Date(), m.week)}</span>
            </li>
          ))}
        </ol>
      </section>

      <p class="wt__note">
        A motivating estimate, not a guarantee — real weight loss isn’t perfectly linear and naturally slows as you get lighter.
        Aim for a sustainable pace and focus on habits. Educational only, not medical advice.
      </p>
    </div>
  );
}

function Inputs(props: any) {
  const { units, current, goal, rate, setCurrent, setGoal, setRate, switchUnits, u, safeMaxDisp, tooFast } = props;
  return (
    <div class="wt__form card">
      <div class="wt__form-head">
        <h2 class="wt__h" style="margin:0">Your plan</h2>
        <div class="wt__units" role="group" aria-label="Units">
          <button type="button" class={units === 'kg' ? 'is-on' : ''} onClick={() => switchUnits('kg')}>kg</button>
          <button type="button" class={units === 'lb' ? 'is-on' : ''} onClick={() => switchUnits('lb')}>lb</button>
        </div>
      </div>
      <div class="wt__grid">
        <label class="wt__field"><span>Current weight</span>
          <div class="wt__iu"><input type="number" min="1" value={current} onInput={(e) => setCurrent(num((e.target as HTMLInputElement).value, 0))} /><small>{u}</small></div>
        </label>
        <label class="wt__field"><span>Goal weight</span>
          <div class="wt__iu"><input type="number" min="0" value={goal} onInput={(e) => setGoal(num((e.target as HTMLInputElement).value, 0))} /><small>{u}</small></div>
        </label>
        <label class="wt__field"><span>Weekly pace</span>
          <div class="wt__iu"><input type="number" min="0.1" step="0.1" value={rate} class={tooFast ? 'is-warn' : ''} onInput={(e) => setRate(num((e.target as HTMLInputElement).value, 0))} /><small>{u}/wk</small></div>
        </label>
      </div>
      <p class="wt__safe">Safe pace for you: up to about <strong>{safeMaxDisp} {u}/week</strong> (1% of body weight). Slower is more sustainable.</p>
    </div>
  );
}

function TimelineChart({ r, toDisp, unit }: { r: WeightTimelineResult; toDisp: (kg: number) => number; unit: string }) {
  const W = 560, H = 240, pad = { l: 46, r: 14, t: 16, b: 28 };
  const pts = r.points;
  if (pts.length < 2) return null;
  const maxW = r.currentKg, minW = r.goalKg;
  const span = Math.max(1, maxW - minW);
  const lo = minW - span * 0.08, hi = maxW + span * 0.08;
  const ySpan = hi - lo;
  const x = (wk: number) => pad.l + (wk / r.weeks) * (W - pad.l - pad.r);
  const y = (kg: number) => pad.t + (1 - (kg - lo) / ySpan) * (H - pad.t - pad.b);
  const line = pts.map((p) => `${x(p.week)},${y(p.weightKg)}`).join(' ');
  const area = `${x(0)},${y(lo)} ${line} ${x(r.weeks)},${y(lo)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="wt__chart" role="img" aria-label="Projected weight over time">
      {[0, 0.5, 1].map((f) => {
        const val = lo + f * ySpan, yy = y(val);
        return (<g><line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#e2e8f0" /><text x={pad.l - 8} y={yy + 4} text-anchor="end" font-size="11" fill="#64748b">{toDisp(val)}</text></g>);
      })}
      <polygon points={area} fill="rgba(59,130,246,0.12)" />
      <polyline points={line} fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
      {r.milestones.map((m) => (<circle cx={x(m.week)} cy={y(m.weightKg)} r="4.5" fill="#16a34a" stroke="#fff" stroke-width="1.5" />))}
      <text x={pad.l} y={H - 8} text-anchor="start" font-size="11" fill="#64748b">now</text>
      <text x={W - pad.r} y={H - 8} text-anchor="end" font-size="11" fill="#64748b">wk {r.weeks}</text>
      <text x={W - pad.r} y={pad.t + 4} text-anchor="end" font-size="11" fill="#64748b">{unit}</text>
    </svg>
  );
}
