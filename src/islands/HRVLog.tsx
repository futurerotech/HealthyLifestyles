/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

/* ── Types ─────────────────────────────────────────────────────────── */
interface Reading {
  id: string;
  date: string;              // YYYY-MM-DD
  hrv: number;                // RMSSD in ms (from user's device)
  rhr?: number;               // resting heart rate, optional
  sleep?: number;             // hours slept, optional
  stress?: 'low' | 'moderate' | 'high'; // optional
  alcohol?: boolean;          // drank alcohol previous evening, optional
  notes?: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */
const STORE = 'hls-hrv-log';

const FACTORS = [
  { factor: 'Sleep', effect: 'Poor sleep or short sleep lowers HRV the next morning. Consistent 7-9h tends to raise it.', icon: 'moon' },
  { factor: 'Stress', effect: 'Acute and chronic stress (work, life, anxiety) reduce HRV. Recovery periods raise it.', icon: 'zap' },
  { factor: 'Alcohol', effect: 'Even one alcoholic drink the evening before can noticeably reduce next-morning HRV.', icon: 'wine' },
  { factor: 'Exercise', effect: 'Hard training lowers HRV acutely (recovery cost). Fitness over time tends to raise baseline HRV.', icon: 'activity' },
  { factor: 'Illness', effect: 'Oncoming or active illness (cold, flu, fever) often drops HRV sharply before other symptoms appear.', icon: 'thermometer' },
  { factor: 'Hydration', effect: 'Dehydration can lower HRV. Consistent hydration supports higher readings.', icon: 'droplet' },
] as const;

/* ── Utility ───────────────────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10);

const fmtDate = (iso: string) => {
  const d = new Date(iso + 'T00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ── Stats ─────────────────────────────────────────────────────────── */
function stats(readings: Reading[]) {
  if (readings.length === 0) return null;
  const vals = readings.map((r) => r.hrv);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sorted = [...vals].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const recent = readings.slice(-7);
  const recentAvg = recent.reduce((a, b) => a + b.hrv, 0) / recent.length;
  const first = readings[0]?.hrv ?? 0;
  const last = readings[readings.length - 1]?.hrv ?? 0;
  const trend = last - first;
  return { mean, median, min, max, recentAvg, trend, count: readings.length };
}

/* ── Component ─────────────────────────────────────────────────────── */
export default function HRVLog() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [date, setDate] = useState(today());
  const [hrv, setHrv] = useState('');
  const [rhr, setRhr] = useState('');
  const [sleep, setSleep] = useState('');
  const [stress, setStress] = useState<'low' | 'moderate' | 'high' | ''>('');
  const [alcohol, setAlcohol] = useState(false);
  const [notes, setNotes] = useState('');

  /* Load from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setReadings(parsed);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  /* Persist */
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORE, JSON.stringify(readings)); } catch { /* ignore */ }
  }, [readings, loaded]);

  const resetForm = () => {
    setDate(today());
    setHrv('');
    setRhr('');
    setSleep('');
    setStress('');
    setAlcohol(false);
    setNotes('');
  };

  const addReading = (e: Event) => {
    e.preventDefault();
    const hrvNum = parseFloat(hrv);
    if (isNaN(hrvNum) || hrvNum <= 0) return;

    const reading: Reading = {
      id: uid(),
      date,
      hrv: hrvNum,
      rhr: rhr ? parseFloat(rhr) : undefined,
      sleep: sleep ? parseFloat(sleep) : undefined,
      stress: stress || undefined,
      alcohol: alcohol || undefined,
      notes: notes.trim() || undefined,
    };
    setReadings((prev) => [...prev, reading].sort((a, b) => a.date.localeCompare(b.date)));
    resetForm();
    setShowForm(false);
  };

  const deleteReading = (id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = () => {
    if (confirm('Delete ALL HRV readings? This cannot be undone.')) setReadings([]);
  };

  const s = useMemo(() => stats(readings), [readings]);

  /* Chart dimensions */
  const W = 520, H = 200, pad = { l: 44, r: 16, t: 16, b: 28 };

  const chartData = useMemo(() => {
    if (readings.length < 2) return null;
    const vals = readings.map((r) => r.hrv);
    const min = Math.min(...vals) * 0.9;
    const max = Math.max(...vals) * 1.1;
    const span = Math.max(1, max - min);
    const lo = min, hi = max;
    const ySpan = hi - lo;

    const x = (i: number) => pad.l + (i / (readings.length - 1)) * (W - pad.l - pad.r);
    const y = (v: number) => pad.t + (1 - (v - lo) / ySpan) * (H - pad.t - pad.b);

    const line = readings.map((r, i) => `${x(i)},${y(r.hrv)}`).join(' ');
    const area = `${x(0)},${y(lo)} ${line} ${x(readings.length - 1)},${y(lo)}`;

    const meanY = y(s?.mean ?? 0);

    return { lo, hi, ySpan, x, y, line, area, meanY };
  }, [readings, s]);

  /* Trend interpretation */
  const interpretation = useMemo(() => {
    if (!s || s.count < 2) return null;
    const pct = ((s.trend / (s.mean || 1)) * 100);
    const abs = Math.abs(pct);
    if (abs < 5) {
      return {
        text: `Your HRV trend is relatively stable (change of ${s.trend > 0 ? '+' : ''}${s.trend.toFixed(0)} ms over ${s.count} readings). Stability is a good sign — it suggests your recovery is consistent.`,
        tone: 'neutral' as const,
      };
    }
    if (s.trend > 0) {
      return {
        text: `Your HRV is trending upward (+${s.trend.toFixed(0)} ms, ~${pct.toFixed(0)}% over ${s.count} readings). This often correlates with improving fitness, better sleep, or reduced stress. Keep doing what you are doing.`,
        tone: 'good' as const,
      };
    }
    return {
      text: `Your HRV is trending downward (${s.trend.toFixed(0)} ms, ~${pct.toFixed(0)}% over ${s.count} readings). This can reflect accumulated stress, poor sleep, illness, or hard training. Check the lifestyle factors below and consider a recovery focus.`,
      tone: 'warn' as const,
    };
  }, [s]);

  if (!loaded) return <div class="calc" />;

  return (
    <div class="calc hrv">
      {/* ── Honest disclaimer ──────────────────────────────────────── */}
      <div class="hrv__disclaimer">
        <strong>HRV cannot be calculated from your age or pulse alone.</strong> You need a
        device (chest strap, smartwatch, or ring) that measures beat-to-beat intervals. This
        tool does not estimate or invent an HRV number — it helps you <em>log and understand</em>
        readings from your own device.
      </div>

      {/* ── Educational explainer ──────────────────────────────────── */}
      <div class="hrv__explainer">
        <h3 class="hrv__section-title">What is HRV?</h3>
        <p class="hrv__text">
          Heart Rate Variability (HRV) is the natural variation in time between each heartbeat.
          A higher HRV generally means your autonomic nervous system is flexible and recovering
          well. A lower HRV can signal stress, fatigue, or insufficient recovery.
        </p>
        <p class="hrv__text">
          <strong>Your baseline matters more than any single number.</strong> HRV is highly
          individual — what is "low" for one person may be "high" for another. Track your own
          trend over time rather than comparing to others. Absolute values also vary by device
          and measurement method (RMSSD, SDNN, LnRMSSD), so compare readings from the same
          device taken at the same time of day (typically morning).
        </p>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div class="hrv__toolbar">
        <div class="hrv__stats">
          {s && (
            <>
              <span class="hrv__stat"><strong>{s.count}</strong> readings</span>
              <span class="hrv__stat">Avg <strong>{s.mean.toFixed(0)}</strong> ms</span>
              <span class="hrv__stat">7-day avg <strong>{s.recentAvg.toFixed(0)}</strong> ms</span>
            </>
          )}
          {s === null && <span class="hrv__stat-muted">No readings yet</span>}
        </div>
        <div class="hrv__actions">
          {readings.length > 0 && (
            <>
              <button type="button" class="hrv__btn hrv__btn--print" onClick={() => window.print()}>Print log</button>
              <button type="button" class="hrv__btn hrv__btn--danger" onClick={clearAll}>Clear all</button>
            </>
          )}
          <button type="button" class="hrv__btn hrv__btn--primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? 'Cancel' : '+ Add reading'}
          </button>
        </div>
      </div>

      {/* ── Add-reading form ───────────────────────────────────────── */}
      {showForm && (
        <form class="hrv__form" onSubmit={addReading}>
          <div class="hrv__field">
            <label class="hrv__label" for="hrv-date">Date</label>
            <input id="hrv-date" type="date" class="hrv__input" value={date}
              onInput={(e) => setDate((e.target as HTMLInputElement).value)} required />
          </div>
          <div class="hrv__field">
            <label class="hrv__label" for="hrv-val">HRV reading (ms, RMSSD)</label>
            <input id="hrv-val" type="number" class="hrv__input" placeholder="e.g. 45" min="1" max="200" step="0.1"
              value={hrv} onInput={(e) => setHrv((e.target as HTMLInputElement).value)} required />
            <p class="hrv__hint">Enter the RMSSD value from your device (chest strap, watch, or ring). Use the same device and time of day for consistency.</p>
          </div>
          <div class="hrv__field-row">
            <div class="hrv__field">
              <label class="hrv__label" for="hrv-rhr">Resting HR (optional)</label>
              <input id="hrv-rhr" type="number" class="hrv__input" placeholder="e.g. 58" min="30" max="120"
                value={rhr} onInput={(e) => setRhr((e.target as HTMLInputElement).value)} />
            </div>
            <div class="hrv__field">
              <label class="hrv__label" for="hrv-sleep">Sleep hours (optional)</label>
              <input id="hrv-sleep" type="number" class="hrv__input" placeholder="e.g. 7.5" min="0" max="14" step="0.5"
                value={sleep} onInput={(e) => setSleep((e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div class="hrv__field-row">
            <div class="hrv__field">
              <label class="hrv__label" for="hrv-stress">Stress yesterday</label>
              <select id="hrv-stress" class="hrv__select" value={stress}
                onChange={(e) => setStress((e.target as HTMLSelectElement).value as any)}>
                <option value="">-- none --</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="hrv__field">
              <label class="hrv__label">Alcohol last evening?</label>
              <label class="hrv__check">
                <input type="checkbox" checked={alcohol} onChange={(e) => setAlcohol((e.target as HTMLInputElement).checked)} />
                <span>Yes</span>
              </label>
            </div>
          </div>
          <div class="hrv__field">
            <label class="hrv__label" for="hrv-notes">Notes (optional)</label>
            <textarea id="hrv-notes" class="hrv__textarea" rows={2}
              placeholder="Training, illness, travel, anything unusual..."
              value={notes} onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)} />
          </div>
          <button type="submit" class="hrv__btn hrv__btn--primary hrv__btn--lg">Save reading</button>
        </form>
      )}

      {/* ── Trend chart ────────────────────────────────────────────── */}
      {chartData && (
        <div class="hrv__chart-block">
          <h3 class="hrv__section-title">Your HRV trend</h3>
          <svg viewBox={`0 0 ${W} ${H}`} class="hrv__chart" role="img" aria-label="HRV readings over time">
            {/* Y-axis labels */}
            {[0, 0.5, 1].map((f) => {
              const val = chartData.lo + f * chartData.ySpan;
              const yy = chartData.y(val);
              return (
                <g>
                  <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#e2e8f0" />
                  <text x={pad.l - 8} y={yy + 4} text-anchor="end" font-size="11" fill="#64748b">{val.toFixed(0)}</text>
                </g>
              );
            })}
            {/* Mean line */}
            <line x1={pad.l} y1={chartData.meanY} x2={W - pad.r} y2={chartData.meanY}
              stroke="#94a3b8" stroke-dasharray="4 3" stroke-width="1" />
            <text x={W - pad.r} y={chartData.meanY - 5} text-anchor="end" font-size="10" fill="#94a3b8">
              avg {s?.mean.toFixed(0)}
            </text>
            {/* Area + line */}
            <polygon points={chartData.area} fill="rgba(22,163,74,0.10)" />
            <polyline points={chartData.line} fill="none" stroke="#16a34a" stroke-width="2.5"
              stroke-linejoin="round" stroke-linecap="round" />
            {/* Dots */}
            {readings.map((r, i) => (
              <circle cx={chartData.x(i)} cy={chartData.y(r.hrv)} r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5" />
            ))}
            {/* X-axis labels */}
            <text x={pad.l} y={H - 6} text-anchor="start" font-size="11" fill="#64748b">{fmtDate(readings[0].date)}</text>
            {readings.length > 1 && (
              <text x={W - pad.r} y={H - 6} text-anchor="end" font-size="11" fill="#64748b">{fmtDate(readings[readings.length - 1].date)}</text>
            )}
          </svg>
        </div>
      )}

      {/* ── Interpretation ─────────────────────────────────────────── */}
      {interpretation && (
        <div class={`hrv__interp hrv__interp--${interpretation.tone}`}>
          <p>{interpretation.text}</p>
        </div>
      )}

      {/* ── Lifestyle factors ──────────────────────────────────────── */}
      <div class="hrv__factors">
        <h3 class="hrv__section-title">What affects HRV?</h3>
        <div class="hrv__factors-grid">
          {FACTORS.map((f) => (
            <div class="hrv__factor">
              <div class="hrv__factor-head">
                <strong>{f.factor}</strong>
              </div>
              <p class="hrv__factor-text">{f.effect}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Readings table ─────────────────────────────────────────── */}
      {readings.length > 0 && (
        <div class="hrv__log">
          <h3 class="hrv__section-title">Readings log</h3>
          <div class="hrv__table-wrap">
            <table class="hrv__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>HRV (ms)</th>
                  <th>Resting HR</th>
                  <th>Sleep</th>
                  <th>Stress</th>
                  <th>Alcohol</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...readings].reverse().map((r) => (
                  <tr key={r.id}>
                    <td class="hrv__cell-date">{fmtDate(r.date)}</td>
                    <td class="hrv__cell-hrv"><strong>{r.hrv.toFixed(0)}</strong></td>
                    <td>{r.rhr ? `${r.rhr}` : '--'}</td>
                    <td>{r.sleep ? `${r.sleep}h` : '--'}</td>
                    <td>{r.stress ? r.stress : '--'}</td>
                    <td>{r.alcohol ? 'Yes' : '--'}</td>
                    <td class="hrv__cell-notes">{r.notes || '--'}</td>
                    <td>
                      <button type="button" class="hrv__del" onClick={() => deleteReading(r.id)} aria-label="Delete">x</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {readings.length === 0 && (
        <div class="hrv__empty">
          <p>No readings yet. Add your first HRV reading from your device to start tracking your trend.</p>
          <button type="button" class="hrv__btn hrv__btn--primary" onClick={() => setShowForm(true)}>+ Add first reading</button>
        </div>
      )}
    </div>
  );
}
