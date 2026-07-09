/**
 * schemarama-proxy.mjs — self-hosted Rich Results validator proxy (STUB).
 * Phase 10 · P3. See docs/rich-results-validator.md for the architecture.
 *
 *   node scripts/seo/validators/schemarama-proxy.mjs   # PORT=8788 by default
 *
 * Contract (what scripts/seo/rich-results-check.ts sends/expects):
 *   POST /validate  { url: string, jsonld: string[] }
 *     → 200 { errors: number, warnings: number, details?: unknown[] }
 *   GET  /healthz   → 200 "ok"
 *
 * HONEST-STUB DESIGN: /validate returns 501 until real validation is wired.
 * The CI checker treats non-200 as "validator unavailable" (a non-blocking
 * skip) — so pointing RICH_RESULTS_VALIDATOR_URL here prematurely can never
 * produce a false "0 errors" pass. Dependency-free on purpose; add schemarama
 * only when implementing for real.
 *
 * TODO(P3 activation): wire google/schemarama validation here —
 *   1. npm i schemarama (adds ShEx/SHACL validation with Google's shapes)
 *   2. parse each block in body.jsonld, run the Google Rich Results profile
 *   3. respond 200 with { errors, warnings, details } per the contract above
 */
import http from 'node:http';

const PORT = Number(process.env.PORT || 8788);
const MAX_BODY = 1_000_000; // 1MB — JSON-LD payloads are small

const server = http.createServer((req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (req.method === 'POST' && req.url === '/validate') {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { send(413, { error: 'payload too large' }); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        if (!Array.isArray(body?.jsonld)) { send(400, { error: 'expected { url, jsonld: string[] }' }); return; }
      } catch {
        send(400, { error: 'invalid JSON body' });
        return;
      }
      // STUB: real schemarama validation goes here (see TODO in the header).
      send(501, { error: 'not implemented — wire schemarama validation (docs/rich-results-validator.md)' });
    });
    return;
  }

  send(404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`schemarama-proxy (STUB) listening on :${PORT} — /validate returns 501 until implemented`);
});
