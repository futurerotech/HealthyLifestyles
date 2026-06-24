/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { FOODS, ACTIVITIES, minutesToBurn } from '../lib/walk-it-off';

type Units = 'kg' | 'lb';
const LB = 2.20462;
const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};

export default function WalkItOff() {
  const [units, setUnits] = useState<Units>('kg');
  const [weight, setWeight] = useState(70);
  const [mode, setMode] = useState<'food' | 'custom'>('food');
  const [foodIdx, setFoodIdx] = useState(0);
  const [customKcal, setCustomKcal] = useState(300);
  const [shareMsg, setShareMsg] = useState('');

  const switchUnits = (next: Units) => {
    if (next === units) return;
    setWeight((w) => Math.round(w * (next === 'lb' ? LB : 1 / LB)));
    setUnits(next);
  };

  const weightKg = units === 'kg' ? weight : weight / LB;
  const food = FOODS[foodIdx];
  const kcal = mode === 'food' ? food.kcal : Math.max(0, customKcal);
  const label = mode === 'food' ? `${food.emoji} ${food.name}` : `${kcal} kcal`;
  const results = ACTIVITIES.map((a) => ({ ...a, minutes: Math.round(minutesToBurn(kcal, a.met, weightKg)) }));

  const shareCard = async () => {
    setShareMsg('');
    const W = 1200, H = 630;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#0a1628'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(0, H, 0, 0, H, 900);
    g.addColorStop(0, 'rgba(139,92,246,0.4)'); g.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sans = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#22c55e'; ctx.font = `bold 30px ${sans}`; ctx.fillText('HealthyLifeStyles', 64, 84);
    ctx.fillStyle = '#94a3b8'; ctx.font = `500 26px ${sans}`; ctx.fillText('Walk it off', 64, 122);
    ctx.fillStyle = '#fff'; ctx.font = `800 56px ${sans}`;
    ctx.fillText(`${label}`.slice(0, 30), 64, 210);
    ctx.fillStyle = '#cbd5e1'; ctx.font = `600 30px ${sans}`; ctx.fillText(`= ${kcal} kcal to burn`, 64, 256);
    ctx.font = `600 40px ${sans}`;
    results.forEach((r, i) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${r.emoji}  ${r.label}: ${r.minutes} min`, 64, 350 + i * 70);
    });
    ctx.fillStyle = '#64748b'; ctx.font = `500 22px ${sans}`;
    ctx.fillText('Estimate · healthylifestyles.com/tools/walk-it-off-calculator', 64, 600);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png')); if (!blob) return;
    const file = new File([blob], 'walk-it-off.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'Walk it off', text: `${label} = ${results[0].minutes} min walking. Find yours:` }); return; } catch { /* */ }
    }
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'walk-it-off.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    setShareMsg('Image saved — share it anywhere!');
  };

  return (
    <div class="wo">
      <div class="wo__form card">
        <div class="wo__modes" role="group" aria-label="Input mode">
          <button type="button" class={mode === 'food' ? 'is-on' : ''} onClick={() => setMode('food')}>Pick a food</button>
          <button type="button" class={mode === 'custom' ? 'is-on' : ''} onClick={() => setMode('custom')}>Enter calories</button>
        </div>
        <div class="wo__inputs">
          {mode === 'food' ? (
            <label class="wo__field">
              <span>Food</span>
              <select value={String(foodIdx)} onChange={(e) => setFoodIdx(Number((e.target as HTMLSelectElement).value))}>
                {FOODS.map((f, i) => <option value={String(i)}>{f.emoji} {f.name} ({f.kcal} kcal)</option>)}
              </select>
            </label>
          ) : (
            <label class="wo__field">
              <span>Calories</span>
              <input type="number" min="0" max="3000" value={customKcal} onInput={(e) => setCustomKcal(num((e.target as HTMLInputElement).value, 0))} />
            </label>
          )}
          <label class="wo__field wo__field--weight">
            <span>Your weight</span>
            <div class="wo__wt">
              <input type="number" min="1" value={weight} onInput={(e) => setWeight(num((e.target as HTMLInputElement).value, 0))} />
              <div class="wo__units" role="group" aria-label="Units">
                <button type="button" class={units === 'kg' ? 'is-on' : ''} onClick={() => switchUnits('kg')}>kg</button>
                <button type="button" class={units === 'lb' ? 'is-on' : ''} onClick={() => switchUnits('lb')}>lb</button>
              </div>
            </div>
          </label>
        </div>
      </div>

      <p class="sr-only" role="status" aria-live="polite">
        To burn {kcal} calories: {results[0].minutes} minutes walking, {results[1].minutes} running, or {results[2].minutes} cycling.
      </p>
      <div class="wo__result card">
        <p class="wo__food-line">To burn off <strong>{label}</strong> ({kcal} kcal):</p>
        <div class="wo__activities">
          {results.map((r) => (
            <div class="wo__activity">
              <span class="wo__activity-emoji">{r.emoji}</span>
              <span class="wo__activity-min">{r.minutes}</span>
              <span class="wo__activity-label">min {r.label.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <section class="wo__share card">
        <div><h2 class="wo__h">Share it</h2><p class="wo__share-sub">Tag a friend who needs to see this.</p></div>
        <div class="wo__share-btns"><button type="button" class="btn btn-primary" onClick={shareCard}>Share result</button></div>
        {shareMsg && <p class="wo__share-msg">{shareMsg}</p>}
      </section>

      <p class="wo__note">Estimates based on MET values and your body weight; actual burn varies with intensity, fitness, and terrain. General wellness info — eating should be enjoyable, and exercise is about more than burning off food.</p>
    </div>
  );
}
