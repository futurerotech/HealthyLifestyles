// Master Roadmap Phase 4 §8.3: real-browser responsive and accessibility QA across
// every supported tool page and the main page templates, at 390x844 and 1440x900.
// The 28 calculators covered by calculator-browser-qa.test.mjs keep their deeper
// interaction and keyboard checks there; this suite is the site-wide floor.
//
// For every page and viewport:
//   - no horizontal page overflow (offending elements are reported);
//   - every visible form control and button in <main> has an accessible name;
//   - pointer targets meet WCAG 2.2 SC 2.5.8 (24x24 CSS px, with the inline-link and
//     spacing exceptions);
//   - every image in <main> has an alt attribute;
//   - exactly one <h1>, and no heading level is skipped after it;
//   - the tool calculator, when present, hydrates;
//   - no uncaught JavaScript exceptions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startBrowserSession, until, delay } from './browser-harness.mjs';

const contract = JSON.parse(readFileSync(new URL('../../../src/lib/site-contract.json', import.meta.url), 'utf8'));
const TOOLS = contract.tools.map((t) => (typeof t === 'string' ? t : t.slug));
const TEMPLATES = ['/', '/tools', '/wellness-hub', '/nutrition', '/sleep', '/about', '/methodology', '/contact', '/health-score', '/sitemap',
  '/wellness-hub/how-many-calories-to-lose-weight', '/wellness-hub/healthy-bmi-by-age', '/wellness-hub/due-date-by-conception-date'];

export const PAGE_AUDIT = `(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const name = (e) => {
    const al = e.getAttribute('aria-label'); if (al && al.trim()) return al.trim();
    const lb = e.getAttribute('aria-labelledby');
    if (lb) { const t = lb.split(/\\s+/).map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim(); if (t) return t; }
    if (e.id) { const l = document.querySelector('label[for="' + CSS.escape(e.id) + '"]'); if (l && l.textContent.trim()) return l.textContent.trim(); }
    const wrap = e.closest('label'); if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    if ((e.tagName === 'BUTTON' || e.tagName === 'A') && (e.textContent.trim() || e.querySelector('img[alt]:not([alt=""])'))) return e.textContent.trim() || 'img';
    const t = e.getAttribute('title'); if (t && t.trim()) return t.trim();
    if (e.type === 'submit' || e.type === 'button') return e.value || '';
    return '';
  };
  const desc = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30) + '"');
  const main = document.querySelector('main') || document.body;
  const controls = [...main.querySelectorAll('input:not([type=hidden]), select, textarea, button')].filter((e) => !e.disabled && vis(e));
  const unnamed = controls.filter((e) => !name(e)).map(desc);

  // WCAG 2.5.8 Target Size (Minimum). Inline links inside text are exempt; an undersized
  // target passes when a 24px circle on its center clears every other target.
  const targets = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=checkbox], [role=radio], [role=switch]')]
    .filter((e) => vis(e) && !e.disabled && !e.closest('[aria-hidden=true]'));
  const inlineText = (e) => {
    if (e.tagName !== 'A') return false;
    const p = e.parentElement; if (!p) return false;
    if (e.closest('p, li p, td, dd, figcaption, blockquote, .prose p, .article-body p')) return true;
    return [...p.childNodes].some((n) => n !== e && n.nodeType === 3 && n.textContent.trim().length > 2);
  };
  const boxOf = (e) => {
    // A checkbox or radio is measured with its label, which is part of the hit area.
    if ((e.type === 'checkbox' || e.type === 'radio')) { const l = e.closest('label') || (e.id && document.querySelector('label[for="' + CSS.escape(e.id) + '"]')); if (l) return l.getBoundingClientRect(); }
    return e.getBoundingClientRect();
  };
  const rects = targets.map((e) => ({ e, r: boxOf(e) }));
  const small = rects.filter(({ e, r }) => (r.width < 24 || r.height < 24) && !inlineText(e));
  const dist = (cx, cy, r) => Math.hypot(Math.max(r.left - cx, 0, cx - r.right), Math.max(r.top - cy, 0, cy - r.bottom));
  const tooSmall = small.filter(({ e, r }) => {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return rects.some((o) => o.e !== e && !o.e.contains(e) && !e.contains(o.e) && dist(cx, cy, o.r) < 12) ||
      small.some((o) => o.e !== e && Math.hypot(cx - (o.r.left + o.r.width / 2), cy - (o.r.top + o.r.height / 2)) < 24);
  }).map(({ e, r }) => desc(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));

  const imgs = [...main.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).map((i) => (i.getAttribute('src') || '').slice(0, 80));
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map((h) => Number(h.tagName[1]));
  const h1 = hs.filter((n) => n === 1).length;
  const skips = []; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skips.push('h' + hs[i - 1] + '→h' + hs[i]);
  const w = document.documentElement.clientWidth;
  // Report the outermost unclipped elements that extend past the viewport: those are what widen the page.
  const clipped = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).overflowX !== 'visible') return true; return false; };
  const past = document.documentElement.scrollWidth > w + 1 ? [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > w + 1 && !clipped(e); }) : [];
  const offenders = past.filter((e) => !past.includes(e.parentElement)).slice(0, 4).map((e) => { const r = e.getBoundingClientRect(); return desc(e) + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width); });
  return { overflow: document.documentElement.scrollWidth - w, offenders, unnamed, tooSmall: [...new Set(tooSmall)].slice(0, 12), imgs, h1, skips: [...new Set(skips)], calc: !!document.querySelector('.tool__calc') };
})()`;

test('site-wide 390px and desktop QA: overflow, names, target size, images, headings', { timeout: 1500000 }, async () => {
  const s = await startBrowserSession({ probePath: '/tools/bmi-calculator', tag: 'SITE_QA' });
  const failures = [];
  let pages = 0;
  try {
    const paths = [...TEMPLATES, ...TOOLS.map((t) => '/tools/' + t)];
    for (const path of paths) {
      for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
        const fail = (m) => failures.push(`${path} @${w}: ${m}`);
        s.exceptions.length = 0; s.consoleErrors.length = 0;
        await s.viewport(w, h, mobile);
        await s.js('window.__qaPrev = true').catch(() => {});
        const nav = await s.send('Page.navigate', { url: s.origin + path });
        if (nav.errorText) { fail('navigation ' + nav.errorText); continue; }
        try {
          await until(() => s.js("!window.__qaPrev && document.readyState==='complete'"), 'load', 45000);
          const hasCalc = await s.js("!!document.querySelector('.tool__calc astro-island')");
          // Islands are client:visible: bring each into view, as a reader scrolling the page would.
          // Only islands a reader can see must hydrate; a client:visible island that is hidden at this
          // viewport legitimately never loads. On timeout, name the pending component.
          const PENDING = "[...document.querySelectorAll('.tool__calc astro-island[ssr]')].filter((i)=>[...i.children].some((c)=>c.getClientRects().length))";
          const hydrate = () => until(() => s.js(`(()=>{const p=${PENDING}[0];if(p)p.scrollIntoView({block:'center'});return !p;})()`), 'hydration', 30000);
          if (hasCalc) {
            try { await hydrate(); } catch (first) {
              // The dev server compiles islands on first request and may reload the page while doing
              // so. Retry once after a reload; only a second failure counts, with console evidence.
              const pending = await s.js(`${PENDING}.map((i)=>(i.getAttribute('component-url')||'').split('/').pop()+' '+(i.getAttribute('client')||''))`).catch(() => []);
              await s.send('Page.reload', { ignoreCache: false });
              await until(() => s.js("document.readyState==='complete'"), 'reload', 45000);
              try { await hydrate(); console.log(`[SITE_QA] ${path} @${w}: hydrated after one reload (first wait pending ${JSON.stringify(pending)})`); }
              catch (e) { throw Error(String(e) + ' pending=' + JSON.stringify(pending) + ' console=' + JSON.stringify([...new Set(s.consoleErrors)].slice(-4)) + ' exceptions=' + JSON.stringify([...new Set(s.exceptions)].slice(-3))); }
            }
          }
          await s.js('scrollTo(0,0)');
        } catch (e) { fail(String(e)); continue; }
        await delay(250);
        const a = await s.js(PAGE_AUDIT);
        pages++;
        if (a.overflow > 1) fail(`horizontal overflow ${a.overflow}px ${JSON.stringify(a.offenders)}`);
        if (a.unnamed.length) fail('controls without accessible name ' + JSON.stringify(a.unnamed));
        if (a.tooSmall.length) fail('targets under 24x24 without spacing (WCAG 2.5.8) ' + JSON.stringify(a.tooSmall));
        if (a.imgs.length) fail('images without alt ' + JSON.stringify(a.imgs));
        if (a.h1 !== 1) fail(`expected one h1, found ${a.h1}`);
        if (a.skips.length) fail('heading levels skipped ' + JSON.stringify(a.skips));
        if (s.exceptions.length) fail('uncaught exceptions ' + JSON.stringify([...new Set(s.exceptions)]));
      }
    }
  } finally { await s.stop(); }
  console.log(`[SITE_QA] audited ${pages} page views; ${failures.length} failures`);
  for (const f of failures) console.log('[SITE_QA_FAIL] ' + f);
  assert.deepEqual(failures, []);
});
