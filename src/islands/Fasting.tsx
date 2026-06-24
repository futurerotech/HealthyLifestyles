/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  PROTOCOLS,
  getProtocol,
  computeWindows,
  liveState,
  formatCountdown,
  type ProtocolKey,
} from '../lib/fasting';
import { formatClock, parseClock } from '../lib/caffeine';
import ShareResult from '../components/ShareResult';

export default function Fasting() {
  const [protocol, setProtocol] = useState<ProtocolKey>('16:8');
  const [eatStart, setEatStart] = useState('12:00');
  const [now, setNow] = useState(0); // seconds since midnight, ticks each second
  const raf = useRef<number>();

  // Live clock: update every second.
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const p = getProtocol(protocol);
  const eatStartMin = parseClock(eatStart, 720);

  if (!p.daily) {
    // 5:2 — no daily timer.
    return (
      <div class="if">
        <ProtocolPicker protocol={protocol} setProtocol={setProtocol} />
        <div class="if__info card">
          <h2 class="if__h">5:2 fasting</h2>
          <p>{p.desc}</p>
          <ul class="if__info-list">
            <li>Choose <strong>2 non-consecutive days</strong> a week (e.g. Tuesday &amp; Thursday) as your low-calorie days.</li>
            <li>On those days, keep intake to about <strong>500 kcal (women) / 600 kcal (men)</strong>.</li>
            <li>Eat normally — not excessively — on the other 5 days.</li>
            <li>Plenty of water, black coffee, and tea are fine on fasting days.</li>
          </ul>
          <p class="if__note">This is a weekly pattern rather than a daily window, so there’s no live countdown. Prefer a daily timer? Try 16:8 or 14:10.</p>
        </div>
        <Disclaimer />
      </div>
    );
  }

  const w = computeWindows(eatStartMin, p.eatH);
  const s = liveState(w, now);
  const eating = s.phase === 'eating';

  return (
    <div class="if">
      <ProtocolPicker protocol={protocol} setProtocol={setProtocol}>
        <label class="if__field">
          <span>Eating window starts at</span>
          <input type="time" value={eatStart} onInput={(e) => setEatStart((e.target as HTMLInputElement).value)} />
        </label>
      </ProtocolPicker>

      {/* Concise status for screen readers (no per-second updates → no spam). */}
      <p class="sr-only" role="status" aria-live="polite">
        {eating ? 'Eating window' : 'Fasting'} now; {eating ? 'closes' : 'you can eat'} at {formatClock(s.boundaryMin)}.
      </p>

      {/* Live timer */}
      <div class={`if__timer card ${eating ? 'is-eating' : 'is-fasting'}`}>
        <span class="if__badge">{eating ? '🍽️ Eating window' : '🌙 Fasting'}</span>
        <span class="if__count">{formatCountdown(s.secondsToBoundary)}</span>
        <span class="if__count-label">
          until {eating ? 'your eating window closes' : 'you can eat'} ({formatClock(s.boundaryMin)})
        </span>
        <div class="if__progress" aria-hidden="true">
          <div class={`if__progress-fill ${eating ? 'is-eating' : 'is-fasting'}`} style={`width:${Math.round(s.progress * 100)}%`}></div>
        </div>
      </div>

      {/* Windows */}
      <div class="if__windows">
        <div class="if__window card is-eat">
          <span class="if__window-cap">Eating window</span>
          <span class="if__window-time">{formatClock(w.eatStartMin)} – {formatClock(w.eatEndMin)}</span>
          <span class="if__window-sub">{p.eatH} hours to eat</span>
        </div>
        <div class="if__window card is-fast">
          <span class="if__window-cap">Fasting window</span>
          <span class="if__window-time">{formatClock(w.eatEndMin)} – {formatClock(w.eatStartMin)}</span>
          <span class="if__window-sub">{p.fastH} hours fasting</span>
        </div>
      </div>

      <p class="if__desc card">{p.desc} Black coffee, tea, and water are fine during your fast.</p>
      <Disclaimer />
      <ShareResult
        tool="Intermittent Fasting Timer"
        value={protocol}
        label={eating ? `Fasting ${formatCountdown(s.secondsToBoundary)} until eating` : `Eating ${formatCountdown(s.secondsToBoundary)} until fast`}
        category={eating ? 'Eating window' : 'Fasting'}
        categoryColor={eating ? '#22c55e' : '#6366f1'}
        toolSlug="intermittent-fasting-calculator"
      />
    </div>
  );
}

function ProtocolPicker({ protocol, setProtocol, children }: { protocol: ProtocolKey; setProtocol: (k: ProtocolKey) => void; children?: any }) {
  return (
    <div class="if__form card">
      <span class="if__form-label">Choose your protocol</span>
      <div class="if__protocols">
        {PROTOCOLS.map((p) => (
          <button type="button" class={`if__protocol ${protocol === p.key ? 'is-on' : ''}`} onClick={() => setProtocol(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

function Disclaimer() {
  return (
    <p class="if__disclaimer" role="note">
      <strong>This isn’t medical advice, and fasting isn’t for everyone.</strong> It’s not recommended if you’re pregnant or
      breastfeeding, under 18, have a history of disordered eating, or have diabetes or another condition affected by meal
      timing — check with a healthcare professional first.
    </p>
  );
}
