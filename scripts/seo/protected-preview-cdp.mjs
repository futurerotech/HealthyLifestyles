/**
 * Authorized read-only Chromium CDP gate for an EXISTING protected Vercel Preview.
 * Before running, verify HLS_PREVIEW_URL, HLS_PREVIEW_SHA and HLS_PREVIEW_DEPLOYMENT_ID
 * from the Vercel provider. This script does not independently attest remote SHA.
 * Only run in an authorized browser environment; never bypass Work policies.
 *
 * vercel env run -- node scripts/seo/protected-preview-cdp.mjs
 * Environment: HLS_PREVIEW_URL, HLS_PREVIEW_SHA, HLS_PREVIEW_DEPLOYMENT_ID,
 * VERCEL_OIDC_TOKEN. No secret is printed, persisted or shared with other origins.
 */
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';
import { assertRawArticleHead, readRawDocumentHtml, selfTestRawArticleHead } from './raw-article-head.mjs';

const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const HEADER = 'x-vercel-trusted-oidc-idp-token';
// Preserve the specific embed/field combination proven by real local Chrome.
// The body-fat article uses the WAIST field; it must not be tested as BMI.
const CASES = [
  { slug: 'calories-burned-calculator-guide', tool: 'bmi-calculator', field: 'weight', first: '72', second: '80' },
  { slug: 'how-many-calories-to-lose-weight', tool: 'body-fat-calculator', field: 'waist', first: '90', second: '105' },
];
function config(env) {
  let u;
  try { u = new URL(env.HLS_PREVIEW_URL || ''); }
  catch { throw new Error('Missing or invalid HLS_PREVIEW_URL'); }
  if (u.protocol !== 'https:' || !/^healthy-lifestyles-[a-z0-9-]+-healthy-lifestyles\.vercel\.app$/.test(u.hostname)
    || u.username || u.password || u.search || u.hash || u.pathname !== '/') {
    throw new Error('Refusing URL outside the expected protected Preview host');
  }
  assert.match(env.HLS_PREVIEW_SHA || '', /^[a-f0-9]{40}$/, 'Expected pinned commit SHA');
  assert.match(env.HLS_PREVIEW_DEPLOYMENT_ID || '', /^dpl_[A-Za-z0-9]+$/, 'Expected pinned deployment ID');
  const token = env.VERCEL_OIDC_TOKEN || '';
  if (!token || /[\r\n]/.test(token)) throw new Error('Missing or invalid process-scoped VERCEL_OIDC_TOKEN');
  return { origin: u.origin, sha: env.HLS_PREVIEW_SHA, id: env.HLS_PREVIEW_DEPLOYMENT_ID, token };
}
function decision(url, method, origin) {
  if (WRITE.has(String(method).toUpperCase())) return { block: true, scoped: false };
  let scoped = false;
  try { scoped = new URL(url).origin === origin; } catch {}
  return { block: false, scoped };
}
function publicHeaders(headers) {
  return Object.entries(headers || {}).filter(([name]) => name.toLowerCase() !== HEADER)
    .map(([name, value]) => ({ name, value: String(value) }));
}
function headerEntries(headers, token) {
  return publicHeaders(headers).concat([{ name: HEADER, value: token }]);
}
function safePath(raw) {
  try { const u = new URL(raw); return u.origin + u.pathname; }
  catch { return '[non-http resource]'; }
}
// Keep this expression self-contained: it runs in real Chrome and in the offline
// mocked-DOM regression. Astro island hosts can have a zero-sized box, so
// scrolling the host itself does not reliably expose client:visible content.
function viewportExposureExpression() {
  return '(() => {const root=document.querySelector(".wh-embed");' +
    'const island=root?.querySelector("astro-island");if(!island)return false;' +
    'const result=root.querySelector(".calc__value");' +
    'const resultBox=result?.getBoundingClientRect();' +
    'const target=resultBox?.width>0&&resultBox?.height>0?result:root;' +
    'const box=target.getBoundingClientRect();if(!(box.width>0&&box.height>0))return false;' +
    'root.scrollIntoView({block:"center",behavior:"instant"});' +
    'if(target!==root)target.scrollIntoView({block:"center",behavior:"instant"});' +
    'return true;})()';
}
function selfTest() {
  const e = { HLS_PREVIEW_URL: 'https://healthy-lifestyles-test-healthy-lifestyles.vercel.app/',
    HLS_PREVIEW_SHA: 'a'.repeat(40), HLS_PREVIEW_DEPLOYMENT_ID: 'dpl_sample',
    VERCEL_OIDC_TOKEN: 'opaque-sample-credential' };
  const x = config(e);
  assert.deepEqual(decision(x.origin + '/wellness-hub/', 'GET', x.origin), { block: false, scoped: true });
  assert.deepEqual(decision('https://third-party.example/', 'GET', x.origin), { block: false, scoped: false });
  for (const method of WRITE) assert.equal(decision(x.origin + '/api/lead', method, x.origin).block, true);
  assert.equal(headerEntries({ Accept: '*/*' }, x.token).filter(y => y.name === HEADER).length, 1);
  assert.equal(publicHeaders({ Accept: '*/*', [HEADER]: x.token })
    .some(y => y.name.toLowerCase() === HEADER), false, 'Never forward OIDC off-origin');
  for (const wrong of ['https://www.healthylifesstyles.com/', 'https://other.vercel.app/',
    'http://healthy-lifestyles-test-healthy-lifestyles.vercel.app/', x.origin + '/other',
    x.origin + '/?auth=1']) assert.throws(() => config({ ...e, HLS_PREVIEW_URL: wrong }));
  assert.throws(() => config({ ...e, VERCEL_OIDC_TOKEN: '' }));
  // Regression from live attempt #42120916786: Astro host has no layout box
  // despite SSR calculator output. Scroll its measurable wrapper and content.
  const moves = [];
  const island = { getBoundingClientRect: () => ({ width: 0, height: 0 }) };
  const result = { getBoundingClientRect: () => ({ width: 90, height: 24 }),
    scrollIntoView: () => moves.push('result') };
  const root = { getBoundingClientRect: () => ({ width: 390, height: 600 }),
    scrollIntoView: () => moves.push('root'),
    querySelector: q => q === 'astro-island' ? island : q === '.calc__value' ? result : null };
  const context = { document: { querySelector: q => q === '.wh-embed' ? root : null } };
  assert.equal(runInNewContext(viewportExposureExpression(), context), true,
    'Zero-box island must not prevent exposure of the rendered calculator');
  assert.deepEqual(moves, ['root', 'result'],
    'Must scroll measurable elements, never the zero-box island host');
  moves.length = 0;
  const fallback = { ...root, querySelector: q => q === 'astro-island' ? island : null };
  assert.equal(runInNewContext(viewportExposureExpression(),
    { document: { querySelector: () => fallback } }), true, 'SSR wrapper fallback');
  assert.deepEqual(moves, ['root'], 'SSR wrapper alone remains a safe scroll target');
  assert.equal(runInNewContext(viewportExposureExpression(),
    { document: { querySelector: () => null } }), false, 'Missing embed must fail closed');
  assert.equal(runInNewContext(viewportExposureExpression(),
    { document: { querySelector: () => ({ ...fallback,
      getBoundingClientRect: () => ({ width: 0, height: 0 }) }) } }), false,
  'Hidden calculator must not be treated as exposed');
  selfTestRawArticleHead();
  console.log('PASS protected-preview CDP self-test: pinned origin, scoped credential, mutation-denial policy, zero-box island scroll regression');
}
async function cdpConnect(port, cfg, WS) {
  let target;
  for (let i = 0; i < 80; i++) {
    try {
      const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      target = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
    } catch {}
    await sleep(100);
  }
  assert.ok(target, 'Chromium page target unavailable');
  const socket = new WS(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  let seq = 0;
  const pending = new Map(), pendingRequests = new Map();
  const problems = { exceptions: [], console: [], network: [], writes: [], routing: [] };
  const documents = [];
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 20000);
      pending.set(id, { ok: v => { clearTimeout(timer); resolve(v); },
        bad: e => { clearTimeout(timer); reject(e); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function route(p) {
    const req = p.request || {};
    const action = decision(req.url || '', req.method || '', cfg.origin);
    if (action.block) {
      problems.writes.push({ method: req.method, path: safePath(req.url) });
      await send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' });
    } else if (action.scoped) {
      await send('Fetch.continueRequest', { requestId: p.requestId,
        headers: headerEntries(req.headers, cfg.token) });
    } else {
      // Explicitly remove inherited OIDC headers on cross-origin redirects.
      await send('Fetch.continueRequest', { requestId: p.requestId,
        headers: publicHeaders(req.headers) });
    }
  }
  socket.on('message', buffer => {
    let msg;
    try { msg = JSON.parse(buffer.toString()); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.bad(new Error('CDP response error (request details redacted)'));
      else p.ok(msg.result);
      return;
    }
    const p = msg.params || {};
    if (msg.method === 'Fetch.requestPaused') {
      void route(p).catch(async () => {
        problems.routing.push('Request interception failed');
        try { await send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' }); }
        catch {}
      });
    } else if (msg.method === 'Runtime.exceptionThrown') {
      problems.exceptions.push(String(p.exceptionDetails?.text || 'Uncaught JS exception').slice(0, 120));
    } else if (msg.method === 'Runtime.consoleAPICalled' && p.type === 'error') {
      problems.console.push('console.error recorded');
    } else if (msg.method === 'Network.requestWillBeSent') {
      pendingRequests.set(p.requestId, safePath(p.request?.url || ''));
    } else if (msg.method === 'Network.responseReceived') {
      const response = p.response || {}, url = safePath(response.url || '');
      if (url.startsWith(cfg.origin + '/')) {
        if (p.type === 'Document') documents.push({ status: response.status, url, requestId: p.requestId, finished: false });
        if (['Script', 'Stylesheet'].includes(p.type) && response.status >= 400)
          problems.network.push({ status: response.status, url });
      }
    } else if (msg.method === 'Network.loadingFinished') {
      for (const d of documents) if (d.requestId === p.requestId) d.finished = true;
    } else if (msg.method === 'Network.loadingFailed' && !p.canceled) {
      const url = pendingRequests.get(p.requestId);
      if (url && url.startsWith(cfg.origin + '/'))
        problems.network.push({ url, error: String(p.errorText || 'failed').slice(0, 100) });
    }
  });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error('Browser DOM evaluation failed');
    return result.result?.value;
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  return { socket, send, evaluate, problems, documents };
}
async function until(evaluate, expression, stage) {
  for (let i = 0; i < 140; i++) {
    if (await evaluate(expression)) return;
    await sleep(160);
  }
  throw new Error('Protected Preview browser timeout: ' + stage);
}
async function setField(cdp, selector, value) {
  const query = 'document.querySelector(' + JSON.stringify(selector) + ')';
  const focused = await cdp.evaluate('(() => {const e=' + query + ';if(!e)return false;' +
    'e.scrollIntoView({block:"center"});e.focus();return document.activeElement===e;})()');
  assert.equal(focused, true, 'Calculator field cannot receive keyboard focus');
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA',
    modifiers: 2, windowsVirtualKeyCode: 65 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA',
    modifiers: 2, windowsVirtualKeyCode: 65 });
  await cdp.send('Input.insertText', { text: value });
  await until(cdp.evaluate, query + '.value === ' + JSON.stringify(value), 'calculator field update');
}
async function inspect(cdp, cfg, article) {
  const path = '/wellness-hub/' + article.slug + '/';
  await cdp.send('Emulation.setDeviceMetricsOverride',
    { width: 390, height: 844, mobile: true, deviceScaleFactor: 1 });
  const nav = await cdp.send('Page.navigate', { url: cfg.origin + path });
  assert.ok(!nav.errorText, 'Navigation failed');
  await until(cdp.evaluate, 'document.readyState !== "loading" && location.origin === ' +
    JSON.stringify(cfg.origin) + ' && !!document.querySelector(".wh-embed astro-island")',
    'authenticated page and calculator embed');
  const rawResponse = await readRawDocumentHtml(cdp, cfg.origin, path);
  const publicCanonical = 'https://www.healthylifesstyles.com/wellness-hub/' + article.slug;
  const rawSeo = assertRawArticleHead(rawResponse, publicCanonical);
  console.log(JSON.stringify({ type: 'original-http-html-seo', article: article.slug,
    canonical: rawSeo.canonical, ogUrlConsistent: true, htmlMetaIndexable: true,
    rawResponseNotLogged: true }));
  // ToolEmbed.astro renders Calculator with client:visible. At 390x844, the
  // embedded calculator is often below the article introduction; hydration
  // cannot start until the island enters the actual Chromium viewport.
  const scrolled = await cdp.evaluate(viewportExposureExpression());
  assert.equal(scrolled, true, 'Calculator SSR content has no measurable box for viewport exposure');
  try {
    await until(cdp.evaluate, '(() => {const i=document.querySelector(".wh-embed astro-island");' +
      'return !!i && !i.hasAttribute("ssr") && !!document.querySelector(".wh-embed .calc__value");})()',
      'hydrated Astro island after client:visible viewport exposure');
  } catch (error) {
    const observed = await cdp.evaluate('(() => {const root=document.querySelector(".wh-embed");' +
      'const i=root?.querySelector("astro-island");const value=root?.querySelector(".calc__value");' +
      'const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();' +
      'return {width:Math.round(r.width),height:Math.round(r.height),' +
      'top:Math.round(r.top),bottom:Math.round(r.bottom)};};' +
      'return {present:!!i,ssr:i?.hasAttribute("ssr"),result:!!value,' +
      'rootRect:rect(root),islandRect:rect(i),resultRect:rect(value),' +
      'rootDisplay:root?getComputedStyle(root).display:null,' +
      'islandDisplay:i?getComputedStyle(i).display:null,' +
      'viewport:{innerWidth:innerWidth,innerHeight:innerHeight,' +
      'clientWidth:document.documentElement.clientWidth,' +
      'visualScale:visualViewport?.scale??null},' +
      'astroIslandRegistered:!!customElements.get("astro-island"),' +
      'readyState:document.readyState};})()');
    console.error(JSON.stringify({type:'safe-hydration-diagnostics',observed,
      consoleErrors:cdp.problems.console.length,
      firstPartyNetworkFailures:cdp.problems.network.length,
      blockedWrites:cdp.problems.writes.length}));
    throw error;
  }
  const data = await cdp.evaluate('(() => {const root=document.querySelector(".wh-embed");' +
    'const i=root?.querySelector("astro-island");return {' +
    'url:location.origin+location.pathname,h1:document.querySelector("h1")?.textContent?.trim(),' +
    'embedCount:document.querySelectorAll(".wh-embed").length,' +
    'embedTool:root?.getAttribute("data-tool"),' +
    'hydrated:!!i&&!i.hasAttribute("ssr"),' +
    'inputs:Array.from(root?.querySelectorAll("input")||[]).map(e=>({id:e.id,name:e.name})),' +
    'metrics:{innerWidth:innerWidth,innerHeight:innerHeight,' +
    'clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}' +
    '};})()');
  assert.ok(data.url.endsWith('/' + article.slug) || data.url.endsWith('/' + article.slug + '/'),
    'Unexpected redirect away from inspected article');
  assert.ok(data.h1 && data.hydrated && data.embedCount === 1, 'Article embed missing/duplicated');
  assert.equal(data.embedTool, article.tool, 'Wrong embedded calculator for article');
  assert.equal(data.metrics.innerWidth, 390, 'Wrong Chromium viewport width');
  assert.equal(data.metrics.innerHeight, 844, 'Wrong Chromium viewport height');
  assert.ok(data.metrics.clientWidth > 0 && data.metrics.clientWidth <= 390, 'Invalid client width');
  assert.ok(data.metrics.scrollWidth <= data.metrics.clientWidth + 1,
    'Horizontal overflow: ' + JSON.stringify(data.metrics));
  const expectedFieldId = 'calc-' + article.tool + '-' + article.field;
  const field = data.inputs.find(v => v.id === expectedFieldId);
  assert.ok(field?.id, 'Expected calculator field not found: ' + expectedFieldId);
  const selector = '#' + field.id.replace(/([^A-Za-z0-9_-])/g, '\\$1');
  await setField(cdp, selector, article.first);
  await sleep(900);
  const before = await cdp.evaluate('document.querySelector(".wh-embed .calc__value")?.textContent?.trim()');
  await setField(cdp, selector, article.second);
  await until(cdp.evaluate,
    '(() => {const v=document.querySelector(".wh-embed .calc__value")?.textContent?.trim();return v&&v!==' +
    JSON.stringify(before) + ';})()', 'calculator response to keyboard input');
  await sleep(900);
  const after = await cdp.evaluate('document.querySelector(".wh-embed .calc__value")?.textContent?.trim()');
  assert.ok(before && after && before !== after, 'Calculator failed to update');
  const share = await cdp.evaluate('(() => {const r=document.querySelector(".wh-embed");' +
    'const f=r?.querySelector("a[aria-label=\\"Share result on Facebook\\"]");' +
    'const x=r?.querySelector("a[aria-label=\\"Share result on X (Twitter)\\"]");' +
    'if(!f||!x)return false;return new URL(f.href).searchParams.get("u")===location.href' +
    '&&new URL(x.href).searchParams.get("text")?.includes(location.href)===true;})()');
  assert.equal(share, true, 'Result-share destinations do not reference this article');
  await sleep(300);
  for (const [name, list] of Object.entries(cdp.problems))
    assert.deepEqual(list, [], 'CDP ' + name + ' failures');
  assert.ok(cdp.documents.some(v => v.status === 200 &&
    (v.url.endsWith(path) || v.url.endsWith(path.replace(/\/$/, '')))),
    'Expected protected article did not return HTTP 200');
  console.log(JSON.stringify({ result: 'PASS', type: 'protected-preview-cdp',
    article: article.slug, embeddedTool: article.tool, checkedField: article.field,
    metrics: data.metrics,
    actualKeyboardResult: { from: article.first, to: article.second, before, after },
    hydrated: true, share: true, exceptions: 0, failedFirstPartyAssets: 0, mutationRequests: 0 }));
}
async function main() {
  const cfg = config(process.env);
  // Keep the short-lived OIDC token in this CDP controller only.
  // Chromium and its child processes must not inherit the token.
  delete process.env.VERCEL_OIDC_TOKEN;
  // GitHub's OIDC request bearer can mint fresh identity tokens. Never let
  // the Chromium subprocess inherit the issuer credential or its endpoint.
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const chromeLauncher = await import('chrome-launcher');
  const WS = (await import('ws')).default;
  console.log(JSON.stringify({ type: 'preview-cdp-start', origin: cfg.origin,
    expectedSha: cfg.sha, expectedDeploymentId: cfg.id,
    sourceShaIndependentlyVerifiedByRunner: false }));
  let chrome, cdp;
  try {
    chrome = await chromeLauncher.launch({ chromeFlags: [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-background-networking', '--disable-extensions',
    ] });
    cdp = await cdpConnect(chrome.port, cfg, WS);
    for (const article of CASES) await inspect(cdp, cfg, article);
    console.log(JSON.stringify({ result: 'PASS', type: 'all-protected-preview-articles',
      expectedSha: cfg.sha, expectedDeploymentId: cfg.id,
      requiresExternalVercelShaVerification: true }));
  } finally {
    if (cdp) cdp.socket.close();
    if (chrome) await chrome.kill();
  }
}
if (process.argv.includes('--self-test')) selfTest();
else await main();
