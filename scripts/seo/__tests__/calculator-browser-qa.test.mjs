import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

// Real-browser QA for every calculator changed by the calculator-safety
// integration. Local only: Astro dev server with the CMS disabled and the
// system Chrome over the DevTools protocol. No deployed preview, CMS writes,
// external browser service or new dependency.
//
// For each page, at 390x844 (mobile) and 1440x900 (desktop):
//   - the calculator island hydrates and its visible text changes when an input changes
//   - no horizontal page overflow; the calculator fits the viewport
//   - every input, select and button in the calculator has an accessible name
//   - every such control is reachable with the Tab key and shows a visible focus indicator
//   - no uncaught JavaScript exceptions
const SLUGS = [
  'water-intake-calculator', 'pregnancy-weight-gain-calculator', 'blood-pressure-checker',
  'resting-heart-rate-checker', 'target-heart-rate-calculator', 'max-heart-rate-calculator',
  'vo2-max-calculator', 'push-up-test-calculator', 'flexibility-mobility-score',
  'recovery-time-calculator', 'steps-to-calories-calculator', 'running-pace-calculator',
  'ffmi-calculator', 'one-rep-max-calculator', 'calories-burned-calculator',
  'walk-it-off-calculator', 'heart-disease-risk-calculator', 'diabetes-risk-calculator',
  'waist-health-risk-calculator', 'metabolic-age-calculator', 'lean-body-mass-calculator',
  'alcohol-calorie-calculator', 'healthspan-score', 'sitting-disease-reversal-calculator',
  'due-date-calculator', 'pregnancy-week-calculator', 'ovulation-calculator', 'period-calculator',
];

const host = '127.0.0.1';
const delay = (ms) => new Promise((ok) => setTimeout(ok, ms));
const freePort = () => new Promise((ok, fail) => {
  const s = createServer(); s.on('error', fail);
  s.listen(0, host, () => { const n = s.address().port; s.close(() => ok(n)); });
});
async function until(fn, label, timeout = 30000) {
  const deadline = Date.now() + timeout; let last;
  while (Date.now() < deadline) {
    try { const v = await fn(); if (v) return v; } catch (e) { last = e; }
    await delay(200);
  }
  throw Error('Timeout ' + label + (last ? ' : ' + String(last).slice(0, 180) : ''));
}
function findChrome() {
  for (const name of [process.env.CHROME_PATH, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    if (!name) continue;
    const r = spawnSync('which', [name], { encoding: 'utf8' });
    if (r.status === 0) return r.stdout.trim();
    if (name.startsWith('/')) return name;
  }
  throw Error('Chrome/Chromium not installed');
}
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl), inflight = new Map(), listeners = [];
  let next = 0;
  const ready = new Promise((ok, fail) => {
    ws.addEventListener('open', ok, { once: true }); ws.addEventListener('error', fail, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method) { for (const l of listeners) l(msg); return; }
    const p = inflight.get(msg.id); if (!p) return;
    inflight.delete(msg.id);
    msg.error ? p.fail(Error(JSON.stringify(msg.error))) : p.ok(msg.result);
  });
  return {
    on(fn) { listeners.push(fn); },
    async send(method, params = {}, sessionId) {
      await ready; const id = ++next;
      return new Promise((ok, fail) => {
        inflight.set(id, { ok, fail });
        ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    },
    close() { ws.close(); },
  };
}

// Runs in the page. Returns facts about the calculator's controls.
const AUDIT = `(() => {
  const root = document.querySelector('.tool__calc');
  if (!root) return { missing: true };
  const controls = [...root.querySelectorAll('input, select, textarea, button')]
    .filter((e) => !e.disabled && e.type !== 'hidden' && e.getClientRects().length);
  const name = (e) => {
    const al = e.getAttribute('aria-label'); if (al && al.trim()) return al.trim();
    const lb = e.getAttribute('aria-labelledby');
    if (lb) { const t = lb.split(/\\s+/).map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim(); if (t) return t; }
    if (e.id) { const l = document.querySelector('label[for="' + CSS.escape(e.id) + '"]'); if (l && l.textContent.trim()) return l.textContent.trim(); }
    const wrap = e.closest('label'); if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    if (e.tagName === 'BUTTON' && e.textContent.trim()) return e.textContent.trim();
    const t = e.getAttribute('title'); if (t && t.trim()) return t.trim();
    return '';
  };
  const unnamed = controls.filter((e) => !name(e)).map((e) => e.outerHTML.slice(0, 140));
  const b = root.getBoundingClientRect();
  return {
    count: controls.length, unnamed,
    scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth,
    left: b.left, right: b.right, w: innerWidth,
    text: root.innerText,
  };
})()`;

// Focus-indicator styles of a control and its two nearest wrappers (a
// :focus-within ring on the field wrapper is a valid indicator).
const LOOK_FN = `const __qaLook = (e, root) => [e, e.parentElement, e.parentElement?.parentElement]
  .filter((n) => n && root.contains(n)).map((n) => { const cs = getComputedStyle(n);
    return [cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor : 'none', cs.boxShadow, cs.borderColor]; });`;

// Unfocused baseline for every control, taken once before tabbing. Comparing
// against it means focus is never moved by the measurement itself.
const BASELINE = `(() => { ${LOOK_FN}
  const root = document.querySelector('.tool__calc');
  window.__qaBase = new Map();
  for (const e of root.querySelectorAll('input, select, textarea, button, a[href]')) window.__qaBase.set(e, __qaLook(e, root));
  return window.__qaBase.size; })()`;

// The focused control, and whether any focus-indicator style differs from its baseline.
const FOCUSED = `(() => { ${LOOK_FN}
  const e = document.activeElement;
  const root = document.querySelector('.tool__calc');
  if (!e || !root || !root.contains(e) || e === root) return null;
  const base = window.__qaBase?.get(e);
  const now = __qaLook(e, root);
  const ring = !base ? null : now.some((n, i) => base[i] && (
    (n[0] !== 'none' && n[0] !== base[i][0]) ||
    (n[1] !== 'none' && n[1] !== base[i][1]) ||
    (n[2] !== base[i][2])));
  return { tag: e.tagName, id: e.id, label: (e.getAttribute('aria-label') || e.textContent || e.id || '').trim().slice(0, 40), ring };
})()`;

// Number inputs in the calculator (index-addressed), and a setter that also
// presses the calculator's submit button when it has one.
const NUMBER_INPUTS = `(() => [...document.querySelector('.tool__calc').querySelectorAll('input[type=number], input:not([type])')]
  .filter((e) => !e.disabled && e.getClientRects().length)
  .map((e) => ({ id: e.id, value: e.value, min: e.min, max: e.max })))()`;
const SET_INPUT = (i, v) => `(() => {
  const root = document.querySelector('.tool__calc');
  const e = [...root.querySelectorAll('input[type=number], input:not([type])')].filter((x) => !x.disabled && x.getClientRects().length)[${i}];
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(String(v))});
  e.dispatchEvent(new Event('input', { bubbles: true }));
  e.dispatchEvent(new Event('change', { bubbles: true }));
  const submit = root.querySelector('button[type=submit]');
  if (submit) submit.click();
  return true;
})()`;
const candidates = ({ value, min, max }) => {
  const cur = Number(value), out = [];
  if (Number.isFinite(cur) && cur > 0) out.push(cur * 2, Math.max(1, Math.round(cur / 2)));
  if (min !== '' && Number.isFinite(Number(min))) out.push(Number(min));
  if (max !== '' && Number.isFinite(Number(max))) out.push(Number(max));
  out.push(30, 5);
  return [...new Set(out.map(String))].filter((v) => v !== value);
};
// Elements wider than the viewport, for diagnosing overflow.
const OFFENDERS = `(() => { const w = document.documentElement.clientWidth;
  return [...document.querySelectorAll('.tool__calc *')].map((e) => { const r = e.getBoundingClientRect();
    return { tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 40), right: Math.round(r.right), width: Math.round(r.width) }; })
    .filter((x) => x.right > w + 1).sort((a, b) => a.width - b.width).slice(0, 5); })()`;

test('changed calculators: hydration, interaction, 390px and desktop fit, accessible names, keyboard focus', { timeout: 900000 }, async () => {
  const port = await freePort(), chromePort = await freePort();
  const profile = mkdtempSync(join(tmpdir(), 'hls-calc-qa-'));
  const log = []; let astro, chrome, cdp;
  const failures = [];
  const report = [];
  try {
    astro = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', String(port)], {
      env: { ...process.env, CMS_DISABLE: '1', CMS_URL: 'http://127.0.0.1:9', INDEXNOW_DISABLE: 'true', VERCEL_ENV: 'development' },
      stdio: ['ignore', 'pipe', 'pipe'], detached: true,
    });
    for (const s of [astro.stdout, astro.stderr]) s.on('data', (d) => { log.push(String(d)); if (log.length > 40) log.shift(); });
    const origin = 'http://' + host + ':' + port;
    await until(async () => {
      if (astro.exitCode !== null) throw Error('Astro exited ' + astro.exitCode);
      const r = await fetch(origin + '/tools/' + SLUGS[0]); return r.ok;
    }, 'offline Astro tool response', 90000);
    chrome = spawn(findChrome(), [
      '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
      '--remote-debugging-port=' + chromePort, '--user-data-dir=' + profile, 'about:blank',
    ], { stdio: 'ignore' });
    const info = await until(async () => {
      if (chrome.exitCode !== null) throw Error('Chrome exited ' + chrome.exitCode);
      const r = await fetch('http://' + host + ':' + chromePort + '/json/version');
      return r.ok ? r.json() : null;
    }, 'Chrome remote debugger', 25000);
    cdp = connect(info.webSocketDebuggerUrl);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (m, p = {}) => cdp.send(m, p, sessionId);
    const js = async (expression) => {
      const x = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (x.exceptionDetails) throw Error(JSON.stringify(x.exceptionDetails).slice(0, 400));
      return x.result.value;
    };
    let exceptions = [];
    cdp.on((msg) => {
      if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(String(msg.params?.exceptionDetails?.exception?.description ?? msg.params?.exceptionDetails?.text).slice(0, 200));
      }
    });
    await send('Runtime.enable'); await send('Page.enable');
    const viewport = (width, height, mobile) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    const tab = (shift = false) => Promise.all(['keyDown', 'keyUp'].map((type) => send('Input.dispatchKeyEvent', {
      type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: shift ? 8 : 0,
    })));

    for (const slug of SLUGS) {
      const fail = (msg) => failures.push(slug + ': ' + msg);
      exceptions = [];
      await viewport(390, 844, true);
      const nav = await send('Page.navigate', { url: origin + '/tools/' + slug });
      if (nav.errorText) { fail('navigation ' + nav.errorText); continue; }
      try {
        await until(() => js("location.pathname==='/tools/" + slug + "'&&!!document.querySelector('.tool__calc')"), 'tool DOM', 45000);
        await js("document.querySelector('.tool__calc').scrollIntoView({block:'center'})");
        await until(() => js("(()=>{const i=document.querySelector('.tool__calc astro-island');return !!i&&!i.hasAttribute('ssr')})()"), 'hydration', 30000);
      } catch (e) { fail(String(e)); continue; }
      await delay(300);

      const mobile = await js(AUDIT);
      if (mobile.missing) { fail('calculator container missing'); continue; }
      if (mobile.count === 0) fail('no interactive controls');
      if (mobile.unnamed.length) fail('controls without accessible name: ' + JSON.stringify(mobile.unnamed));
      if (mobile.scroll > mobile.client + 1) fail(`390px horizontal overflow (${mobile.scroll} > ${mobile.client}) ` + JSON.stringify(await js(OFFENDERS)));
      if (mobile.left < -1 || mobile.right > mobile.w + 1) fail(`390px calculator outside viewport (${Math.round(mobile.left)}..${Math.round(mobile.right)} of ${mobile.w})`);

      // Keyboard: Tab from just before the calculator through all of its controls.
      await js("(()=>{const r=document.querySelector('.tool__calc');const s=document.createElement('button');s.id='qa-tab-start';s.textContent='start';r.parentNode.insertBefore(s,r);s.focus();})()");
      await js(BASELINE);
      const reached = new Map();
      for (let i = 0; i < mobile.count + 25; i++) {
        await tab();
        const f = await js(FOCUSED);
        if (!f) { if (reached.size) break; continue; }
        reached.set(f.id || f.label + '#' + i, f);
      }
      await js("document.getElementById('qa-tab-start')?.remove()");
      const reachedCount = [...reached.values()].length;
      if (reachedCount < mobile.count) fail(`only ${reachedCount}/${mobile.count} controls reachable with Tab`);
      // ring === null: control appeared after the baseline (e.g. a result link); not judged here.
      const noRing = [...reached.values()].filter((f) => f.ring === false).map((f) => f.tag + ' ' + (f.id || f.label));
      if (noRing.length) fail('no visible focus indicator: ' + JSON.stringify(noRing));

      // Interaction: some input change must change the visible result.
      const inputs = await js(NUMBER_INPUTS);
      let interaction = inputs.length ? 'none' : 'n/a';
      outer: for (let i = 0; i < inputs.length; i++) {
        for (const v of candidates(inputs[i])) {
          const before = await js("document.querySelector('.tool__calc').innerText");
          await js(SET_INPUT(i, v));
          try {
            await until(async () => (await js("document.querySelector('.tool__calc').innerText")) !== before, 'change', 1500);
            interaction = 'ok'; break outer;
          } catch { /* try the next value or input */ }
        }
      }
      if (interaction === 'none') fail('no input change altered the visible result');

      await viewport(1440, 900, false);
      await delay(250);
      const desk = await js(AUDIT);
      if (desk.scroll > desk.client + 1) fail(`desktop horizontal overflow (${desk.scroll} > ${desk.client})`);
      if (desk.right > desk.w + 1) fail('desktop calculator outside viewport');

      if (exceptions.length) fail('uncaught exceptions: ' + JSON.stringify(exceptions.slice(0, 3)));
      report.push(`${slug}: controls=${mobile.count} tab=${reachedCount} interaction=${interaction}`);
    }
    // PHQ-9 safety scenario: no pre-filled answers; item 9 flagged above a minimal total.
    {
      const slug = 'phq-9-depression-screener';
      const fail = (msg) => failures.push(slug + ': ' + msg);
      exceptions = [];
      await viewport(390, 844, true);
      await send('Page.navigate', { url: origin + '/tools/' + slug });
      try {
        await until(() => js("location.pathname==='/tools/" + slug + "'&&!!document.querySelector('.tool__calc .quiz')"), 'quiz DOM', 45000);
        await js("document.querySelector('.tool__calc').scrollIntoView({block:'start'})"); // client:visible
        await until(() => js("(()=>{const i=document.querySelector('.tool__calc astro-island');return !!i&&!i.hasAttribute('ssr')})()"), 'quiz hydration', 30000);
        const initial = await js(`(() => { const r = document.querySelector('.tool__calc');
          return { checked: r.querySelectorAll('input[type=radio]:checked').length, progress: r.querySelector('.quiz__progress')?.textContent ?? '',
            score: !!r.querySelector('.calc__value'), crisis: !!r.querySelector('.quiz__crisis') }; })()`);
        if (initial.checked !== 0) fail(initial.checked + ' answers pre-selected');
        if (initial.score) fail('score shown before any answer');
        if (!/0 of 9 answered/.test(initial.progress)) fail('missing progress message: ' + initial.progress);
        if (!initial.crisis) fail('crisis line not visible before completion');
        // Answer: "Not at all" for items 1-8, "Several days" for item 9.
        await js(`(() => { document.querySelectorAll('.tool__calc fieldset.quiz__q').forEach((fs, i) => {
          fs.querySelectorAll('input[type=radio]')[i === 8 ? 1 : 0].click(); }); return true; })()`);
        await until(() => js("!!document.querySelector('.tool__calc .calc__value')"), 'score after completion', 6000);
        const done = await js(`(() => { const r = document.querySelector('.tool__calc'); const flag = r.querySelector('.quiz__flag--urgent');
          const head = r.querySelector('.calc__headline');
          return { value: r.querySelector('.calc__value')?.textContent.replace(/\s+/g, ' ').trim(), badge: r.querySelector('.calc__badge')?.textContent,
            flag: flag?.textContent ?? '', role: flag?.getAttribute('role'), before: !!(flag && head && (flag.compareDocumentPosition(head) & Node.DOCUMENT_POSITION_FOLLOWING)),
            scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }; })()`);
        if (done.value !== '1 / 27') fail('score ' + done.value);
        if (done.badge !== 'Minimal') fail('band ' + done.badge);
        if (!/better off dead or of hurting yourself/.test(done.flag)) fail('item 9 alert missing');
        if (done.role !== 'alert') fail('item 9 alert lacks role=alert');
        if (!done.before) fail('item 9 alert not shown above the score');
        if (done.scroll > done.client + 1) fail(`390px overflow (${done.scroll} > ${done.client})`);
        if (exceptions.length) fail('uncaught exceptions: ' + JSON.stringify(exceptions.slice(0, 3)));
        report.push(`${slug}: unanswered-start=ok item9-alert=${done.role === 'alert' ? 'ok' : 'missing'}`);
      } catch (e) {
        const seen = await js("JSON.stringify({ path: location.pathname, title: document.title, island: (() => { const i = document.querySelector('.tool__calc astro-island'); if (!i) return 'NO astro-island'; const c = i.cloneNode(true); c.querySelectorAll('script,style').forEach((x) => x.remove()); return [...i.attributes].map((x) => x.name + '=' + x.value.slice(0, 60)).join(' ') + ' || ' + c.innerHTML.replace(/\\s+/g, ' ').slice(0, 900); })() })").catch((x) => String(x));
        fail(String(e) + ' | page: ' + seen);
      }
    }

    console.log('[CALC_BROWSER_QA] ' + report.join(' | '));
    if (failures.length) console.error('[CALC_BROWSER_QA] FAILURES\n' + failures.join('\n'));
    assert.deepEqual(failures, []);
  } catch (e) {
    console.error('[CALC_BROWSER_QA] ASTRO LOG ' + log.join('').slice(-2500));
    throw e;
  } finally {
    cdp?.close();
    if (chrome?.pid) { chrome.kill('SIGTERM'); await new Promise((ok) => { if (chrome.exitCode !== null) return ok(); chrome.once('exit', ok); setTimeout(ok, 1600); }); }
    if (astro?.pid) { try { process.kill(-astro.pid, 'SIGTERM'); } catch { astro.kill('SIGTERM'); } }
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
  }
});
