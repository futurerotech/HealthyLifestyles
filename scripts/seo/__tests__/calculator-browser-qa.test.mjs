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
  // Whole page, not just the calculator box: run 43575235796 overflowed from the sources list
  // and this list came back empty.
  return [...document.querySelectorAll('main *')].map((e) => { const r = e.getBoundingClientRect();
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
    // A cold headless Chrome on a shared CI runner can take longer than 25 s to
    // open its debugging port (seen once in run 43569328123, before any page
    // was loaded). Wait up to 60 s and relaunch once on a fresh port; a second
    // failure still fails the test.
    let info = null;
    for (let attempt = 1; attempt <= 2 && !info; attempt++) {
      const debugPort = attempt === 1 ? chromePort : await freePort();
      chrome = spawn(findChrome(), [
        '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
        '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
        '--remote-debugging-port=' + debugPort, '--user-data-dir=' + join(profile, 'attempt-' + attempt), 'about:blank',
      ], { stdio: 'ignore' });
      try {
        info = await until(async () => {
          if (chrome.exitCode !== null) throw Error('Chrome exited ' + chrome.exitCode);
          const r = await fetch('http://' + host + ':' + debugPort + '/json/version');
          return r.ok ? r.json() : null;
        }, 'Chrome remote debugger', 60000);
      } catch (e) {
        if (attempt === 2) throw e;
        console.log('[CALC_BROWSER_QA] Chrome debugger not ready on attempt 1 (' + e + '); relaunching once');
        chrome.kill('SIGKILL');
        await new Promise((ok) => { if (chrome.exitCode !== null) return ok(); chrome.once('exit', ok); setTimeout(ok, 2000); });
      }
    }
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
        if (await js("!!document.querySelector('.tool__calc .share-result')")) fail('sensitive screener result offers sharing');
        if (exceptions.length) fail('uncaught exceptions: ' + JSON.stringify(exceptions.slice(0, 3)));
        report.push(`${slug}: unanswered-start=ok item9-alert=${done.role === 'alert' ? 'ok' : 'missing'}`);
      } catch (e) {
        const seen = await js("JSON.stringify({ path: location.pathname, title: document.title, island: (() => { const i = document.querySelector('.tool__calc astro-island'); if (!i) return 'NO astro-island'; const c = i.cloneNode(true); c.querySelectorAll('script,style').forEach((x) => x.remove()); return [...i.attributes].map((x) => x.name + '=' + x.value.slice(0, 60)).join(' ') + ' || ' + c.innerHTML.replace(/\\s+/g, ' ').slice(0, 900); })() })").catch((x) => String(x));
        fail(String(e) + ' | page: ' + seen);
      }
    }

    // Helper: open a tool page at 390px and wait until its island has hydrated.
    const openTool = async (slug) => {
      exceptions = [];
      await viewport(390, 844, true);
      await send('Page.navigate', { url: origin + '/tools/' + slug });
      await until(() => js("location.pathname==='/tools/" + slug + "'&&!!document.querySelector('.tool__calc astro-island')"), slug + ' DOM', 45000);
      await js("document.querySelector('.tool__calc').scrollIntoView({block:'start'})");
      await until(() => js("(()=>{const i=document.querySelector('.tool__calc astro-island');return !!i&&!i.hasAttribute('ssr')})()"), slug + ' hydration', 30000);
    };
    // Set a field the way a user would (native setter + input/change events).
    const setField = (id, value) => js(`(() => { const e = document.getElementById(${JSON.stringify(id)});
      const proto = e.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, ${JSON.stringify(value)});
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    const resultText = () => js("document.querySelector('.tool__calc .calc__result')?.textContent ?? ''");
    const ymd = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

    // WHO-5 licence hold: no reproduced items, official WHO link.
    try {
      await openTool('who-5-wellbeing-screener');
      const w = await js(`(() => { const r = document.querySelector('.tool__calc');
        return { radios: r.querySelectorAll('input[type=radio]').length, hold: r.querySelector('.quiz__hold')?.textContent ?? '',
          link: r.querySelector('a[href^="https://www.who.int/"]')?.getAttribute('href') ?? '', share: !!r.querySelector('.share-result') }; })()`);
      if (w.radios !== 0) failures.push('who-5-wellbeing-screener: ' + w.radios + ' reproduced answer options shown');
      if (!/non-commercial licence/.test(w.hold)) failures.push('who-5-wellbeing-screener: licence notice missing');
      if (w.link !== 'https://www.who.int/publications/m/item/who-ucn-msd-mhe-2024.01') failures.push('who-5-wellbeing-screener: official link ' + w.link);
      if (w.share) failures.push('who-5-wellbeing-screener: share control shown');
      report.push('who-5-wellbeing-screener: licence-hold=ok');
    } catch (e) { failures.push('who-5-wellbeing-screener: ' + e); }

    // Due date: a future entered date never yields a pregnancy, for LMP and conception.
    try {
      await openTool('due-date-calculator');
      for (const method of ['lmp', 'conception']) {
        await setField('dd-method', method);
        await setField('dd-date', ymd(1));
        await until(async () => /is in the future/.test(await resultText()), 'future-date message (' + method + ')', 5000)
          .catch(async () => failures.push('due-date-calculator: ' + method + ' tomorrow shows: ' + (await resultText()).slice(0, 120)));
        if (/Estimated due date/.test(await resultText())) failures.push('due-date-calculator: ' + method + ' tomorrow still shows a due date');
      }
      await setField('dd-method', 'lmp');
      await setField('dd-date', ymd(-56));
      await until(async () => /Estimated due date/.test(await resultText()), 'valid date restores result', 5000)
        .catch(() => failures.push('due-date-calculator: valid date did not restore the result'));
      report.push('due-date-calculator: future-date=checked');
    } catch (e) { failures.push('due-date-calculator: ' + e); }

    // Ovulation: an out-of-range cycle length is reported, not silently used.
    try {
      await openTool('ovulation-calculator');
      await setField('ov-cycle', '1000');
      await until(async () => /must be a whole number from 20 to 45 days/.test(await resultText()), 'range message', 5000)
        .catch(async () => failures.push('ovulation-calculator: cycle 1000 shows: ' + (await resultText()).slice(0, 120)));
      await setField('ov-cycle', '28');
      await until(async () => /Estimated ovulation/.test(await resultText()), 'valid cycle restores result', 5000)
        .catch(() => failures.push('ovulation-calculator: valid cycle did not restore the result'));
      report.push('ovulation-calculator: cycle-range=checked');
    } catch (e) { failures.push('ovulation-calculator: ' + e); }
    // Weight-loss timeline: no plan to a goal below the healthy range; valid goal restores it.
    try {
      await openTool('weight-loss-timeline-calculator');
      const setNth = (n, value) => js(`(() => { const e = document.querySelectorAll('.tool__calc .wt__grid input')[${n}];
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(value)});
        e.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
      const state = () => js(`(() => { const r = document.querySelector('.tool__calc');
        return { inputs: r.querySelectorAll('.wt__grid input').length, hero: !!r.querySelector('.wt__hero'),
          msg: r.querySelector('.wt__gain')?.textContent ?? '', labels: [...r.querySelectorAll('.wt__grid label > span')].map((x) => x.textContent),
          scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }; })()`);
      const s0 = await state();
      if (s0.inputs !== 4 || !s0.labels.includes('Height')) failures.push('weight-loss-timeline-calculator: height field missing ' + JSON.stringify(s0.labels));
      if (!s0.hero) failures.push('weight-loss-timeline-calculator: default plan not shown');
      await setNth(1, '50'); // goal 50 kg at 175 cm (healthy range starts ~56.7 kg)
      await until(async () => /below the healthy weight range/.test((await state()).msg), 'below-range message', 5000)
        .catch(async () => failures.push('weight-loss-timeline-calculator: goal 50 kg shows ' + JSON.stringify(await state())));
      if ((await state()).hero) failures.push('weight-loss-timeline-calculator: goal date shown for a below-range goal');
      await setNth(1, '0');
      await until(async () => /Check your numbers/.test((await state()).msg), 'invalid message', 5000)
        .catch(() => failures.push('weight-loss-timeline-calculator: goal 0 kg not rejected'));
      await setNth(1, '75');
      await until(async () => (await state()).hero, 'plan restored', 5000)
        .catch(() => failures.push('weight-loss-timeline-calculator: valid goal did not restore the plan'));
      const s1 = await state();
      if (s1.scroll > s1.client + 1) failures.push(`weight-loss-timeline-calculator: 390px overflow (${s1.scroll} > ${s1.client})`);
      report.push('weight-loss-timeline-calculator: goal-floor=checked');
    } catch (e) { failures.push('weight-loss-timeline-calculator: ' + e); }
    // Breathing timer: Pause resumes (did restart), heading follows technique.
    try {
      await openTool('box-breathing-timer');
      const bt = () => js(`(() => { const r = document.querySelector('.tool__calc');
        return { h: r.querySelector('.calc__heading')?.textContent, count: r.querySelector('.breathe__count')?.textContent ?? '',
          label: r.querySelector('.breathe__label')?.textContent, live: r.querySelectorAll('[aria-live]').length,
          btn: [...r.querySelectorAll('.breathe__controls button')].map((b) => b.textContent) }; })()`);
      const click = (text) => js(`(() => { const b = [...document.querySelectorAll('.tool__calc button')].find((x) => x.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.click(); return true; })()`);
      if ((await bt()).h !== 'Box breathing') failures.push('box-breathing-timer: heading ' + (await bt()).h);
      await click('Start');
      await new Promise((r) => setTimeout(r, 2300));
      await click('Pause');
      const paused = await bt();
      if (paused.label !== 'Paused' || !paused.btn.includes('Resume')) failures.push('box-breathing-timer: pause state ' + JSON.stringify(paused));
      await click('Resume');
      await new Promise((r) => setTimeout(r, 300));
      const resumed = await bt();
      if (resumed.count === '4' && paused.count !== '4') failures.push('box-breathing-timer: resume restarted the exercise ' + JSON.stringify([paused, resumed]));
      if (resumed.live !== 1) failures.push('box-breathing-timer: expected one phase-only live region, found ' + resumed.live);
      await click('4-7-8');
      if ((await bt()).h !== '4-7-8 breathing') failures.push('box-breathing-timer: heading not updated for 4-7-8');
      report.push('box-breathing-timer: pause-resume=checked');
    } catch (e) { failures.push('box-breathing-timer: ' + e); }

    // Sleep debt: a blank night is reported, not counted as 0 hours.
    try {
      await openTool('sleep-debt-calculator');
      await setField('sleep-day-0', '');
      await until(async () => /Enter hours slept between 0 and 14 for: Mon/.test(await resultText()), 'blank-night message', 5000)
        .catch(async () => failures.push('sleep-debt-calculator: blank Monday shows ' + (await resultText()).slice(0, 120)));
      await setField('sleep-day-0', '7');
      await until(async () => /Weekly sleep/.test(await resultText()), 'result restored', 5000)
        .catch(() => failures.push('sleep-debt-calculator: valid entry did not restore the result'));
      report.push('sleep-debt-calculator: blank-night=checked');
    } catch (e) { failures.push('sleep-debt-calculator: ' + e); }
    if (exceptions.length) failures.push('scenario pages: uncaught exceptions ' + JSON.stringify(exceptions.slice(0, 3)));

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
