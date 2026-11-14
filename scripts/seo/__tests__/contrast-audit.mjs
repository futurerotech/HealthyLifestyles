// In-page WCAG 2.2 contrast audit (SC 1.4.3 text, SC 1.4.11 non-text), as a string
// evaluated in the browser. Colors are resolved through a 1x1 canvas so every CSS color
// syntax (rgb, hex, color-mix, oklch) is measured as rendered.
//
// Rules:
//   - Text: 4.5:1, or 3:1 for large text (>= 24px, or >= 18.66px at weight >= 700).
//     Placeholder text is measured too.
//   - Exempt: disabled controls, aria-hidden or invisible text, visually hidden
//     (sr-only) text, and logotypes.
//   - Backgrounds are composited up the ancestor chain, including translucent layers
//     and element opacity. When a background image or gradient sits under the text
//     before an opaque color, the pair is "indeterminate" and is reported but not
//     failed: such text needs a manual check, not a false positive.
//   - Form field boundaries (SC 1.4.11): the border, or the field fill, must reach 3:1
//     against the surface the field sits on. Native checkboxes and radios with
//     default appearance are exempt (user-agent rendered).
export const CONTRAST_FNS = `
const __cv = document.createElement('canvas'); __cv.width = __cv.height = 1;
const __cx = __cv.getContext('2d', { willReadFrequently: true });
const rgba = (c) => {
  const m = /^rgba?\\(([^)]+)\\)$/.exec(c);
  if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  __cx.clearRect(0, 0, 1, 1); __cx.fillStyle = '#000'; __cx.fillStyle = c; __cx.fillRect(0, 0, 1, 1);
  const d = __cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
};
const over = (top, under) => { const a = top[3]; return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1]; };
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
// Effective background under an element: composite translucent layers up to the first opaque one.
const bgOf = (el) => {
  const layers = []; let opacity = 1;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const cs = getComputedStyle(n);
    opacity *= Number(cs.opacity);
    if (cs.backgroundImage !== 'none') return { indeterminate: n.tagName.toLowerCase() + '.' + String(n.className).slice(0, 30) };
    const c = rgba(cs.backgroundColor);
    if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
  }
  let bg = [255, 255, 255, 1];
  for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
  return { bg, opacity };
};
const hiddenText = (el) => {
  if (el.closest('[aria-hidden=true], svg, [hidden], .sr-only, .visually-hidden, noscript, template')) return true;
  const r = el.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) return true;
  const cs = getComputedStyle(el); return cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0;
};
const label = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : ''));
`;

export const contrastAudit = (rootExpr = 'document.body') => `(() => { ${CONTRAST_FNS}
  const __root = ${rootExpr}; if (!__root) return { checked: 0, fails: [], indeterminate: [] };
  const fails = [], indeterminate = new Set(); let checked = 0;
  const seen = new Set();
  const walker = document.createTreeWalker(__root, NodeFilter.SHOW_TEXT, { acceptNode: (t) => t.textContent.trim().length > 0 ? 1 : 2 });
  for (let t; (t = walker.nextNode());) {
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (hiddenText(el) || el.closest(':disabled, [aria-disabled=true], .logo, [class*=logo]')) continue;
    const cs = getComputedStyle(el);
    const b = bgOf(el); if (b.indeterminate) { indeterminate.add(b.indeterminate); continue; }
    const fg = rgba(cs.color); fg[3] *= b.opacity;
    const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5, r = ratio(over(fg, b.bg), b.bg);
    checked++;
    if (r + 0.005 < need) fails.push(label(el) + ' "' + t.textContent.trim().slice(0, 28) + '" ' + hex(over(fg, b.bg)) + ' on ' + hex(b.bg) + ' ' + r.toFixed(2) + ':1 (needs ' + need + ', ' + Math.round(size) + 'px/' + weight + ')');
  }
  // Placeholder text and form-field boundaries.
  for (const f of (__root.querySelectorAll ? __root : document).querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=submit]):not([type=button]), select, textarea')) {
    if (hiddenText(f) || f.disabled) continue;
    const parentBg = bgOf(f.parentElement); if (parentBg.indeterminate) { indeterminate.add(parentBg.indeterminate); continue; }
    const cs = getComputedStyle(f);
    const fill = over(rgba(cs.backgroundColor), parentBg.bg);
    const widths = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat);
    const borders = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor].map((c, i) => widths[i] > 0 ? ratio(over(rgba(c), parentBg.bg), parentBg.bg) : 0);
    const boundary = Math.max(...borders, ratio(fill, parentBg.bg));
    checked++;
    if (boundary + 0.005 < 3) fails.push(label(f) + ' field boundary ' + boundary.toFixed(2) + ':1 (border ' + cs.borderBottomColor + ' on ' + hex(parentBg.bg) + ', needs 3 — SC 1.4.11)');
    if (f.placeholder && !f.value) {
      const ph = rgba(getComputedStyle(f, '::placeholder').color);
      const r = ratio(over(ph, fill), fill);
      if (r + 0.005 < 4.5) fails.push(label(f) + ' placeholder "' + f.placeholder.slice(0, 24) + '" ' + hex(over(ph, fill)) + ' on ' + hex(fill) + ' ' + r.toFixed(2) + ':1 (needs 4.5)');
    }
  }
  return { checked, fails: [...new Set(fails)], indeterminate: [...indeterminate].slice(0, 8) };
})()`;
export const CONTRAST_AUDIT = contrastAudit();

// Focus-indicator contrast (SC 1.4.11 / 2.4.7). FOCUS_BASELINE snapshots every focusable
// control unfocused; FOCUS_CONTRAST then rates only what focus changed (outline, box-shadow
// ring or border) against the surface around the control. 3:1 is required.
const LOOK = `const __look = (e) => { const cs = getComputedStyle(e); return { outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? cs.outlineColor : '', shadow: cs.boxShadow, border: cs.borderBottomColor + ' ' + cs.borderBottomWidth, other: cs.backgroundColor + '|' + cs.color + '|' + cs.textDecorationLine }; };`;
export const FOCUS_BASELINE = `(() => { ${LOOK}
  window.__fbase = new Map();
  for (const e of document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')) window.__fbase.set(e, __look(e));
  return window.__fbase.size; })()`;
export const FOCUS_CONTRAST = `(() => { ${CONTRAST_FNS} ${LOOK}
  const e = document.activeElement; if (!e || e === document.body) return null;
  const base = window.__fbase?.get(e); if (!base) return { el: label(e), unknown: true };
  const now = __look(e);
  const around = bgOf(e.parentElement || e); if (around.indeterminate) return { el: label(e), indeterminate: around.indeterminate };
  const cands = [];
  if (now.outline && now.outline !== base.outline) cands.push(['outline', now.outline]);
  if (now.shadow !== base.shadow && now.shadow !== 'none') for (const m of now.shadow.matchAll(/(rgba?\\([^)]+\\)|#[0-9a-f]{3,8})/gi)) cands.push(['ring', m[1]]);
  if (now.border !== base.border) cands.push(['border', now.border.split(' ').slice(0, -1).join(' ')]);
  const best = cands.map(([k, c]) => [k, ratio(over(rgba(c), around.bg), around.bg), c]).sort((a, b) => b[1] - a[1])[0];
  // Focus shown only through a fill, text color or underline change is a visible indicator whose
  // geometry this check cannot rate; it passes here and is listed for manual review.
  const otherOnly = !best && now.other !== base.other;
  return { el: label(e) + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24) + '"', best: best ? best[0] + ' ' + best[2] + ' ' + best[1].toFixed(2) + ':1' : otherOnly ? 'fill/color/underline change' : 'no visible change', ok: otherOnly || (!!best && best[1] + 0.005 >= 3), changed: !!best || otherOnly, otherOnly, on: hex(around.bg) };
})()`;
