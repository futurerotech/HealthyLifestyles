/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import {
  MIN_PER_CYCLE,
  FALL_ASLEEP_MIN,
  parseTime,
  addMinutes,
  formatClock,
  formatHours,
} from '../lib/time';

const round1 = (n: number): number => Math.round(n * 10) / 10;

function Seg<T extends string>({
  value, options, onChange, label,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div class="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          class={`seg__btn${value === o.value ? ' is-active' : ''}`}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TimeField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div class="calc__field">
      <label class="calc__label" for={id}>{label}</label>
      <div class="calc__input">
        <input type="time" id={id} value={value} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />
      </div>
    </div>
  );
}

// ---------- 1. Sleep cycle calculator ----------
const CYCLES = [6, 5, 4];

function SleepCycleCalc() {
  const [mode, setMode] = useState<'wake' | 'bed'>('wake');
  const [time, setTime] = useState('07:00');
  const base = parseTime(time);

  const options =
    base == null
      ? []
      : CYCLES.map((c) => {
          const sleepMin = c * MIN_PER_CYCLE;
          const target =
            mode === 'wake'
              ? addMinutes(base, -(sleepMin + FALL_ASLEEP_MIN))
              : addMinutes(base, FALL_ASLEEP_MIN + sleepMin);
          return { cycles: c, hours: sleepMin / 60, time: target, good: c >= 5 };
        });

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar">
          <h2 class="calc__heading">Sleep Calculator</h2>
        </div>
        <div class="calc__field">
          <span class="calc__label">I want to…</span>
          <Seg
            label="Calculation mode"
            value={mode}
            onChange={setMode}
            options={[{ value: 'wake', label: 'Wake up at' }, { value: 'bed', label: 'Go to bed at' }]}
          />
        </div>
        <TimeField
          id="sleep-time"
          label={mode === 'wake' ? 'Wake-up time' : 'Bedtime'}
          value={time}
          onChange={setTime}
        />
        <p class="calc__help">Assumes about {FALL_ASLEEP_MIN} minutes to fall asleep, with {MIN_PER_CYCLE}-minute cycles.</p>
      </div>

      <div class="calc__result" aria-live="polite">
        {base == null ? (
          <p class="calc__error">Enter a valid time to see suggestions.</p>
        ) : (
          <>
            <span class="calc__result-label">
              {mode === 'wake'
                ? `To wake at ${formatClock(base)}, go to bed at:`
                : `Going to bed at ${formatClock(base)}, wake at:`}
            </span>
            <ul class="sleep-list">
              {options.map((o) => (
                <li class={`sleep-opt${o.good ? ' is-good' : ''}`}>
                  <span class="sleep-opt__meta">
                    <span class="sleep-opt__cycles">{o.cycles} cycles</span>
                    <span class="sleep-opt__hours">{formatHours(o.hours)} of sleep</span>
                  </span>
                  <span class="sleep-opt__time">{formatClock(o.time)}</span>
                  {o.good && <span class="sleep-opt__tag">Recommended</span>}
                </li>
              ))}
            </ul>
            <p class="calc__note">Most adults do best with 5-6 full cycles (7.5-9 hours). Waking at the end of a cycle helps you feel refreshed rather than groggy.</p>
            <div class="calc__callout calc__callout--info">
              <strong>Circadian tip:</strong> Get bright light (ideally outdoors) within 30 minutes of waking to anchor your body clock. Dim lights and screens 60 minutes before bed.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- 2. Nap calculator ----------
function NapCalc() {
  const [start, setStart] = useState('14:00');
  const base = parseTime(start);

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar">
          <h2 class="calc__heading">Nap Calculator</h2>
        </div>
        <TimeField id="nap-start" label="If you fall asleep at" value={start} onChange={setStart} />
        <p class="calc__help">Set the time you expect to drift off, and we’ll suggest when to wake.</p>
      </div>

      <div class="calc__result" aria-live="polite">
        {base == null ? (
          <p class="calc__error">Enter a valid time to see nap options.</p>
        ) : (
          <>
            <span class="calc__result-label">Best times to wake up</span>
            <ul class="sleep-list">
              <li class="sleep-opt is-good">
                <span class="sleep-opt__meta">
                  <span class="sleep-opt__cycles">Power nap</span>
                  <span class="sleep-opt__hours">10–20 minutes — quick energy boost</span>
                </span>
                <span class="sleep-opt__time">{formatClock(addMinutes(base, 10))} – {formatClock(addMinutes(base, 20))}</span>
              </li>
              <li class="sleep-opt is-good">
                <span class="sleep-opt__meta">
                  <span class="sleep-opt__cycles">Full cycle</span>
                  <span class="sleep-opt__hours">90 minutes — full restorative cycle</span>
                </span>
                <span class="sleep-opt__time">{formatClock(addMinutes(base, MIN_PER_CYCLE))}</span>
              </li>
            </ul>
            <p class="calc__callout calc__callout--info">
              Avoid naps of 30-60 minutes: you're likely to wake mid-cycle in deep sleep and feel groggy (sleep inertia). Keep it short, or commit to a full 90-minute cycle.
            </p>
            <div class="calc__callout calc__callout--info">
              <strong>Circadian tip:</strong> Nap before 3 PM if you can - late naps eat into your sleep drive and can push bedtime later. Bright light after your nap helps shake off grogginess.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- 3. Sleep debt calculator ----------
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SleepDebtCalc() {
  const [target, setTarget] = useState('8');
  const [days, setDays] = useState<string[]>(['7', '6.5', '7', '6', '8', '7.5', '6.5']);

  const T = parseFloat(target) || 0;
  const actuals = days.map((d) => parseFloat(d) || 0);
  const totalActual = actuals.reduce((a, b) => a + b, 0);
  const debt = T * 7 - totalActual;
  const avg = totalActual / 7;
  const nightsBelow = actuals.filter((a) => a < T).length;

  const inDebt = debt > 0.05;
  let badge: { label: string; color: string };
  if (!inDebt) badge = { label: 'Well rested', color: '#16a34a' };
  else if (debt < 5) badge = { label: 'Mild sleep debt', color: '#f59e0b' };
  else badge = { label: 'High sleep debt', color: '#ef4444' };

  const setDay = (i: number, v: string) => setDays((d) => d.map((x, idx) => (idx === i ? v : x)));

  const tips = inDebt
    ? [
        'Repay debt gradually — add 1–2 extra hours per night, not one long weekend lie-in.',
        'Go to bed 30–60 minutes earlier rather than sleeping in late, to protect your body clock.',
        'Keep a consistent wake-up time every day, including weekends.',
        'A short early-afternoon nap (10–20 minutes) can ease daytime sleepiness while you recover.',
      ]
    : [
        'You’re meeting your target — keep your sleep and wake times consistent to stay there.',
        'Protect your routine on weekends to avoid building debt during the week.',
      ];

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar">
          <h2 class="calc__heading">Sleep Debt Calculator</h2>
        </div>
        <div class="calc__field">
          <label class="calc__label" for="sleep-target">Target sleep per night</label>
          <div class="calc__input">
            <input
              type="number" inputMode="decimal" min="4" max="12" step="0.5"
              id="sleep-target" value={target}
              onInput={(e) => setTarget((e.target as HTMLInputElement).value)}
            />
            <span class="calc__suffix">hrs</span>
          </div>
        </div>
        <span class="calc__label">Hours slept each night</span>
        <div class="sleep-week">
          {DAY_LABELS.map((d, i) => (
            <div class="sleep-week__day">
              <label class="sleep-week__label" for={`sleep-day-${i}`}>{d}</label>
              <input
                type="number" inputMode="decimal" min="0" max="14" step="0.5"
                id={`sleep-day-${i}`} value={days[i]}
                onInput={(e) => setDay(i, (e.target as HTMLInputElement).value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div class="calc__result" aria-live="polite">
        <div class="calc__headline">
          <span class="calc__result-label">Weekly sleep {inDebt ? 'debt' : 'balance'}</span>
          <span class="calc__value">{round1(Math.abs(debt))} hrs</span>
          <span class="calc__badge" style={`--badge:${badge.color}`}>{badge.label}</span>
        </div>
        <dl class="calc__rows">
          <div class="calc__row">
            <dt>Average sleep / night</dt>
            <dd>{formatHours(avg)}</dd>
          </div>
          <div class="calc__row">
            <dt>Your target / night</dt>
            <dd>{formatHours(T)}</dd>
          </div>
          <div class="calc__row is-strong">
            <dt>Nights below target</dt>
            <dd>{nightsBelow} of 7</dd>
          </div>
        </dl>
        <div class="sleep-tips">
          <h3>{inDebt ? 'How to recover' : 'Keep it up'}</h3>
          <ul>
            {tips.map((t) => <li>{t}</li>)}
          </ul>
        </div>
        <div class="calc__callout calc__callout--info">
          <strong>Circadian tip:</strong> To repay sleep debt, go to bed 30-60 min earlier rather than sleeping in - a consistent wake time protects your body clock. Get morning light to lock the rhythm in.
        </div>
      </div>
    </div>
  );
}

export default function SleepCalculator({ slug }: { slug: string }) {
  if (slug === 'nap-calculator') return <NapCalc />;
  if (slug === 'sleep-debt-calculator') return <SleepDebtCalc />;
  return <SleepCycleCalc />;
}
