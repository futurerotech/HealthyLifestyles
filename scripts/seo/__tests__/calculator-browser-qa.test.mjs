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

// Focus style of the currently focused element, if it is inside the calculator.
const FOCUSED = `(() => {
  const e = document.activeElement;
  const root = document.querySelector('.tool__calc');
  if (!e || !root || !root.contains(e)) return null;
  const cs = getComputedStyle(e);
  const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
  return { tag: e.tagName, id: e.id, label: (e.getAttribute('aria-label') || e.textContent || e.id || '').trim().slice(0, 40), ring };
})()`;

// Change the first enabled number input and report whether the visible text changed.
const NUDGE = `(() => {
  const root = document.querySelector('.tool__calc');
  const inputs = [...root.querySelectorAll('input[type=number], input:not([type])')].filter((e) => !e.disabled && e.getClientRects().length);
  if (!inputs.length) return { skipped: true };
  const e = inputs[0];
  const before = root.innerText;
  const cur = Number(e.value);
  const nextVal = Number.isFinite(cur) && cur > 0 ? String(Math.max(1, Math.round(cur * 1.25))) : '30';
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, nextVal);
  e.dispatchEvent(new Event('input', { bubbles: true }));
  e.dispatchEvent(new Event('change', { bubbles: true }));
  return { before, id: e.id, nextVal };
})()`;

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
      if (mobile.scroll > mobile.client + 1) fail(`390px horizontal overflow (${mobile.scroll} > ${mobile.client})`);
      if (mobile.left < -1 || mobile.right > mobile.w + 1) fail(`390px calculator outside viewport (${Math.round(mobile.left)}..${Math.round(mobile.right)} of ${mobile.w})`);

      // Keyboard: Tab from just before the calculator through all of its controls.
      await js("(()=>{const r=document.querySelector('.tool__calc');const s=document.createElement('button');s.id='qa-tab-start';s.textContent='start';r.parentNode.insertBefore(s,r);s.focus();})()");
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
      const noRing = [...reached.values()].filter((f) => !f.ring).map((f) => f.tag + ' ' + (f.id || f.label));
      if (noRing.length) fail('no visible focus indicator: ' + JSON.stringify(noRing));

      // Interaction: changing an input changes the visible result.
      const n = await js(NUDGE);
      if (!n.skipped) {
        try {
          await until(async () => (await js("document.querySelector('.tool__calc').innerText")) !== n.before, 'result changes after editing ' + n.id, 6000);
        } catch (e) { fail(String(e)); }
      }

      await viewport(1440, 900, false);
      await delay(250);
      const desk = await js(AUDIT);
      if (desk.scroll > desk.client + 1) fail(`desktop horizontal overflow (${desk.scroll} > ${desk.client})`);
      if (desk.right > desk.w + 1) fail('desktop calculator outside viewport');

      if (exceptions.length) fail('uncaught exceptions: ' + JSON.stringify(exceptions.slice(0, 3)));
      report.push(`${slug}: controls=${mobile.count} tab=${reachedCount} interaction=${n.skipped ? 'n/a' : 'ok'}`);
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
