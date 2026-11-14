// Phase 3 §7.4 reference integrity audit (read-only).
//
// For every published article, collect each cited source (doc.sources) and
// each external inline link, fetch it, and check that the destination is the
// cited work, not merely that it returns HTTP 200. Writes reference-audit.json.
// Access failures (403/429/5xx/timeouts) are recorded as temporary and are
// never counted as defects.
import { writeFile } from 'node:fs/promises';
import { readPublishedCollection } from './inventory.mjs';

const ORIGIN = process.env.CMS_ORIGIN || 'https://cms.healthylifesstyles.com';
const SITE = 'healthylifesstyles.com';
const STOP = new Set('the and for with from that this your what does how into about their than when which have will are was were been being guide fact sheet page health topic topics overview update updates national institute institutes center centers american association society journal review systematic meta analysis study'
  .split(' '));

export const tokens = (s = '') => [...new Set(String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)
  .filter((w) => w.length >= 4 && !STOP.has(w)))];

/** Share of the cited label's meaningful words that appear in the destination's title text. */
export function titleMatch(label, pageTitle) {
  const want = tokens(label), have = new Set(tokens(pageTitle));
  if (!want.length || !have.size) return null;
  return want.filter((w) => have.has(w)).length / want.length;
}

export const isSearchLink = (u) => /[?&](term|q|query|search)=/i.test(u.search) || /\/(search|results)(\/|$)/i.test(u.pathname);
export const isGeneric = (u) => u.pathname.replace(/\/+$/, '') === '' ;

export function classify({ url, finalUrl, status, error, title, label }) {
  const u = new URL(finalUrl || url);
  if (isSearchLink(new URL(url))) return 'search-link';
  if (error && /ENOTFOUND|EAI_AGAIN|certificate|ECONNREFUSED/i.test(error)) return 'dead';
  if (status === 404 || status === 410) return 'dead';
  if (error || status === 401 || status === 403 || status === 429 || status >= 500) return 'access';
  if (status >= 400) return 'dead';
  if (isGeneric(u) && !isGeneric(new URL(url))) return 'redirected-to-homepage';
  if (isGeneric(u)) return 'generic';
  const m = titleMatch(label, title);
  if (m !== null && m < 0.3) return 'mismatch';
  return 'ok';
}

function pageTitle(html) {
  const meta = (name) => html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)`, 'i'))?.[1];
  return [meta('citation_title'), meta('og:title'), meta('dc.title'), html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]]
    .filter(Boolean).map((s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim()).join(' | ');
}

async function check(url) {
  const out = { url };
  for (const method of ['GET']) {
    try {
      const r = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(20000),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; HealthyLifeStyles-reference-audit/1.0; +https://www.healthylifesstyles.com)', accept: 'text/html,application/pdf;q=0.9,*/*;q=0.8' } });
      out.status = r.status; out.finalUrl = r.url;
      out.contentType = r.headers.get('content-type') || '';
      if (/html/i.test(out.contentType)) out.title = pageTitle((await r.text()).slice(0, 400000));
      else await r.body?.cancel();
    } catch (e) { out.error = String(e.cause?.code || e.name || e.message); }
  }
  return out;
}

const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g;
function citations(doc) {
  const items = [];
  for (const s of doc.sources || []) if (s?.url) items.push({ kind: 'source', label: s.label || s.title || '', url: s.url });
  const texts = [];
  const walk = (v) => { if (typeof v === 'string') texts.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(doc.layout); walk(doc.faq);
  for (const t of texts) for (const m of t.matchAll(linkRe)) if (/^https?:/i.test(m[2]) && !m[2].includes(SITE)) items.push({ kind: 'inline', label: m[1], url: m[2] });
  return items;
}

async function main() {
  const docs = await readPublishedCollection(ORIGIN, 'articles');
  const byUrl = new Map();
  const rows = [];
  for (const doc of docs) for (const c of citations(doc)) {
    rows.push({ id: doc.id, slug: doc.slug, ...c });
    if (!byUrl.has(c.url)) byUrl.set(c.url, null);
  }
  const urls = [...byUrl.keys()];
  for (let i = 0; i < urls.length; i += 6) {
    const batch = await Promise.all(urls.slice(i, i + 6).map(check));
    for (const r of batch) byUrl.set(r.url, r);
  }
  const results = rows.map((row) => { const r = byUrl.get(row.url); return { ...row, ...r, label: row.label, verdict: classify({ ...r, label: row.label }) }; });
  const counts = results.reduce((a, r) => ({ ...a, [r.verdict]: (a[r.verdict] || 0) + 1 }), {});
  await writeFile('reference-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), cmsOrigin: ORIGIN, articles: docs.length, citations: results.length, uniqueUrls: urls.length, counts, results }, null, 2));
  console.log(JSON.stringify({ articles: docs.length, citations: results.length, uniqueUrls: urls.length, counts }));
  for (const r of results.filter((x) => x.verdict !== 'ok')) console.log(`[REF] ${r.verdict} | ${r.slug} | ${r.kind} | ${r.label.slice(0, 90)} | ${r.url} -> ${r.status ?? r.error} ${r.finalUrl && r.finalUrl !== r.url ? r.finalUrl : ''} | ${(r.title || '').slice(0, 120)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
