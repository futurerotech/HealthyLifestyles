/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { computeSitting, type JobType, type SittingResult } from '../lib/sitting';

type Units = 'kg' | 'lb';
const LB = 2.20462;
const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};

export default function SittingReversal() {
  const [units, setUnits] = useState<Units>('kg');
  const [sittingHours, setSittingHours] = useState(8);
  const [weight, setWeight] = useState(75);
  const [steps, setSteps] = useState(5000);
  const [job, setJob] = useState<JobType>('desk');
  const [shareMsg, setShareMsg] = useState('');

  const switchUnits = (next: Units) => {
    if (next === units) return;
    setWeight((w) => Math.round(w * (next === 'lb' ? LB : 1 / LB)));
    setUnits(next);
  };

  const weightKg = units === 'kg' ? weight : weight / LB;
  const r = computeSitting({ sittingHours, weightKg, currentSteps: steps, job });

  // ---- Shareable card ----
  const makeCardBlob = (res: SittingResult): Promise<Blob | null> =>
    new Promise((resolve) => {
      const W = 1200, H = 630;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W, H, 0, W, H, 900);
      g.addColorStop(0, 'rgba(139,92,246,0.4)');
      g.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const sans = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.fillStyle = '#22c55e';
      ctx.font = `bold 30px ${sans}`;
      ctx.fillText('HealthyLifeStyles', 64, 88);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 24px ${sans}`;
      ctx.fillText('My Movement Recipe', 64, 126);
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 78px ${sans}`;
      ctx.fillText(`+${res.addedSteps.toLocaleString('en-US')} steps/day`, 60, 240);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `600 30px ${sans}`;
      ctx.fillText(`to offset ${res.sittingHours} h of sitting`, 64, 288);
      const rows = [
        `Move every ${res.breakIntervalMin} min  ·  ${res.breaksPerDay} breaks/day`,
        `${res.movementMinutes} min on your feet`,
        `~${res.caloriesReclaimed} kcal reclaimed daily  (~${res.caloriesWeekly.toLocaleString('en-US')}/week)`,
        `New step goal: ${res.newDailySteps.toLocaleString('en-US')}/day`,
      ];
      ctx.font = `500 30px ${sans}`;
      rows.forEach((t, i) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('•  ' + t, 64, 372 + i * 48);
      });
      ctx.fillStyle = '#64748b';
      ctx.font = `500 22px ${sans}`;
      ctx.fillText('General wellness estimate · healthylifesstyles.com/tools/sitting-disease-reversal-calculator', 64, 600);
      c.toBlob((b) => resolve(b), 'image/png');
    });

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-movement-recipe.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const shareCard = async () => {
    setShareMsg('');
    const blob = await makeCardBlob(r);
    if (!blob) return;
    const file = new File([blob], 'my-movement-recipe.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'My Movement Recipe', text: `My plan to offset ${r.sittingHours}h of sitting: +${r.addedSteps} steps/day and a break every ${r.breakIntervalMin} min.` });
        return;
      } catch { /* cancelled */ }
    }
    downloadBlob(blob);
    setShareMsg('Image saved — share it anywhere!');
  };

  return (
    <div class="sr">
      {/* ---------------- Inputs ---------------- */}
      <div class="sr__form card">
        <div class="sr__form-head">
          <h2>Your day</h2>
          <div class="sr__units" role="group" aria-label="Units">
            <button type="button" class={units === 'kg' ? 'is-on' : ''} onClick={() => switchUnits('kg')}>kg</button>
            <button type="button" class={units === 'lb' ? 'is-on' : ''} onClick={() => switchUnits('lb')}>lb</button>
          </div>
        </div>
        <div class="sr__grid">
          <label class="sr__field">
            <span>Hours sitting per day</span>
            <input type="number" min="0" max="18" step="0.5" value={sittingHours}
              onInput={(e) => setSittingHours(num((e.target as HTMLInputElement).value, 0))} />
          </label>
          <label class="sr__field">
            <span>Body weight</span>
            <div class="sr__input-unit">
              <input type="number" min="1" value={weight} onInput={(e) => setWeight(num((e.target as HTMLInputElement).value, 0))} />
              <small>{units}</small>
            </div>
          </label>
          <label class="sr__field">
            <span>Current daily steps</span>
            <input type="number" min="0" step="500" value={steps}
              onInput={(e) => setSteps(num((e.target as HTMLInputElement).value, 0))} />
          </label>
          <label class="sr__field">
            <span>Job type (optional)</span>
            <select value={job} onChange={(e) => setJob((e.target as HTMLSelectElement).value as JobType)}>
              <option value="desk">Desk / office</option>
              <option value="mixed">Mixed (some moving)</option>
              <option value="active">On my feet a lot</option>
            </select>
          </label>
        </div>
        <p class={`sr__level sr__level--${r.sittingLevel.replace(' ', '-')}`}>{r.sittingNote}</p>
      </div>

      <p class="sr-only" role="status" aria-live="polite">
        {r.breaksPerDay} micro-breaks and {r.addedSteps.toLocaleString('en-US')} extra steps a day; about {r.caloriesReclaimed} calories reclaimed.
      </p>

      {/* ---------------- Movement recipe ---------------- */}
      <section class="sr__recipe card">
        <h2 class="sr__h">Your movement recipe</h2>
        <div class="sr__stats">
          <div class="sr__stat">
            <span class="sr__stat-num">{r.breaksPerDay}</span>
            <span class="sr__stat-label">micro-breaks/day</span>
            <span class="sr__stat-sub">every ~30–60 min, 2–5 min each</span>
          </div>
          <div class="sr__stat sr__stat--accent">
            <span class="sr__stat-num">+{r.addedSteps.toLocaleString('en-US')}</span>
            <span class="sr__stat-label">steps/day (NEAT)</span>
            <span class="sr__stat-sub">new goal ~{r.newDailySteps.toLocaleString('en-US')}/day</span>
          </div>
          <div class="sr__stat">
            <span class="sr__stat-num">~{r.caloriesReclaimed}</span>
            <span class="sr__stat-label">kcal reclaimed/day</span>
            <span class="sr__stat-sub">≈ {r.caloriesWeekly.toLocaleString('en-US')} kcal/week</span>
          </div>
        </div>
        <p class="sr__recipe-line">
          Aim to stand and move for about <strong>{r.breakDurationMin} minutes</strong> every <strong>30–60 minutes</strong>
          ({r.breaksPerDay} breaks across your day = <strong>{r.movementMinutes} minutes</strong> on your feet), and add
          roughly <strong>{r.addedSteps.toLocaleString('en-US')} steps</strong> of everyday movement outside structured exercise.
        </p>
      </section>

      {/* ---------------- Ideas ---------------- */}
      <section class="sr__ideas card">
        <h2 class="sr__h">3 quick desk-movement ideas</h2>
        <ul>
          {r.ideas.map((idea) => (
            <li><span class="sr__idea-dot" aria-hidden="true">→</span><span>{idea}</span></li>
          ))}
        </ul>
      </section>

      {/* ---------------- Calories detail ---------------- */}
      <section class="sr__cal card">
        <h2 class="sr__h">Where the calories come from</h2>
        <p class="sr__cal-sub">A rough, MET-based estimate of the extra energy you’d burn — small per day, but it adds up.</p>
        <div class="sr__cal-rows">
          <div><span>Added steps ({r.addedSteps.toLocaleString('en-US')} ≈ {r.walkMinutes} min walking)</span><strong>~{r.kcalSteps} kcal</strong></div>
          <div><span>Movement breaks ({r.movementMinutes} min on your feet)</span><strong>~{r.kcalBreaks} kcal</strong></div>
          <div class="sr__cal-total"><span>Reclaimed per day</span><strong>~{r.caloriesReclaimed} kcal</strong></div>
        </div>
      </section>

      {/* ---------------- Share ---------------- */}
      <section class="sr__share card">
        <div>
          <h2 class="sr__h">Share your recipe</h2>
          <p class="sr__share-sub">Post your movement plan — or send it to a desk-bound friend.</p>
        </div>
        <div class="sr__share-btns">
          <button type="button" class="btn btn-primary" onClick={shareCard}>Share my recipe</button>
        </div>
        {shareMsg && <p class="sr__share-msg">{shareMsg}</p>}
      </section>

      <p class="sr__note">
        General wellness education, not medical advice. Calorie figures are rough MET-based estimates that assume an
        average walking pace. If you have a health condition, check with a professional before changing your activity.
      </p>
    </div>
  );
}
