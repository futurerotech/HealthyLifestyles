/** @jsxImportSource preact */
// Phase 6 Hypothesis C: non-public prototype. Educational schedule arithmetic only, in the
// browser; nothing is stored or sent. Reuses the site's existing sleep, nap and caffeine
// tools by linking to them.
import { useMemo, useState } from 'preact/hooks';
import { planShift, parseTime, formatTime, formatDuration, PRESETS, type ShiftKind } from '../lib/shift-work.ts';

export default function ShiftWorkExplorer() {
  const [kind, setKind] = useState<ShiftKind>('night');
  const [start, setStart] = useState('23:00');
  const [end, setEnd] = useState('07:00');
  const [commute, setCommute] = useState(30);
  const [clock, setClock] = useState<12 | 24>(12);

  const choose = (k: ShiftKind) => {
    setKind(k);
    if (k !== 'custom') { setStart(formatTime(PRESETS[k].start, 24)); setEnd(formatTime(PRESETS[k].end, 24)); }
  };
  const s = parseTime(start), e = parseTime(end);
  const plan = useMemo(() => (s === null || e === null ? null : planShift({ start: s, end: e, commuteMin: commute })), [s, e, commute]);
  const t = (m: number) => formatTime(m, clock);

  return (
    <div class="swx">
      <form class="swx__form card" onSubmit={(ev) => ev.preventDefault()}>
        <fieldset class="swx__kinds">
          <legend>Shift</legend>
          {(['day', 'evening', 'night', 'custom'] as const).map((k) => (
            <label class={`swx__kind ${kind === k ? 'is-on' : ''}`}>
              <input type="radio" name="swx-kind" checked={kind === k} onChange={() => choose(k)} />
              {k === 'custom' ? 'Custom / rotating' : `${k[0].toUpperCase()}${k.slice(1)}`}
            </label>
          ))}
        </fieldset>
        <div class="swx__fields">
          <label class="swx__field"><span>Shift starts</span>
            <input type="time" value={start} onInput={(ev) => { setKind('custom'); setStart((ev.target as HTMLInputElement).value); }} /></label>
          <label class="swx__field"><span>Shift ends</span>
            <input type="time" value={end} onInput={(ev) => { setKind('custom'); setEnd((ev.target as HTMLInputElement).value); }} /></label>
          <label class="swx__field"><span>Commute each way (minutes)</span>
            <input type="number" min="0" max="240" step="5" value={commute}
              onInput={(ev) => setCommute(Math.max(0, Math.min(240, parseFloat((ev.target as HTMLInputElement).value) || 0)))} /></label>
        </div>
        <fieldset class="swx__clock">
          <legend>Time format</legend>
          <label><input type="radio" name="swx-clock" checked={clock === 12} onChange={() => setClock(12)} /> 12-hour</label>
          <label><input type="radio" name="swx-clock" checked={clock === 24} onChange={() => setClock(24)} /> 24-hour</label>
        </fieldset>
        <p class="swx__hint">For a rotating schedule, enter each shift pattern in turn; each has its own rest window.</p>
      </form>

      {plan && (
        <section class="swx__result card" aria-live="polite" aria-labelledby="swx-result-h">
          <h2 id="swx-result-h" class="swx__h">Your rest window</h2>
          <ul class="swx__list">
            <li>Leave home at <strong>{t(plan.leaveHome)}</strong>; home again at about <strong>{t(plan.arriveHome)}</strong>.</li>
            <li>Time off between shifts: <strong>{formatDuration(plan.restWindowMin)}</strong>.</li>
            <li>A possible main sleep window: <strong>{t(plan.sleepStart)} to {t(plan.sleepEnd)}</strong> ({formatDuration(plan.sleepMin)}), after 30 minutes to wind down, leaving an hour to get ready.</li>
            {plan.napWindow && <li>Optional short nap before work: about <strong>{t(plan.napWindow.start)} to {t(plan.napWindow.end)}</strong> (15–30 minutes; you may feel groggy right after waking).</li>}
            <li>Caffeine even 6 hours before sleep can shorten it: on this schedule that is about <strong>{t(plan.caffeineCutoff)}</strong>. Fine-tune it with the <a href="/tools/caffeine-curfew-calculator">caffeine curfew calculator</a>.</li>
          </ul>
          {plan.shortRest && (
            <p class="swx__warn" role="note">This schedule leaves less room than the 7 or more hours of sleep advised for adults. Short rest between shifts is linked to fatigue and errors; consider raising it with your employer or a clinician.</p>
          )}
          <p class="swx__more">Related tools: <a href="/tools/nap-calculator">nap calculator</a>, <a href="/tools/sleep-calculator">sleep cycle calculator</a>, <a href="/tools/sleep-chronotype-quiz">chronotype quiz</a>.</p>
        </section>
      )}

      <section class="swx__limits card" aria-labelledby="swx-limits-h">
        <h2 id="swx-limits-h" class="swx__h">What this can and cannot do</h2>
        <ul class="swx__list">
          <li>It does schedule arithmetic on the times you enter. It does not measure or predict your body clock, and it is not medical advice.</li>
          <li>It cannot promise better sleep, safety at work or lower health risks.</li>
          <li>If you are too sleepy to drive after a shift, do not drive: nap first or use other transport.</li>
          <li>If you regularly struggle to sleep or stay alert on your schedule, talk to a clinician or sleep specialist.</li>
          <li>Meal timing on night shifts is still being studied; this prototype does not suggest meal times.</li>
        </ul>
      </section>
    </div>
  );
}
