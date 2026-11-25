// Shared real-browser harness: offline Astro dev server + system Chrome over
// the DevTools protocol. No deployed preview, CMS access or new dependency.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

export const host = '127.0.0.1';
export const delay = (ms) => new Promise((ok) => setTimeout(ok, ms));
export const freePort = () => new Promise((ok, fail) => {
  const s = createServer(); s.on('error', fail);
  s.listen(0, host, () => { const n = s.address().port; s.close(() => ok(n)); });
});
export async function until(fn, label, timeout = 30000) {
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
  const ready = new Promise((ok, fail) => { ws.addEventListener('open', ok, { once: true }); ws.addEventListener('error', fail, { once: true }); });
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
      return new Promise((ok, fail) => { inflight.set(id, { ok, fail }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
    },
    close() { ws.close(); },
  };
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };

/** Minimal static server for a built site (dir/index.html and dir.html resolution, 404.html). */
export function serveStatic(root, port) {
  const base = resolve(root);
  const file = async (p) => { try { return (await stat(p)).isFile() ? p : null; } catch { return null; } };
  const server = createHttpServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const target = resolve(base, '.' + path);
    if (target !== base && !target.startsWith(base + sep)) { res.writeHead(403).end(); return; }
    const hit = await file(target) || await file(join(target, 'index.html')) || await file(target.replace(/\/$/, '') + '.html');
    if (!hit) { const nf = await file(join(base, '404.html')); res.writeHead(404, { 'content-type': TYPES['.html'] }).end(nf ? await readFile(nf) : 'Not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(hit)] || 'application/octet-stream' }).end(await readFile(hit));
  });
  return new Promise((ok) => server.listen(port, host, () => ok(server)));
}

/**
 * Starts headless Chrome plus either offline Astro (CMS disabled) or, with staticDir,
 * a static server over a production build. Returns page helpers and stop().
 */
export async function startBrowserSession({ probePath = '/', tag = 'BROWSER_QA', staticDir } = {}) {
  const port = await freePort();
  const profile = mkdtempSync(join(tmpdir(), 'hls-qa-'));
  const log = []; let astro, chrome, cdp, httpServer;
  const stop = async () => {
    try { cdp?.close(); } catch {}
    if (chrome && chrome.exitCode === null) chrome.kill('SIGKILL');
    if (astro && astro.exitCode === null) { try { process.kill(-astro.pid, 'SIGKILL'); } catch { astro.kill('SIGKILL'); } }
    if (httpServer) await new Promise((ok) => httpServer.close(ok));
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  };
  try {
    if (staticDir) httpServer = await serveStatic(staticDir, port);
    else {
      astro = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', String(port)], {
        env: { ...process.env, CMS_DISABLE: '1', CMS_URL: 'http://127.0.0.1:9', INDEXNOW_DISABLE: 'true', VERCEL_ENV: 'development' },
        stdio: ['ignore', 'pipe', 'pipe'], detached: true,
      });
      for (const s of [astro.stdout, astro.stderr]) s.on('data', (d) => { log.push(String(d)); if (log.length > 40) log.shift(); });
    }
    const origin = 'http://' + host + ':' + port;
    await until(async () => { if (astro && astro.exitCode !== null) throw Error('Astro exited ' + astro.exitCode); return (await fetch(origin + probePath)).ok; }, 'site response', 90000);
    let info = null;
    for (let attempt = 1; attempt <= 2 && !info; attempt++) {
      const debugPort = await freePort();
      chrome = spawn(findChrome(), ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run',
        '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=' + debugPort,
        '--user-data-dir=' + join(profile, 'attempt-' + attempt), 'about:blank'], { stdio: 'ignore' });
      try {
        info = await until(async () => { if (chrome.exitCode !== null) throw Error('Chrome exited ' + chrome.exitCode); const r = await fetch('http://' + host + ':' + debugPort + '/json/version'); return r.ok ? r.json() : null; }, 'Chrome remote debugger', 60000);
      } catch (e) {
        if (attempt === 2) throw e;
        console.log(`[${tag}] Chrome debugger not ready on attempt 1 (${e}); relaunching once`);
        chrome.kill('SIGKILL');
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
    const exceptions = [], consoleErrors = [];
    cdp.on((msg) => {
      if (msg.method === 'Runtime.exceptionThrown') exceptions.push(String(msg.params?.exceptionDetails?.exception?.description ?? msg.params?.exceptionDetails?.text).slice(0, 200));
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') consoleErrors.push((msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 240));
      if (msg.method === 'Log.entryAdded' && msg.params?.entry?.level === 'error') consoleErrors.push(String(msg.params.entry.text + ' ' + (msg.params.entry.url || '')).slice(0, 240));
    });
    await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
    const viewport = (width, height, mobile) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    return { origin, send, js, viewport, exceptions, consoleErrors, stop, log };
  } catch (e) {
    await stop();
    throw Error(String(e) + '\n' + log.join('').slice(-1500));
  }
}
