/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { FOODS, ACTIVITIES, minutesToBurn, weightToKg, weightForDisplay, validWalkInputs, type WeightUnits } from '../lib/walk-it-off';

type Units = WeightUnits;
const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};

export default function WalkItOff() {
  const [units, setUnits] = useState<Units>('kg');
  const [weightKg, setWeightKg] = useState(70);
  const [mode, setMode] = useState<'food' | 'custom'>('food');
  const [foodIdx, setFoodIdx] = useState(0);
  const [customKcal, setCustomKcal] = useState(300);
  const [shareMsg, setShareMsg] = useState('');

  const switchUnits = (next: Units) => {
    if (next === units) return;
    setUnits(next);
  };

  const food = FOODS[foodIdx];
  const kcal = mode === 'food' ? food.kcal : customKcal;
  const label = mode === 'food' ? `${food.emoji} ${food.name}` : `${kcal} kcal`;
  const validInputs = validWalkInputs(kcal, weightKg);
  const results = ACTIVITIES.map((a) => ({ ...a, minutes: validInputs ? Math.round(minutesToBurn(kcal, a.met, weightKg)) : null }));

  const shareCard = async () => {
    if (!validInputs) return;
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
    ctx.fillStyle = '#94a3b8'; ctx.font = `500 26px ${sans}`; ctx.fillText('Illustrative movement time', 64, 122);
    ctx.fillStyle = '#fff'; ctx.font = `800 56px ${sans}`;
    ctx.fillText(`${label}`.slice(0, 30), 64, 210);
    ctx.fillStyle = '#cbd5e1'; ctx.font = `600 30px ${sans}`; ctx.fillText(`≈ ${kcal} kcal of above-rest activity energy`, 64, 256);
    ctx.font = `600 40px ${sans}`;
    results.forEach((r, i) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${r.emoji}  ${r.label}: ${r.minutes} min`, 64, 350 + i * 70);
    });
    ctx.fillStyle = '#64748b'; ctx.font = `500 22px ${sans}`;
    ctx.fillText('Estimate · healthylifesstyles.com/tools/walk-it-off-calculator', 64, 600);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png')); if (!blob) return;
    const file = new File([blob], 'walk-it-off.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'Movement-time illustration', text: `${label}: about ${results[0].minutes} min walking above rest (estimate, not a food rule).` }); return; } catch { /* */ }
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
              <input type="number" min={units === 'kg' ? 1 : 2.2} max={units === 'kg' ? 300 : 662} step="any" value={weightForDisplay(weightKg, units)} onInput={(e) => setWeightKg(weightToKg(num((e.target as HTMLInputElement).value, 0), units))} />
              <div class="wo__units" role="group" aria-label="Units">
                <button type="button" class={units === 'kg' ? 'is-on' : ''} onClick={() => switchUnits('kg')}>kg</button>
                <button type="button" class={units === 'lb' ? 'is-on' : ''} onClick={() => switchUnits('lb')}>lb</button>
              </div>
            </div>
          </label>
        </div>
      </div>

      <p class="sr-only" role="status" aria-live="polite">
        {validInputs ? `Illustrative extra activity time above rest: ${results[0].minutes} minutes walking, ${results[1].minutes} running, or ${results[2].minutes} cycling.` : 'Enter a weight from 1 to 300 kilograms and food calories from 0 to 3000 to see an estimate.'}
      </p>
      <div class="wo__result card">
        <p class="wo__food-line">{validInputs ? <>Illustrative activity time for <strong>{label}</strong> ({kcal} kcal above resting energy):</> : 'Enter a valid weight and calorie amount to see an estimate.'}</p>
        {validInputs && <div class="wo__activities">
          {results.map((r) => (
            <div class="wo__activity">
              <span class="wo__activity-emoji">{r.emoji}</span>
              <span class="wo__activity-min">{r.minutes}</span>
              <span class="wo__activity-label">min {r.label.toLowerCase()}</span>
            </div>
          ))}
        </div>}
      </div>

      <section class="wo__share card">
        <div><h2 class="wo__h">Share it</h2><p class="wo__share-sub">Tag a friend who needs to see this.</p></div>
        <div class="wo__share-btns"><button type="button" class="btn btn-primary" onClick={shareCard} disabled={!validInputs}>Share result</button></div>
        {shareMsg && <p class="wo__share-msg">{shareMsg}</p>}
      </section>

      <p class="wo__note">Illustrative above-rest energy only: uses (MET − 1) × body weight × time, not measured calories. Real energy needs vary; this is not a requirement to exercise after eating or a way to undo a meal. Enjoy food and move for reasons beyond calories.</p>
    </div>
  );
}
