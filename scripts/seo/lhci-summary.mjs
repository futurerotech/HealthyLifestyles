// Reporting only: summarize Lighthouse CI results already collected in .lighthouseci/.
// Prints per-URL samples (LCP, TBT, CLS), the LCP element and its phases, and the
// heaviest scripts, so budget failures can be triaged with evidence. It never
// changes the blocking assertions in lighthouserc.json and always exits 0.
import { readdir, readFile } from 'node:fs/promises';

const dir = '.lighthouseci';
let files = [];
try { files = (await readdir(dir)).filter((f) => /^lhr-.*\.json$/.test(f)); } catch { console.log('[LHCI_SUMMARY] no results'); process.exit(0); }
const byUrl = new Map();
for (const f of files) {
  const lhr = JSON.parse(await readFile(`${dir}/${f}`, 'utf8'));
  const url = new URL(lhr.requestedUrl || lhr.finalUrl).pathname;
  const a = lhr.audits;
  // The LCP element and its phases moved between Lighthouse versions (classic audit vs
  // "insight" audits), so search every LCP-related audit for them.
  const find = (v, pred, out = []) => { if (v && typeof v === 'object') { if (pred(v)) out.push(v); for (const x of Object.values(v)) find(x, pred, out); } return out; };
  const lcpAudits = Object.entries(a).filter(([id]) => /lcp|largest-contentful/.test(id)).map(([, v]) => v.details);
  const node = find(lcpAudits, (v) => v.type === 'node' || (v.nodeLabel && v.snippet))[0];
  const phases = [...new Map(find(lcpAudits, (v) => (v.phase || v.subpart || v.label) && typeof (v.timing ?? v.duration) === 'number')
    .map((p) => [p.phase || p.subpart || p.label, Math.round(p.timing ?? p.duration)])).entries()].map(([k, t]) => `${k}=${t}`).join(' ');
  const scripts = (a['bootup-time']?.details?.items || []).slice(0, 3).map((s) => `${String(s.url).split('/').pop()}:${Math.round(s.total)}ms`).join(' ');
  const jsBytes = (a['network-requests']?.details?.items || []).filter((r) => r.resourceType === 'Script').reduce((n, r) => n + (r.transferSize || 0), 0);
  (byUrl.get(url) || byUrl.set(url, []).get(url)).push({
    lcp: Math.round(a['largest-contentful-paint'].numericValue), fcp: Math.round(a['first-contentful-paint'].numericValue),
    tbt: Math.round(a['total-blocking-time'].numericValue), cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
    el: node ? `${node.nodeLabel?.slice(0, 50)} <${node.snippet?.slice(1, 60)}` : '?', phases, scripts, jsKB: Math.round(jsBytes / 1024),
  });
}
for (const [url, runs] of [...byUrl].sort()) {
  const lcps = runs.map((r) => r.lcp).sort((x, y) => x - y);
  console.log(`[LHCI_SUMMARY] ${url} LCP samples=${lcps.join('/')} median=${lcps[Math.floor(lcps.length / 2)]} | FCP=${runs.map((r) => r.fcp).join('/')} TBT=${runs.map((r) => r.tbt).join('/')} CLS=${runs.map((r) => r.cls).join('/')} JS=${runs[0].jsKB}KB`);
  console.log(`[LHCI_SUMMARY]   LCP element: ${runs[0].el} | phases: ${runs.map((r) => r.phases).join(' ; ')} | bootup: ${runs[0].scripts}`);
}
