/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { CAFFEINE_PRESETS, SAFE_DAILY_CAFFEINE_MG } from '../lib/caffeine';

export default function CaffeineTracker() {
  const [counts, setCounts] = useState<number[]>(() => CAFFEINE_PRESETS.map(() => 0));

  const change = (i: number, delta: number) =>
    setCounts((c) => c.map((n, idx) => (idx === i ? Math.max(0, n + delta) : n)));
  const reset = () => setCounts(CAFFEINE_PRESETS.map(() => 0));

  const total = CAFFEINE_PRESETS.reduce((s, p, i) => s + p.mg * counts[i], 0);
  const limit = SAFE_DAILY_CAFFEINE_MG;
  const pct = Math.min(100, Math.round((total / limit) * 100));
  const status = total === 0 ? 'none' : total < limit * 0.75 ? 'ok' : total <= limit ? 'approaching' : 'over';
  const anyLogged = total > 0;

  const statusText: Record<string, string> = {
    none: 'Log your drinks to see your daily total.',
    ok: 'You’re comfortably within the general daily limit.',
    approaching: 'You’re getting close to the general daily limit — go easy on more.',
    over: `That’s above ~${limit} mg, the amount generally considered safe for most healthy adults. Consider cutting back, especially later in the day.`,
  };

  return (
    <div class="ct">
      <div class="ct__log card">
        <div class="ct__log-head">
          <h2 class="ct__h">What have you had today?</h2>
          {anyLogged && <button type="button" class="ct__reset" onClick={reset}>Reset</button>}
        </div>
        <ul class="ct__drinks">
          {CAFFEINE_PRESETS.map((p, i) => (
            <li class="ct__drink">
              <span class="ct__drink-name">{p.label}<small>{p.mg} mg each</small></span>
              <div class="ct__stepper" role="group" aria-label={p.label}>
                <button type="button" onClick={() => change(i, -1)} aria-label={`One fewer ${p.label}`} disabled={counts[i] === 0}>−</button>
                <span>{counts[i]}</span>
                <button type="button" onClick={() => change(i, 1)} aria-label={`One more ${p.label}`}>+</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p class="sr-only" role="status" aria-live="polite">
        Today’s caffeine total: {total} milligrams of {limit}.
      </p>

      <div class={`ct__total card ct__total--${status}`}>
        <span class="ct__total-cap">Today’s caffeine</span>
        <span class="ct__total-num">{total} <small>mg</small></span>
        <div class="ct__bar" aria-hidden="true">
          <div class={`ct__bar-fill ct__bar-fill--${status}`} style={`width:${pct}%`}></div>
          <span class="ct__bar-limit" title={`${limit} mg limit`}></span>
        </div>
        <span class="ct__bar-scale">0 mg<span>{limit} mg safe limit</span></span>
        <p class={`ct__status ct__status--${status}`}>{statusText[status]}</p>
      </div>

      <p class="ct__pair">
        Want to know how late is too late? Try the <a href="/tools/caffeine-curfew-calculator">Caffeine Curfew Calculator</a> to time your last cup for better sleep.
      </p>
      <p class="ct__note">
        General wellness education, not medical advice. The ~{limit} mg figure is for healthy adults; pregnant people and those
        sensitive to caffeine should aim considerably lower. Drink caffeine amounts vary by brand and size — these are typical values.
      </p>
    </div>
  );
}
