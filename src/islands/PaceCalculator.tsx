/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { calculateRunningPace, convertDistance, convertPaceSeconds, distanceInput, formatHMS, formatMS, paceInputParts, parseDistance, parseElapsedSeconds, parsePaceSeconds, type PaceMode as Mode, type PaceUnit as Unit } from '../lib/running-pace';

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
  // Keep exact physical values across unit toggles; inputs show rounded units.
  // Once the user edits an input directly, the override is cleared.
  const [exactDistance, setExactDistance] = useState<number | null>(null);
  const [exactPace, setExactPace] = useState<number | null>(null);

  function changeUnit(next: Unit) {
    if (next === unit) return;
    const originalDistance = exactDistance ?? parseDistance(distance);
    if (Number.isFinite(originalDistance)) {
      const converted = convertDistance(originalDistance, unit, next);
      setDistance(distanceInput(converted));
      setExactDistance(converted);
    }
    const originalPace = exactPace ?? parsePaceSeconds(pM, pS);
    if (Number.isFinite(originalPace)) {
      const converted = convertPaceSeconds(originalPace, unit, next);
      const shown = paceInputParts(converted);
      setPM(shown.minutes);
      setPS(shown.seconds);
      setExactPace(converted);
    }
    setUnit(next);
  }

  const id = (k: string) => `pace-${k}`;
  const dist = exactDistance ?? parseDistance(distance);
  const timeSec = parseElapsedSeconds(tH,tM,tS);
  const paceSecIn = exactPace ?? parsePaceSeconds(pM,pS);
  const { valid, outDist, outTime, outPace, speed, splits } =
    calculateRunningPace(mode,unit,dist,timeSec,paceSecIn);
  const clockInvalid =
    (mode !== 'time' && !Number.isFinite(timeSec)) ||
    (mode !== 'pace' && !Number.isFinite(paceSecIn));

  const distLabel = `Distance`;
  const Field = (
    <div class="calc__field">
      <label class="calc__label" for={id('dist')}>{distLabel}</label>
      <div class="calc__input">
        <input type="number" inputMode="decimal" min="0" step="0.1" id={id('dist')} value={distance} onInput={(e) => { setDistance((e.target as HTMLInputElement).value); setExactDistance(null); }} />
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
        <div class="calc__input"><input type="number" inputMode="numeric" min="0" id={id('pm')} aria-label="Minutes" value={pM} onInput={(e) => { setPM((e.target as HTMLInputElement).value); setExactPace(null); }} /><span class="calc__suffix">min</span></div>
        <div class="calc__input"><input type="number" inputMode="numeric" min="0" max="59" id={id('ps')} aria-label="Seconds" value={pS} onInput={(e) => { setPS((e.target as HTMLInputElement).value); setExactPace(null); }} /><span class="calc__suffix">sec</span></div>
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
              <button type="button" class={`seg__btn${unit === u ? ' is-active' : ''}`} aria-pressed={unit === u} onClick={() => changeUnit(u)}>{u}</button>
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
          <p class={clockInvalid ? 'calc__error' : 'calc__placeholder'}>{clockInvalid
            ? 'Use whole-number hours/minutes and seconds from 0 to 59 for each clock field.'
            : 'Enter two valid positive values above to calculate the third.'}</p>
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
            <p class="calc__note">Splits assume constant pace. For distances above 60 {unit}, the first 60 split checkpoints and the final finish time are shown. Switching units converts the same physical distance and pace; displayed input seconds are rounded, while calculations preserve full conversion precision until you edit them.</p>
          </>
        )}
      </div>
    </div>
  );
}
