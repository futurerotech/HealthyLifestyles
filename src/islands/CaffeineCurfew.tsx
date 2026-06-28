/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import {
  computeCaffeinePlan,
  formatClock,
  parseClock,
  CAFFEINE_PRESETS,
  RESIDUAL_THRESHOLD_MG,
  type CaffeinePlan,
} from '../lib/caffeine';

const EVENT_DOT: Record<string, string> = {
  wake: '#f59e0b',
  light: '#fbbf24',
  curfew: '#ef4444',
  screen: '#6366f1',
  winddown: '#8b5cf6',
  bed: '#0a1628',
};

const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};

export default function CaffeineCurfew() {
  const [wake, setWake] = useState('07:00');
  const [bed, setBed] = useState('23:00');
  const [dose, setDose] = useState(95);
  const [age, setAge] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  const plan = computeCaffeinePlan({
    wakeMin: parseClock(wake, 420),
    bedMin: parseClock(bed, 1380),
    doseMg: dose,
    age: age ? num(age, 0) : undefined,
  });

  const total = Math.max(1, plan.bedMin - plan.wakeMin);
  const pct = (min: number) => Math.max(0, Math.min(100, ((min - plan.wakeMin) / total) * 100));
  const greenPct = pct(plan.curfewMin);

  // ---- Shareable card (canvas → PNG) ----
  const makeCardBlob = (p: CaffeinePlan): Promise<Blob | null> =>
    new Promise((resolve) => {
      const W = 1200, H = 630;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 900);
      g.addColorStop(0, 'rgba(99,102,241,0.4)');
      g.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const sans = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.fillStyle = '#22c55e';
      ctx.font = `bold 30px ${sans}`;
      ctx.fillText('HealthyLifeStyles', 64, 88);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 24px ${sans}`;
      ctx.fillText('My Caffeine Curfew', 64, 126);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 92px ${sans}`;
      ctx.fillText(`Last coffee by ${formatClock(p.curfewMin)}`, 60, 250);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `600 30px ${sans}`;
      ctx.fillText(`for a ${formatClock(p.bedMin)} bedtime  ·  ~${p.hoursBeforeBed} h before bed`, 64, 300);
      // mini schedule
      const rows = [
        `Morning light:  within 1 h of waking (${formatClock(p.morningLightStartMin)})`,
        `Last caffeine:  ${formatClock(p.curfewMin)}`,
        `Screens off:  ${formatClock(p.screenCutoffMin)}`,
        `Wind down:  ${formatClock(p.windDownMin)}`,
        `Bedtime:  ${formatClock(p.bedMin)}`,
      ];
      ctx.font = `500 28px ${sans}`;
      rows.forEach((r, i) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('•  ' + r, 64, 372 + i * 42);
      });
      ctx.fillStyle = '#64748b';
      ctx.font = `500 22px ${sans}`;
      ctx.fillText('Sleep-hygiene estimate · ~5 h caffeine half-life · healthylifesstyles.com', 64, 600);
      c.toBlob((b) => resolve(b), 'image/png');
    });

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-caffeine-curfew.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const shareCard = async () => {
    setShareMsg('');
    const blob = await makeCardBlob(plan);
    if (!blob) return;
    const file = new File([blob], 'my-caffeine-curfew.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'My Caffeine Curfew', text: `My caffeine curfew is ${formatClock(plan.curfewMin)} for a ${formatClock(plan.bedMin)} bedtime.` });
        return;
      } catch { /* cancelled — fall through */ }
    }
    downloadBlob(blob);
    setShareMsg('Image saved — share it anywhere!');
  };

  return (
    <div class="cc">
      {/* ---------------- Inputs ---------------- */}
      <div class="cc__form card">
        <div class="cc__times">
          <label class="cc__field">
            <span>I wake up at</span>
            <input type="time" value={wake} onInput={(e) => setWake((e.target as HTMLInputElement).value)} />
          </label>
          <label class="cc__field">
            <span>I want to sleep at</span>
            <input type="time" value={bed} onInput={(e) => setBed((e.target as HTMLInputElement).value)} />
          </label>
          <label class="cc__field">
            <span>Age (optional)</span>
            <input type="number" min="0" max="120" value={age} placeholder="—"
              onInput={(e) => setAge((e.target as HTMLInputElement).value)} />
          </label>
        </div>

        <div class="cc__dose">
          <div class="cc__dose-head">
            <span>Your usual caffeine hit</span>
            <span class="cc__dose-val">{dose} mg</span>
          </div>
          <div class="cc__presets">
            {CAFFEINE_PRESETS.map((p) => (
              <button type="button" class={`cc__preset ${dose === p.mg ? 'is-on' : ''}`} onClick={() => setDose(p.mg)}>
                {p.label}<small>{p.mg} mg</small>
              </button>
            ))}
          </div>
          <label class="cc__field cc__mg">
            <span>Or enter milligrams</span>
            <input type="number" min="0" max="600" value={dose}
              onInput={(e) => setDose(num((e.target as HTMLInputElement).value, 0))} />
          </label>
        </div>
      </div>

      <p class="sr-only" role="status" aria-live="polite">
        Your caffeine curfew is {formatClock(plan.curfewMin)} for a {formatClock(plan.bedMin)} bedtime.
      </p>

      {/* ---------------- Hero ---------------- */}
      <div class="cc__hero card">
        <span class="cc__hero-cap">Your caffeine curfew</span>
        <span class="cc__hero-time">{formatClock(plan.curfewMin)}</span>
        <p class="cc__hero-sub">
          {plan.curfewBeforeWake
            ? `With ${plan.doseMg} mg, even morning caffeine leaves residual by a ${formatClock(plan.bedMin)} bedtime — consider a smaller dose or a later night.`
            : plan.lowDose
            ? `${plan.doseMg} mg is light, so timing matters less — but stopping by here keeps your ${formatClock(plan.bedMin)} bedtime clean.`
            : `Have your last ${plan.doseMg} mg by ${formatClock(plan.curfewMin)} — about ${plan.hoursBeforeBed} hours before your ${formatClock(plan.bedMin)} bedtime — to be near ${RESIDUAL_THRESHOLD_MG} mg residual by bed.`}
        </p>
        <p class="cc__backup">
          Prefer a cushion? The common rule of thumb is to stop {formatClock(plan.backupEarlyMin)}–{formatClock(plan.backupLateMin)} (8–10 hours before bed).
        </p>
      </div>

      {/* ---------------- Day timeline ---------------- */}
      <section class="cc__timeline card">
        <h2 class="cc__h">Your day, optimized for sleep</h2>
        <div class="cc__bar" aria-hidden="true">
          <div class="cc__bar-green" style={`width:${greenPct}%`}><span>Caffeine OK</span></div>
          <div class="cc__bar-amber" style={`width:${100 - greenPct}%`}><span>Curfew</span></div>
          <span class="cc__bar-tick" style={`left:${pct(plan.screenCutoffMin)}%`} title="Screens off"></span>
          <span class="cc__bar-tick" style={`left:${pct(plan.windDownMin)}%`} title="Wind down"></span>
        </div>
        <div class="cc__bar-ends">
          <span>{formatClock(plan.wakeMin)} wake</span>
          <span>{formatClock(plan.bedMin)} bed</span>
        </div>

        <ol class="cc__events">
          {plan.events.map((ev) => (
            <li class="cc__event">
              <span class="cc__event-dot" style={`background:${EVENT_DOT[ev.key]}`}></span>
              <span class="cc__event-time">{formatClock(ev.min)}</span>
              <span class="cc__event-body">
                <strong>{ev.label}</strong>
                {ev.detail && <small>{ev.detail}</small>}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- Decay chart ---------------- */}
      <section class="cc__decay card">
        <h2 class="cc__h">Caffeine still in your system</h2>
        <p class="cc__decay-sub">
          If your last {plan.doseMg} mg is at {formatClock(plan.curfewMin)}, this is roughly how much remains —
          about <strong>{plan.residualAtBed} mg</strong> by bedtime (≈5-hour half-life).
        </p>
        <DecayChart plan={plan} />
      </section>

      {/* ---------------- Share ---------------- */}
      <section class="cc__share card">
        <div>
          <h2 class="cc__h">Save your plan</h2>
          <p class="cc__share-sub">Download a shareable card with your full sleep timeline.</p>
        </div>
        <div class="cc__share-btns">
          <button type="button" class="btn btn-primary" onClick={shareCard}>Share my plan</button>
        </div>
        {shareMsg && <p class="cc__share-msg">{shareMsg}</p>}
      </section>

      {plan.slowMetabolizerNote && (
        <p class="cc__note">Older adults often clear caffeine more slowly — consider an even earlier cutoff than shown.</p>
      )}
      <p class="cc__note">
        General sleep-hygiene education, not medical advice. Caffeine metabolism varies a lot between people
        (genetics, smoking, pregnancy, and some medications change it) — treat these times as a starting point and adjust to how you feel.
      </p>
    </div>
  );
}

function DecayChart({ plan }: { plan: CaffeinePlan }) {
  const W = 560, Hgt = 240, pad = { l: 44, r: 14, t: 16, b: 28 };
  const pts = plan.decay;
  if (pts.length < 2) return null;
  const xs = pts.map((p) => p.min);
  const minX = xs[0], maxX = xs[xs.length - 1];
  const maxY = Math.max(plan.doseMg, RESIDUAL_THRESHOLD_MG) * 1.05;
  const x = (m: number) => pad.l + ((m - minX) / Math.max(1, maxX - minX)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / maxY) * (Hgt - pad.t - pad.b);
  const poly = pts.map((p) => `${x(p.min)},${y(p.mg)}`).join(' ');
  const area = `${x(minX)},${y(0)} ${poly} ${x(maxX)},${y(0)}`;
  const threshY = y(RESIDUAL_THRESHOLD_MG);
  const bedX = x(plan.bedMin);

  return (
    <svg viewBox={`0 0 ${W} ${Hgt}`} class="cc__chart" role="img" aria-label="Residual caffeine over time">
      {/* y gridlines */}
      {[0, 0.5, 1].map((f) => {
        const val = maxY * f;
        const yy = y(val);
        return (
          <g>
            <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#e2e8f0" stroke-width="1" />
            <text x={pad.l - 8} y={yy + 4} text-anchor="end" font-size="11" fill="#64748b">{Math.round(val)}</text>
          </g>
        );
      })}
      {/* 50 mg threshold */}
      <line x1={pad.l} y1={threshY} x2={W - pad.r} y2={threshY} stroke="#16a34a" stroke-width="1.5" stroke-dasharray="5 4" />
      <text x={W - pad.r} y={threshY - 6} text-anchor="end" font-size="11" fill="#16a34a">~{RESIDUAL_THRESHOLD_MG} mg</text>
      {/* area + curve */}
      <polygon points={area} fill="rgba(99,102,241,0.12)" />
      <polyline points={poly} fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round" />
      {/* bedtime marker */}
      <line x1={bedX} y1={pad.t} x2={bedX} y2={Hgt - pad.b} stroke="#0a1628" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x={bedX} y={Hgt - 8} text-anchor="middle" font-size="11" fill="#0a1628">bed</text>
      <circle cx={bedX} cy={y(plan.residualAtBed)} r="4" fill="#0a1628" />
      {/* x ends */}
      <text x={pad.l} y={Hgt - 8} text-anchor="start" font-size="11" fill="#64748b">{formatClock(minX)}</text>
    </svg>
  );
}
