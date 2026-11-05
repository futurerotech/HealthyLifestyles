/** Real Chromium interaction gate for two synthetic CMS article embeds. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import * as chromeLauncher from 'chrome-launcher';
import WebSocket from 'ws';
import { assertRawArticleHead, readRawDocumentHtml } from './raw-article-head.mjs';

const CASES = [
  { article: 'how-many-calories-to-lose-weight', slug: 'body-fat-calculator', field: 'waist', newValue: '105', width: 1280, height: 800, mobile: false },
  { article: 'calories-burned-calculator-guide', slug: 'bmi-calculator', field: 'weight', newValue: '103', width: 390, height: 844, mobile: true },
];
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.webp':'image/webp', '.png':'image/png', '.woff':'font/woff', '.woff2':'font/woff2' };

async function findFixture() {
  const base = resolve('.content-audit');
  const names = await readdir(base);
  const dirs = await Promise.all(names.filter(n => n.startsWith('fixture-')).map(async n => {
    const dir = resolve(base, n, 'dist/client');
    try {
      for (const c of CASES) await stat(resolve(dir, 'wellness-hub', c.article, 'index.html'));
      return { dir, mtime: (await stat(dir)).mtimeMs };
    } catch { return null; }
  }));
  const matches = dirs.filter(Boolean).sort((a, b) => b.mtime - a.mtime);
  assert.ok(matches.length, 'Isolated CMS fixture not found. Run npm run test:cms-build first.');
  return matches[0].dir;
}

function startServer(root) {
  return createServer(async (req, res) => {
    try {
      if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (path.includes('\0')) { res.writeHead(400).end(); return; }
      let file = resolve(root, '.' + path);
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const st = await stat(file).catch(() => null);
      if (st?.isDirectory() || (!st && !extname(file))) file = resolve(file, 'index.html');
      const data = await readFile(file);
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.writeHead(200).end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404).end('Not found'); }
  });
}

async function cdpConnect(port) {
  let page;
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) break;
    } catch { /* browser starting */ }
    await delay(100);
  }
  assert.ok(page, 'Chromium DevTools page target unavailable');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, bad) => { ws.once('open', ok); ws.once('error', bad); });
  const pending = new Map();
  let id = 0;
  const errors = [];
  const consoleErrors = [];
  const networkFailures = [];
  const unsafeRequests = [];
  const requests = new Map();
  const documents = [];
  let allowedOrigin = '';
  function safeLocation(raw) {
    try { const u = new URL(raw); return u.origin + u.pathname; }
    catch { return '[non-http resource]'; }
  }
  ws.on('message', buffer => {
    const msg = JSON.parse(buffer.toString());
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.bad(new Error(msg.error.message)); else p.ok(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push((msg.params?.exceptionDetails?.text || 'Unhandled browser exception').slice(0, 120));
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
      consoleErrors.push((msg.params.args || []).map(arg => String(arg.value ?? arg.description ?? '')).join(' ').slice(0, 160));
    } else if (msg.method === 'Network.requestWillBeSent') {
      const request = msg.params?.request;
      if (!request) return;
      requests.set(msg.params.requestId, { url: request.url, method: request.method });
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        unsafeRequests.push({ method: request.method, url: safeLocation(request.url) });
      }
    } else if (msg.method === 'Network.responseReceived') {
      const { response, type } = msg.params || {};
      if (!response) return;
      if (type === 'Document') {
        documents.push({ status: response.status, url: safeLocation(response.url),
          requestId: msg.params.requestId, finished: false });
      }
      if (['Script', 'Stylesheet'].includes(type) &&
        response.status >= 400 && safeLocation(response.url).startsWith(allowedOrigin + '/')) {
        networkFailures.push({ status: response.status, url: safeLocation(response.url) });
      }
    } else if (msg.method === 'Network.loadingFinished') {
      for (const d of documents) if (d.requestId === msg.params?.requestId) d.finished = true;
    } else if (msg.method === 'Network.loadingFailed' && !msg.params?.canceled) {
      const request = requests.get(msg.params?.requestId);
      if (request && safeLocation(request.url).startsWith(allowedOrigin + '/')) {
        networkFailures.push({ error: String(msg.params.errorText || 'network failure').slice(0, 120), url: safeLocation(request.url) });
      }
    }
  });
  function send(method, params = {}) {
    return new Promise((ok, bad) => {
      const rid = ++id;
      const timer = setTimeout(() => { pending.delete(rid); bad(new Error('CDP timeout: ' + method)); }, 20000);
      pending.set(rid, { ok: result => { clearTimeout(timer); ok(result); }, bad: error => { clearTimeout(timer); bad(error); } });
      ws.send(JSON.stringify({ id: rid, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error('Browser evaluate error: ' + result.exceptionDetails.text);
    return result.result?.value;
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  function beginCase(origin) {
    allowedOrigin = origin;
    requests.clear();
    documents.length = 0;
    errors.length = 0;
    consoleErrors.length = 0;
    networkFailures.length = 0;
    unsafeRequests.length = 0;
  }
  return { ws, send, evaluate, documents, errors, consoleErrors, networkFailures, unsafeRequests, beginCase };
}

async function until(evaluate, expression, stage) {
  const started = Date.now();
  while (Date.now() - started < 18000) {
    if (await evaluate(expression)) return;
    await delay(120);
  }
  throw new Error('Chromium timeout at ' + stage);
}

async function testCase(cdp, origin, c) {
  cdp.beginCase(origin);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width:c.width, height:c.height, mobile:c.mobile, deviceScaleFactor: 1 });
  await cdp.send('Page.navigate', { url: origin + '/wellness-hub/' + c.article + '/' });
  const scope = '.wh-embed[data-tool="' + c.slug + '"]';
  await until(cdp.evaluate, 'document.readyState !== "loading" && !!document.querySelector(' + JSON.stringify(scope) + ')', c.article + ' embed present');
  const rawResponse = await readRawDocumentHtml(cdp, origin,
    '/wellness-hub/' + c.article + '/');
  const expectedCanonical = 'https://www.healthylifesstyles.com/wellness-hub/' + c.article;
  const rawSeo = assertRawArticleHead(rawResponse, expectedCanonical);
  console.log('PASS real Chrome original HTTP HTML SEO: ' + c.article +
    ' ' + JSON.stringify({ canonical: rawSeo.canonical, rawResponseNotLogged: true }));
  const initial = await cdp.evaluate('(() => { const e = document.querySelectorAll(' + JSON.stringify(scope) + '); e[0]?.scrollIntoView({block:"center"}); return { count:e.length, island:!!e[0]?.querySelector("astro-island") }; })()');
  assert.equal(initial.count, 1, c.article + ' must not duplicate calculator');
  assert.equal(initial.island, true, c.article + ' must include real Astro island');
  const metrics = await cdp.evaluate('(() => ({ innerWidth:window.innerWidth, innerHeight:window.innerHeight, clientWidth:document.documentElement.clientWidth, scrollWidth:document.documentElement.scrollWidth }))()');
  assert.equal(metrics.innerWidth, c.width, c.article + ' must use the actual CDP viewport width');
  assert.ok(metrics.clientWidth > 0 && metrics.clientWidth <= metrics.innerWidth, c.article + ' invalid layout viewport');
  assert.ok(metrics.scrollWidth <= metrics.clientWidth + 1,
    c.article + ' horizontal overflow: ' + JSON.stringify(metrics));
  console.log('PASS real Chrome CDP viewport: ' + c.article + ' ' + JSON.stringify(metrics));
  const fieldId = '#calc-' + c.slug + '-' + c.field;
  await until(cdp.evaluate, '(() => { const root=document.querySelector(' + JSON.stringify(scope) + '); const island=root?.querySelector("astro-island"); return island && !island.hasAttribute("ssr") && root.querySelector(".calc__value") && root.querySelector(' + JSON.stringify(fieldId) + ') })()', c.article + ' hydrated');
  await until(cdp.evaluate, '(() => { const root=document.querySelector(' + JSON.stringify(scope) + '); const facebook=root?.querySelector("a[aria-label=\\"Share result on Facebook\\"]"); const x=root?.querySelector("a[aria-label=\\"Share result on X (Twitter)\\"]"); return facebook && x && new URL(facebook.href).searchParams.get("u") === location.href && new URL(x.href).searchParams.get("text")?.includes(location.href); })()', c.article + ' share links include current page');
  await delay(750); // first-time result count-up animation
  const before = await cdp.evaluate('document.querySelector(' + JSON.stringify(scope) + ')?.querySelector(".calc__value")?.textContent?.trim()');
  assert.ok(before && before !== '—', c.article + ' initial output not ready');
  const focused = await cdp.evaluate('(() => { const f=document.querySelector(' + JSON.stringify(scope + ' ' + fieldId) + '); if(!f) return false; f.scrollIntoView({block:"center"}); f.focus(); return document.activeElement===f; })()');
  assert.equal(focused, true, c.article + ' field is not keyboard focusable');
  await cdp.send('Input.dispatchKeyEvent', { type:'keyDown', key:'a', code:'KeyA', modifiers:2, windowsVirtualKeyCode:65 });
  await cdp.send('Input.dispatchKeyEvent', { type:'keyUp', key:'a', code:'KeyA', modifiers:2, windowsVirtualKeyCode:65 });
  await cdp.send('Input.insertText', { text:c.newValue });
  await until(cdp.evaluate, '(() => { const root=document.querySelector(' + JSON.stringify(scope) + '); const input=root?.querySelector(' + JSON.stringify(fieldId) + '); const value=root?.querySelector(".calc__value")?.textContent?.trim(); return input?.value===' + JSON.stringify(c.newValue) + ' && value && value!==' + JSON.stringify(before) + '; })()', c.article + ' result updates after keyboard input');
  const after = await cdp.evaluate('document.querySelector(' + JSON.stringify(scope) + ')?.querySelector(".calc__value")?.textContent?.trim()');
  assert.notEqual(after, before);
  await delay(100); // Allow in-flight browser console and network events to surface.
  assert.deepEqual(cdp.errors, [], c.article + ' unhandled browser JS exceptions');
  assert.deepEqual(cdp.consoleErrors, [], c.article + ' browser console errors');
  assert.deepEqual(cdp.networkFailures, [], c.article + ' local JavaScript/CSS/network failures');
  assert.deepEqual(cdp.unsafeRequests, [], c.article + ' must never issue external mutation requests');
  console.log('PASS CDP diagnostics: ' + c.article + ' no exceptions, console errors, failed local assets, or write requests');
  console.log('PASS calculator interaction: ' + c.article + ' ' + c.slug + ' ' + c.width + 'px ' + before + ' -> ' + after);
}

const root = await findFixture();
const server = startServer(root);
let chrome, cdp;
try {
  await new Promise((ok, bad) => { server.once('error', bad); server.listen(0, '127.0.0.1', ok); });
  chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-background-networking'] });
  cdp = await cdpConnect(chrome.port);
  const origin = 'http://127.0.0.1:' + server.address().port;
  for (const c of CASES) await testCase(cdp, origin, c);
  console.log('PASS: real Chrome verified both authored and automatic CMS article calculators.');
} finally {
  cdp?.ws.close();
  if (chrome) await chrome.kill();
  if (server.listening) await new Promise(ok => server.close(ok));
}
