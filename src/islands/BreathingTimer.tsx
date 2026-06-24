/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';

type Technique = 'box' | '478';
interface Phase { label: string; secs: number; scale: number; }

const PATTERNS: Record<Technique, Phase[]> = {
  box: [
    { label: 'Breathe in', secs: 4, scale: 1 },
    { label: 'Hold', secs: 4, scale: 1 },
    { label: 'Breathe out', secs: 4, scale: 0.55 },
    { label: 'Hold', secs: 4, scale: 0.55 },
  ],
  '478': [
    { label: 'Breathe in', secs: 4, scale: 1 },
    { label: 'Hold', secs: 7, scale: 1 },
    { label: 'Breathe out', secs: 8, scale: 0.55 },
  ],
};

export default function BreathingTimer(_: { slug: string }) {
  const [technique, setTechnique] = useState<Technique>('box');
  const [running, setRunning] = useState(false);
  const [t, setT] = useState({ phase: 0, left: 4, cycles: 0 });

  const pattern = PATTERNS[technique];

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setT((prev) => {
        let { phase, left, cycles } = prev;
        left -= 1;
        if (left <= 0) {
          phase = (phase + 1) % pattern.length;
          if (phase === 0) cycles += 1;
          left = pattern[phase].secs;
        }
        return { phase, left, cycles };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, technique]);

  const reset = (tech: Technique = technique) => {
    setRunning(false);
    setT({ phase: 0, left: PATTERNS[tech][0].secs, cycles: 0 });
  };
  const start = () => { if (!running) setT({ phase: 0, left: pattern[0].secs, cycles: 0 }); setRunning(true); };
  const switchTechnique = (tech: Technique) => { setTechnique(tech); reset(tech); };

  const phase = pattern[t.phase];
  const scale = running ? phase.scale : 0.7;
  const label = running ? phase.label : 'Ready';
  const count = running ? t.left : '';
  // Match the scale transition to the phase length so growth/shrink is smooth.
  const dur = running ? phase.secs : 0.6;

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar">
          <h2 class="calc__heading">Box Breathing</h2>
          <div class="seg" role="group" aria-label="Technique">
            <button type="button" class={`seg__btn${technique === 'box' ? ' is-active' : ''}`} aria-pressed={technique === 'box'} onClick={() => switchTechnique('box')}>4-4-4-4</button>
            <button type="button" class={`seg__btn${technique === '478' ? ' is-active' : ''}`} aria-pressed={technique === '478'} onClick={() => switchTechnique('478')}>4-7-8</button>
          </div>
        </div>
        <p class="calc__help">
          {technique === 'box'
            ? 'Box breathing: inhale, hold, exhale and hold — each for 4 seconds. Used to calm the nervous system.'
            : 'The 4-7-8 technique: inhale for 4, hold for 7, exhale for 8 — a longer exhale to help you relax.'}
        </p>
        <div class="calc__cards" style="margin:0">
          <div class="calc__card"><span class="calc__card-label">Technique</span><span class="calc__card-value">{technique === 'box' ? '4-4-4-4' : '4-7-8'}</span></div>
          <div class="calc__card"><span class="calc__card-label">Cycles done</span><span class="calc__card-value">{t.cycles}</span></div>
          <div class="calc__card"><span class="calc__card-label">Phase</span><span class="calc__card-value" style="font-size:0.95rem">{label}</span></div>
        </div>
      </div>

      <div class="calc__result breathe" aria-live="polite">
        <div class="breathe__stage">
          <div class="breathe__circle" style={`transform:scale(${scale});transition-duration:${dur}s`} />
          <div class="breathe__text">
            <span class="breathe__label">{label}</span>
            {count !== '' && <span class="breathe__count">{count}</span>}
          </div>
        </div>
        <div class="breathe__controls">
          {!running
            ? <button type="button" class="btn btn-primary" onClick={start}>Start</button>
            : <button type="button" class="btn btn-outline" onClick={() => setRunning(false)}>Pause</button>}
          <button type="button" class="btn btn-outline" onClick={() => reset()}>Reset</button>
        </div>
        <p class="quiz__disclaimer" style="margin-top:1.25rem">
          A calming exercise, not a diagnostic tool. If you’re struggling, please talk to a qualified professional. Stop if you feel dizzy or unwell.
        </p>
      </div>
    </div>
  );
}
