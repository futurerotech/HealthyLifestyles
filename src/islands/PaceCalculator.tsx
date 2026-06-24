/** @jsxImportSource preact */
import { useState } from 'preact/hooks';

type Unit = 'km' | 'mi';
type Mode = 'time' | 'pace' | 'distance';

const n = (s: string): number => {
  const v = parseFloat(s);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};
const pad = (x: number): string => String(x).padStart(2, '0');

const formatHMS = (sec: number): string => {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};
const formatMS = (sec: number): string => {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
};

function Seg({ value, options, onChange, label }: { value: Mode; options: { value: Mode; label: string }[]; onChange: (v: Mode) => void; label: string }) {
  return (
    <div class="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" class={`seg__btn${value === o.value ? ' is-active' : ''}`} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function PaceCalculator(_: { slug: string }) {
  const [unit, setUnit] = useState<Unit>('km');
  const [mode, setMode] = useState<Mode>('time');
  const [distance, setDistance] = useState('10');
  const [tH, setTH] = useState('0');
  const [tM, setTM] = useState('50');
  const [tS, setTS] = useState('0');
  const [pM, setPM] = useState('5');
  const [pS, setPS] = useState('0');

  const id = (k: string) => `pace-${k}`;
  const dist = n(distance);
  const timeSec = n(tH) * 3600 + n(tM) * 60 + n(tS);
  const paceSecIn = n(pM) * 60 + n(pS);

  // Resolve all three values from the two inputs that apply to the chosen mode.
  let outDist = dist;
  let outTime = timeSec;
  let outPace = paceSecIn;
  let valid = true;
  if (mode === 'time') { outTime = dist * paceSecIn; valid = dist > 0 && paceSecIn > 0; }
  else if (mode === 'pace') { outPace = dist > 0 ? timeSec / dist : 0; valid = dist > 0 && timeSec > 0; }
  else { outDist = paceSecIn > 0 ? timeSec / paceSecIn : 0; valid = timeSec > 0 && paceSecIn > 0; }

  const speed = outTime > 0 ? outDist / (outTime / 3600) : 0;

  // Splits at each whole unit, cumulative time.
  const splits: { mark: number; label: string; time: number }[] = [];
  if (valid && outPace > 0 && outDist > 0) {
    const whole = Math.min(60, Math.floor(outDist));
    for (let k = 1; k <= whole; k++) splits.push({ mark: k, label: `${k} ${unit}`, time: outPace * k });
    if (outDist - whole > 0.01 && whole < 60) splits.push({ mark: outDist, label: `${outDist.toFixed(2)} ${unit} (finish)`, time: outPace * outDist });
  }

  const distLabel = `Distance`;
  const Field = (
    <div class="calc__field">
      <label class="calc__label" for={id('dist')}>{distLabel}</label>
      <div class="calc__input">
        <input type="number" inputMode="decimal" min="0" step="0.1" id={id('dist')} value={distance} onInput={(e) => setDistance((e.target as HTMLInputElement).value)} />
        <span class="calc__suffix">{unit}</span>
      </div>
    </div>
  );
  const TimeField = (
    <div class="calc__field">
      <span class="calc__label" id={id('time-grp')}>Time</span>
      <div class="calc__triple" role="group" aria-labelledby={id('time-grp')}>
        <div class="calc__input"><input type="number" inputMode="numeric" min="0" id={id('th')} aria-label="Hours" value={tH} onInput={(e) => setTH((e.target as HTMLInputElement).value)} /><span class="calc__suffix">h</span></div>
        <div class="calc__input"><input type="number" inputMode="numeric" min="0" max="59" id={id('tm')} aria-label="Minutes" value={tM} onInput={(e) => setTM((e.target as HTMLInputElement).value)} /><span class="calc__suffix">m</span></div>
        <div class="calc__input"><input type="number" inputMode="numeric" min="0" max="59" id={id('ts')} aria-label="Seconds" value={tS} onInput={(e) => setTS((e.target as HTMLInputElement).value)} /><span class="calc__suffix">s</span></div>
      </div>
    </div>
  );
  const PaceField = (
    <div class="calc__field">
      <span class="calc__label" id={id('pace-grp')}>Pace (per {unit})</span>
      <div class="calc__triple calc__triple--two" role="group" aria-labelledby={id('pace-grp')}>
        <div class="calc__input"><input type="number" inputMode="numeric" min="0" id={id('pm')} aria-label="Minutes" value={pM} onInput={(e) => setPM((e.target as HTMLInputElement).value)} /><span class="calc__suffix">min</span></div>
        <div class="calc__input"><input type="number" inputMode="numeric" min="0" max="59" id={id('ps')} aria-label="Seconds" value={pS} onInput={(e) => setPS((e.target as HTMLInputElement).value)} /><span class="calc__suffix">sec</span></div>
      </div>
    </div>
  );

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar">
          <h2 class="calc__heading">Running Pace</h2>
          <div class="seg" role="group" aria-label="Unit">
            {(['km', 'mi'] as Unit[]).map((u) => (
              <button type="button" class={`seg__btn${unit === u ? ' is-active' : ''}`} aria-pressed={unit === u} onClick={() => setUnit(u)}>{u}</button>
            ))}
          </div>
        </div>
        <div class="calc__field">
          <span class="calc__label">Calculate</span>
          <Seg label="What to calculate" value={mode} onChange={setMode}
            options={[{ value: 'time', label: 'Time' }, { value: 'pace', label: 'Pace' }, { value: 'distance', label: 'Distance' }]} />
        </div>
        {mode !== 'distance' && Field}
        {mode !== 'time' && TimeField}
        {mode !== 'pace' && PaceField}
      </div>

      <div class="calc__result" aria-live="polite">
        {!valid ? (
          <p class="calc__placeholder">Enter the two values above to calculate the third.</p>
        ) : (
          <>
            <div class="calc__headline">
              <span class="calc__result-label">{mode === 'time' ? 'Finish time' : mode === 'pace' ? 'Required pace' : 'Distance'}</span>
              <span class="calc__value">
                {mode === 'time' ? formatHMS(outTime) : mode === 'pace' ? `${formatMS(outPace)}/${unit}` : `${outDist.toFixed(2)} ${unit}`}
              </span>
            </div>
            <dl class="calc__rows">
              {mode !== 'distance' && <div class="calc__row"><dt>Distance</dt><dd>{outDist.toFixed(2)} {unit}</dd></div>}
              {mode !== 'time' && <div class="calc__row"><dt>Finish time</dt><dd>{formatHMS(outTime)}</dd></div>}
              {mode !== 'pace' && <div class="calc__row"><dt>Pace</dt><dd>{formatMS(outPace)}/{unit}</dd></div>}
              <div class="calc__row is-strong"><dt>Average speed</dt><dd>{speed.toFixed(1)} {unit === 'km' ? 'km/h' : 'mph'}</dd></div>
            </dl>
            {splits.length > 0 && (
              <>
                <span class="calc__result-label">Splits (cumulative time)</span>
                <ul class="sleep-list pace-splits">
                  {splits.map((s) => (
                    <li class="sleep-opt">
                      <span class="sleep-opt__meta"><span class="sleep-opt__cycles">{s.label}</span></span>
                      <span class="sleep-opt__time">{formatHMS(s.time)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p class="calc__note">Splits assume an even (constant) pace across the whole distance.</p>
          </>
        )}
      </div>
    </div>
  );
}
