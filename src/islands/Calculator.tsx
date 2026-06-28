/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  cmToFtIn,
  cmToIn,
  ftInToCm,
  inToCm,
  kgToLb,
  lbToKg,
  round,
  type Sex,
  type UnitSystem,
} from '../lib/units';
import { getDef, type CalcDef, type CalcField, type Segment, type Visual } from './calculators/defs';
import ShareResult from '../components/ShareResult';

type Disp = Record<string, string>;

const num = (s: string | undefined): number => {
  const n = parseFloat(s ?? '');
  return Number.isFinite(n) ? n : 0;
};

function initialDisplay(def: CalcDef, units: UnitSystem): Disp {
  const d: Disp = {};
  for (const f of def.fields) {
    if (f.type === 'height') {
      if (units === 'metric') d.height = String(round(f.metricDefault, 0));
      else {
        const { ft, inch } = cmToFtIn(f.metricDefault);
        d.height_ft = String(ft);
        d.height_in = String(inch);
      }
    } else if (f.type === 'mass') {
      d[f.key] = String(units === 'metric' ? round(f.metricDefault, 1) : round(kgToLb(f.metricDefault), 1));
    } else if (f.type === 'length') {
      d[f.key] = String(units === 'metric' ? round(f.metricDefault, 1) : round(cmToIn(f.metricDefault), 1));
    } else if (f.type === 'select') {
      // selects are tracked in their own state, not as display strings
    } else {
      d[f.key] = String(round(f.metricDefault, 0));
    }
  }
  return d;
}

function initialSelects(def: CalcDef): Record<string, string> {
  const s: Record<string, string> = {};
  for (const f of def.fields) {
    if (f.type === 'select') s[f.key] = f.selectDefault ?? f.options?.[0]?.value ?? '';
  }
  return s;
}

function toMetric(def: CalcDef, disp: Disp, units: UnitSystem): Record<string, number> {
  const v: Record<string, number> = {};
  for (const f of def.fields) {
    if (f.type === 'height') {
      v[f.key] = units === 'metric' ? num(disp.height) : ftInToCm(num(disp.height_ft), num(disp.height_in));
    } else if (f.type === 'mass') {
      v[f.key] = units === 'metric' ? num(disp[f.key]) : lbToKg(num(disp[f.key]));
    } else if (f.type === 'length') {
      v[f.key] = units === 'metric' ? num(disp[f.key]) : inToCm(num(disp[f.key]));
    } else if (f.type === 'select') {
      // tracked separately in `selects`
    } else {
      v[f.key] = num(disp[f.key]);
    }
  }
  return v;
}

function convertDisplay(def: CalcDef, disp: Disp, to: UnitSystem): Disp {
  const d: Disp = { ...disp };
  for (const f of def.fields) {
    if (f.type === 'height') {
      if (to === 'imperial') {
        const { ft, inch } = cmToFtIn(num(disp.height));
        d.height_ft = String(ft);
        d.height_in = String(inch);
        delete d.height;
      } else {
        d.height = String(round(ftInToCm(num(disp.height_ft), num(disp.height_in)), 0));
        delete d.height_ft;
        delete d.height_in;
      }
    } else if (f.type === 'mass') {
      d[f.key] = String(to === 'imperial' ? round(kgToLb(num(disp[f.key])), 1) : round(lbToKg(num(disp[f.key])), 1));
    } else if (f.type === 'length') {
      d[f.key] = String(to === 'imperial' ? round(cmToIn(num(disp[f.key])), 1) : round(inToCm(num(disp[f.key])), 1));
    }
  }
  return d;
}

// ---------- presentational ----------

function Gauge({ v }: { v: Extract<Visual, { kind: 'gauge' }> }) {
  const span = v.max - v.min;
  let prev = v.min;
  const segs = v.segments.map((s) => {
    const upper = Math.min(s.upTo, v.max);
    const w = Math.max(0, ((upper - prev) / span) * 100);
    prev = s.upTo;
    return { ...s, w };
  });
  const pos = Math.max(0, Math.min(1, (v.value - v.min) / span)) * 100;
  return (
    <div class="gauge">
      <div class="gauge__track" role="img" aria-label={`Scale from ${v.min} to ${v.max}, your value ${round(v.value, 2)}`}>
        {segs.map((s) => (
          <span class="gauge__seg" style={`width:${s.w}%;background:${s.color}`} />
        ))}
        <span class="gauge__marker" style={`left:${pos}%`}>
          <span class="gauge__bubble">{round(v.value, 2)}</span>
        </span>
      </div>
      <div class="gauge__scale">
        <span>{v.min}</span>
        <span>{v.max}</span>
      </div>
      <ul class="gauge__legend">
        {v.segments.map((s) => (
          <li>
            <span class="gauge__dot" style={`background:${s.color}`} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Range({ v }: { v: Extract<Visual, { kind: 'range' }> }) {
  const span = v.max - v.min;
  const left = ((v.low - v.min) / span) * 100;
  const width = ((v.high - v.low) / span) * 100;
  return (
    <div class="rangebar">
      <div class="rangebar__track">
        <span class="rangebar__band" style={`left:${left}%;width:${width}%`} />
      </div>
      <div class="rangebar__labels">
        <span>{v.min} {v.unit}</span>
        <span class="rangebar__healthy">Healthy: {v.low}–{v.high} {v.unit}</span>
        <span>{v.max} {v.unit}</span>
      </div>
    </div>
  );
}

function Split({ v }: { v: Extract<Visual, { kind: 'split' }> }) {
  const total = v.aValue + v.bValue || 1;
  const aPct = (v.aValue / total) * 100;
  return (
    <div class="split">
      <div class="split__bar">
        <span style={`width:${aPct}%;background:${v.aColor}`} />
        <span style={`width:${100 - aPct}%;background:${v.bColor}`} />
      </div>
      <div class="split__labels">
        <span><span class="gauge__dot" style={`background:${v.aColor}`} /> {v.aLabel}: {v.aValue} {v.unit}</span>
        <span><span class="gauge__dot" style={`background:${v.bColor}`} /> {v.bLabel}: {v.bValue} {v.unit}</span>
      </div>
    </div>
  );
}

function Donut({ v }: { v: Extract<Visual, { kind: 'donut' }> }) {
  const R = 15.915; // circumference = 100, so pct maps 1:1 to dash length
  let offset = 25; // start at 12 o'clock
  return (
    <div class="donut">
      <svg class="donut__svg" viewBox="0 0 42 42" role="img" aria-label="Macro split">
        <circle class="donut__hole" cx="21" cy="21" r={R} />
        {v.slices.map((s) => {
          const dasharray = `${s.pct} ${100 - s.pct}`;
          const dashoffset = offset;
          offset = (offset - s.pct + 100) % 100;
          return (
            <circle
              class="donut__seg"
              cx="21" cy="21" r={R}
              stroke={s.color}
              stroke-dasharray={dasharray}
              stroke-dashoffset={dashoffset}
            />
          );
        })}
        <text class="donut__total" x="21" y="20">{v.centerValue}</text>
        <text class="donut__total-label" x="21" y="25.5">{v.centerLabel}</text>
      </svg>
      <ul class="donut__legend">
        {v.slices.map((s) => (
          <li>
            <span class="gauge__dot" style={`background:${s.color}`} />
            <span class="donut__legend-label">{s.label}</span>
            <span class="donut__legend-val">{s.value} · {Math.round(s.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Zones({ v }: { v: Extract<Visual, { kind: 'zones' }> }) {
  return (
    <ul class="zones">
      {v.items.map((z) => (
        <li class={`zones__row${z.active ? ' is-active' : ''}`} style={`--zone:${z.color}`}>
          <span class="zones__bar" />
          <span class="zones__text">
            <span class="zones__label">{z.label}</span>
            <span class="zones__detail">{z.detail}</span>
          </span>
          {z.active && <span class="zones__tag">You</span>}
        </li>
      ))}
    </ul>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
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

// ---------- shareable result image (canvas) ----------

const CARD_FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

function roundRectPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function hexAlpha(hex: string, a: number): string {
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Brand mark: rounded green square + white heartbeat polyline (matches the logo).
function drawBrandMark(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const grad = c.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, '#22c55e');
  grad.addColorStop(1, '#16a34a');
  roundRectPath(c, x, y, size, size, size * 0.28);
  c.fillStyle = grad;
  c.fill();
  const s = size / 48;
  const pts: [number, number][] = [[9, 25], [15, 25], [18, 16], [23, 32], [27, 21], [29.5, 25], [39, 25]];
  c.strokeStyle = '#fff';
  c.lineWidth = size * 0.06;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  pts.forEach(([px, py], i) => {
    const X = x + px * s, Y = y + py * s;
    if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
  });
  c.stroke();
}

function drawCardGauge(
  c: CanvasRenderingContext2D,
  v: Extract<Visual, { kind: 'gauge' }>,
  x: number,
  y: number,
  w: number,
  wide: boolean,
) {
  const span = v.max - v.min || 1;
  const barH = wide ? 22 : 30;
  roundRectPath(c, x, y, w, barH, barH / 2);
  c.save();
  c.clip();
  let px = x, prev = v.min;
  for (const s of v.segments) {
    const upper = Math.min(s.upTo, v.max);
    const segW = Math.max(0, ((upper - prev) / span) * w);
    c.fillStyle = s.color;
    c.fillRect(px, y, segW, barH);
    px += segW;
    prev = s.upTo;
  }
  c.restore();
  // marker + value bubble
  const pos = Math.max(0, Math.min(1, (v.value - v.min) / span));
  const mx = x + pos * w;
  c.fillStyle = '#0f172a';
  c.fillRect(mx - 2, y - 8, 4, barH + 16);
  c.font = `800 ${wide ? 24 : 30}px ${CARD_FONT}`;
  const val = String(round(v.value, 1));
  const bw = c.measureText(val).width + 28, bh = wide ? 38 : 46;
  const bx = Math.max(x, Math.min(x + w - bw, mx - bw / 2));
  const by = y - bh - 14;
  roundRectPath(c, bx, by, bw, bh, 8);
  c.fillStyle = '#0f172a';
  c.fill();
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(val, bx + bw / 2, by + bh / 2);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  // min / max
  c.fillStyle = '#94a3b8';
  c.font = `600 ${wide ? 20 : 24}px ${CARD_FONT}`;
  c.fillText(String(v.min), x, y + barH + (wide ? 28 : 36));
  c.textAlign = 'right';
  c.fillText(String(v.max), x + w, y + barH + (wide ? 28 : 36));
  c.textAlign = 'left';
  // legend (wraps)
  let ly = y + barH + (wide ? 64 : 82);
  let lx = x;
  const dot = wide ? 12 : 16;
  c.font = `600 ${wide ? 20 : 26}px ${CARD_FONT}`;
  for (const s of v.segments) {
    const tw = c.measureText(s.label).width;
    if (lx + dot + 8 + tw > x + w) { lx = x; ly += wide ? 32 : 44; }
    c.fillStyle = s.color;
    c.beginPath();
    c.arc(lx + dot / 2, ly - (wide ? 6 : 8), dot / 2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#334155';
    c.fillText(s.label, lx + dot + 8, ly);
    lx += dot + 8 + tw + (wide ? 26 : 34);
  }
}

// ---------- signature: count-up on the headline value ----------
/**
 * Animates a numeric-leading result string (e.g. "22.9", "1,780 kcal") counting
 * up — but only the first time a result appears, so live input tweaks update
 * instantly (the gauge glides instead). Non-numeric values and reduced-motion
 * users get the final value immediately.
 */
function useCountUp(value: string, active: boolean): string {
  const [shown, setShown] = useState(value);
  const played = useRef(false);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!active) {
      played.current = false;
      setShown(value);
      return;
    }
    const m = value.match(/^(-?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
    const reduce =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!m || reduce || played.current) {
      played.current = true;
      setShown(value);
      return;
    }
    played.current = true;
    const sign = m[1];
    const target = parseFloat(m[2].replace(/,/g, ''));
    const decimals = m[2].includes('.') ? m[2].split('.')[1].length : 0;
    const suffix = m[3];
    const fmt = (n: number) =>
      sign + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    const dur = 550;
    let startT: number | undefined;
    const step = (t: number) => {
      if (startT === undefined) startT = t;
      const p = Math.min(1, (t - startT) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      if (p < 1) {
        setShown(fmt(target * eased));
        raf.current = requestAnimationFrame(step);
      } else {
        setShown(value);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, active]);

  return active ? shown : value;
}

// ---------- main island ----------

export default function Calculator({ slug, toolName }: { slug: string; toolName?: string }) {
  const def = getDef(slug);
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [sex, setSex] = useState<Sex>('male');
  const [disp, setDisp] = useState<Disp>(() => (def ? initialDisplay(def, 'metric') : {}));
  const [selects, setSelects] = useState<Record<string, string>>(() => (def ? initialSelects(def) : {}));

  if (!def) return null;

  const ctx = useMemo(
    () => ({ vals: toMetric(def, disp, units), selects, sex, units }),
    [def, disp, units, sex, selects]
  );
  const visible = def.fields.filter((f) => !f.showIf || f.showIf(ctx));
  // Only show the metric/imperial toggle if some field actually converts.
  const showUnits = def.fields.some((f) => f.type === 'mass' || f.type === 'length' || f.type === 'height');
  // Empty/zero (except where 0 is allowed) → neutral prompt; out-of-range → friendly error.
  const numeric = visible.filter((f) => f.type !== 'select');
  const invalid = numeric.some((f) => !f.allowZero && !(ctx.vals[f.key] > 0));
  const outOfRange = invalid
    ? undefined
    : numeric.find((f) => {
        const v = ctx.vals[f.key];
        return f.allowZero ? v < 0 || v > f.max : v < f.min || v > f.max;
      });
  const rangeMsg = outOfRange
    ? `Please double-check your ${outOfRange.label.toLowerCase()} — that value looks out of range.`
    : null;
  const result = invalid || rangeMsg ? null : def.compute(ctx);

  // Clean name for the result image filename/title (drops the tool-type suffix).
  const reportName = (toolName ?? def.heading).replace(
    /\s+(Calculator|Checker|Tracker|Quiz|Test|Builder|Generator|Timer|Planner)$/i,
    '',
  );

  // "Your inputs" summary (print + image context).
  const summaryRows: { label: string; value: string }[] = [];
  if (result && result.ok) {
    if (def.hasSex) summaryRows.push({ label: 'Sex', value: sex === 'male' ? 'Male' : 'Female' });
    for (const f of visible) {
      if (f.type === 'select') {
        const opt = f.options?.find((o) => o.value === selects[f.key]);
        summaryRows.push({ label: f.label, value: opt?.label ?? selects[f.key] ?? '' });
      } else if (f.type === 'height' && units === 'imperial') {
        summaryRows.push({ label: f.label, value: `${disp.height_ft || 0} ft ${disp.height_in || 0} in` });
      } else {
        const unit =
          f.type === 'mass' ? (units === 'metric' ? 'kg' : 'lb')
          : f.type === 'length' || f.type === 'height' ? (units === 'metric' ? 'cm' : 'in')
          : f.type === 'age' ? 'yrs'
          : f.suffix ?? '';
        summaryRows.push({ label: f.label, value: `${disp[f.key] ?? ''} ${unit}`.trim() });
      }
    }
  }

  const downloadImage = (format: 'square' | 'wide') => {
    const done = () => document.dispatchEvent(new CustomEvent('hls:result-image-done'));
    if (!result || !result.ok) {
      done();
      return;
    }
    const r = result;
    const wide = format === 'wide';
    const W = wide ? 1200 : 1080;
    const H = wide ? 630 : 1080;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d');
    if (!c) return;
    const PAD = wide ? 70 : 88;

    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';

    // Brand header
    const mark = wide ? 52 : 60;
    drawBrandMark(c, PAD, PAD, mark);
    c.fillStyle = '#0f172a';
    c.font = `800 ${mark * 0.6}px ${CARD_FONT}`;
    c.fillText('HealthyLifeStyles', PAD + mark + 18, PAD + mark * 0.5);
    c.fillStyle = '#16a34a';
    c.font = `700 ${mark * 0.26}px ${CARD_FONT}`;
    (c as unknown as { letterSpacing: string }).letterSpacing = '3px';
    c.fillText('TRUSTED WELLNESS', PAD + mark + 20, PAD + mark * 0.86);
    (c as unknown as { letterSpacing: string }).letterSpacing = '0px';

    const ruleY = PAD + mark + 22;
    c.fillStyle = '#16a34a';
    c.fillRect(PAD, ruleY, W - 2 * PAD, 4);

    // Tool name
    let y = ruleY + (wide ? 62 : 92);
    c.fillStyle = '#64748b';
    c.font = `700 ${wide ? 30 : 36}px ${CARD_FONT}`;
    c.fillText(reportName, PAD, y);

    // Big value + label
    y += wide ? 92 : 132;
    c.fillStyle = '#0f172a';
    c.font = `800 ${wide ? 116 : 168}px ${CARD_FONT}`;
    c.fillText(String(r.primaryValue), PAD, y);
    c.fillStyle = '#64748b';
    c.font = `600 ${wide ? 26 : 32}px ${CARD_FONT}`;
    c.fillText(r.primaryLabel, PAD, y + (wide ? 38 : 50));

    // Category badge
    if (r.category) {
      c.font = `800 ${wide ? 28 : 38}px ${CARD_FONT}`;
      const tw = c.measureText(r.category.label).width;
      const bh = wide ? 50 : 66;
      const bw = tw + (wide ? 44 : 56);
      const bx = PAD;
      const by = y + (wide ? 60 : 88);
      roundRectPath(c, bx, by, bw, bh, bh / 2);
      c.fillStyle = hexAlpha(r.category.color, 0.14);
      c.fill();
      c.fillStyle = r.category.color;
      c.textBaseline = 'middle';
      c.fillText(r.category.label, bx + (wide ? 22 : 28), by + bh / 2);
      c.textBaseline = 'alphabetic';
      y = by + bh;
    }

    // Gauge (matches the on-site visual language)
    if (r.visual.kind === 'gauge') {
      drawCardGauge(c, r.visual, PAD, y + (wide ? 44 : 80), W - 2 * PAD, wide);
    }

    // Footer
    c.fillStyle = '#94a3b8';
    c.font = `700 ${wide ? 24 : 30}px ${CARD_FONT}`;
    c.fillText('healthylifesstyles.com', PAD, H - PAD);

    cv.toBlob((blob) => {
      if (!blob) {
        done();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-Result-HealthyLifeStyles.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      done();
    }, 'image/png');
  };

  // Bridge: the page's "Download image" button (in ToolPageLayout) dispatches an
  // event; we render the card here, where the result data lives. A ref keeps the
  // listener pointed at the latest closure without rebinding each render.
  const downloadRef = useRef(downloadImage);
  downloadRef.current = downloadImage;
  useEffect(() => {
    const handler = (e: Event) => {
      const fmt = ((e as CustomEvent).detail?.format ?? 'square') as 'square' | 'wide';
      downloadRef.current(fmt);
    };
    document.addEventListener('hls:download-result-image', handler);
    return () => document.removeEventListener('hls:download-result-image', handler);
  }, []);

  const animatedValue = useCountUp(
    result && result.ok ? result.primaryValue : '',
    !!(result && result.ok),
  );

  const setField = (key: string, val: string) => setDisp((d) => ({ ...d, [key]: val }));
  const setSelect = (key: string, val: string) => setSelects((s) => ({ ...s, [key]: val }));
  const switchUnits = (to: UnitSystem) => {
    if (to === units) return;
    setDisp((d) => convertDisplay(def, d, to));
    setUnits(to);
  };

  const id = (k: string) => `calc-${slug}-${k}`;

  const renderField = (f: CalcField) => {
    if (f.type === 'select') {
      return (
        <div class="calc__field" key={f.key}>
          <label class="calc__label" for={id(f.key)}>{f.label}</label>
          <div class="calc__select">
            <select
              id={id(f.key)}
              value={selects[f.key]}
              onChange={(e) => setSelect(f.key, (e.target as HTMLSelectElement).value)}
            >
              {f.options?.map((o) => (
                <option value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {f.help && <p class="calc__help">{f.help}</p>}
        </div>
      );
    }
    if (f.type === 'number') {
      return (
        <div class="calc__field" key={f.key}>
          <label class="calc__label" for={id(f.key)}>{f.label}</label>
          <div class="calc__input">
            <input
              type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step ?? 1}
              id={id(f.key)}
              value={disp[f.key] ?? ''}
              onInput={(e) => setField(f.key, (e.target as HTMLInputElement).value)}
            />
            {f.suffix && <span class="calc__suffix">{f.suffix}</span>}
          </div>
          {f.help && <p class="calc__help">{f.help}</p>}
        </div>
      );
    }
    if (f.type === 'height' && units === 'imperial') {
      return (
        <div class="calc__field calc__field--height" key={f.key}>
          <span class="calc__label" id={id('height-grp')}>{f.label}</span>
          <div class="calc__height" role="group" aria-labelledby={id('height-grp')}>
            <div class="calc__input">
              <input
                type="number" inputMode="numeric" min="0" step="1"
                id={id('height_ft')} aria-label="Feet"
                value={disp.height_ft ?? ''} onInput={(e) => setField('height_ft', (e.target as HTMLInputElement).value)}
              />
              <span class="calc__suffix">ft</span>
            </div>
            <div class="calc__input">
              <input
                type="number" inputMode="decimal" min="0" max="11.5" step="0.5"
                id={id('height_in')} aria-label="Inches"
                value={disp.height_in ?? ''} onInput={(e) => setField('height_in', (e.target as HTMLInputElement).value)}
              />
              <span class="calc__suffix">in</span>
            </div>
          </div>
        </div>
      );
    }
    const suffix =
      f.type === 'mass' ? (units === 'metric' ? 'kg' : 'lb')
      : f.type === 'length' || f.type === 'height' ? (units === 'metric' ? 'cm' : 'in')
      : 'yrs';
    const step = f.type === 'age' || f.type === 'height' ? '1' : '0.1';
    return (
      <div class="calc__field" key={f.key}>
        <label class="calc__label" for={id(f.key)}>{f.label}</label>
        <div class="calc__input">
          <input
            type="number" inputMode="decimal" min="0" step={step}
            id={id(f.key)}
            value={disp[f.key] ?? ''}
            onInput={(e) => setField(f.key, (e.target as HTMLInputElement).value)}
          />
          <span class="calc__suffix">{suffix}</span>
        </div>
        {f.help && <p class="calc__help">{f.help}</p>}
      </div>
    );
  };

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar">
          <h2 class="calc__heading">{def.heading}</h2>
          {showUnits && (
            <Segmented
              label="Unit system"
              value={units}
              onChange={switchUnits}
              options={[{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }]}
            />
          )}
        </div>

        {def.hasSex && (
          <div class="calc__field">
            <span class="calc__label">Sex</span>
            <Segmented
              label="Sex"
              value={sex}
              onChange={setSex}
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
            />
            <p class="calc__help">Used because the formula differs for men and women.</p>
          </div>
        )}

        <div class="calc__fields">{visible.map(renderField)}</div>
      </div>

      <div class="calc__result" aria-live="polite">
        {invalid && (
          <p class="calc__placeholder">Enter your details above to see your result.</p>
        )}
        {rangeMsg && <p class="calc__error">{rangeMsg}</p>}
        {result && !result.ok && <p class="calc__error">{result.error}</p>}
        {result && result.ok && (
          <div class="calc__result-in">
            <div class="calc__print-summary" aria-hidden="true">
              <p class="calc__print-summary-title">Your inputs</p>
              <dl>
                {summaryRows.map((row) => (
                  <div>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div class="calc__headline">
              <span class="calc__result-label">{result.primaryLabel}</span>
              <span class="calc__value">{animatedValue}</span>
              {result.category && (
                <span class="calc__badge" style={`--badge:${result.category.color}`}>
                  {result.category.label}
                </span>
              )}
            </div>

            {result.visual.kind === 'gauge' && <Gauge v={result.visual} />}
            {result.visual.kind === 'range' && <Range v={result.visual} />}
            {result.visual.kind === 'split' && <Split v={result.visual} />}
            {result.visual.kind === 'donut' && <Donut v={result.visual} />}
            {result.visual.kind === 'zones' && <Zones v={result.visual} />}

            {result.cards && result.cards.length > 0 && (
              <div class="calc__cards">
                {result.cards.map((c) => (
                  <div class={`calc__card calc__card--${c.tone ?? 'neutral'}`}>
                    <span class="calc__card-label">{c.label}</span>
                    <span class="calc__card-value">{c.value}</span>
                    {c.sub && <span class="calc__card-sub">{c.sub}</span>}
                  </div>
                ))}
              </div>
            )}

            {result.callout && (
              <p class={`calc__callout calc__callout--${result.callout.tone}`}>
                {result.callout.text}
              </p>
            )}

            {result.rows && result.rows.length > 0 && (
              <dl class="calc__rows">
                {result.rows.map((r) => (
                  <div class={`calc__row${r.strong ? ' is-strong' : ''}`}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {result.note && <p class="calc__note">{result.note}</p>}

            {result.cta && (
              <a class="calc__cta btn btn-primary" href={result.cta.href}>
                {result.cta.label}
              </a>
            )}

            <ShareResult
              tool={toolName ?? def.heading}
              value={result.primaryValue}
              label={result.primaryLabel}
              category={result.category?.label}
              categoryColor={result.category?.color}
              toolSlug={slug}
            />
          </div>
        )}
      </div>
    </div>
  );
}
