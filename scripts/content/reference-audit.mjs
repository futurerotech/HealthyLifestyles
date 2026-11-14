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

export const isChallenge = (status, title = '') => status === 203 || /checking your browser|cookies must be enabled|just a moment|attention required|recaptcha|access denied/i.test(title);

/** NCBI record behind a PubMed, PMC or Bookshelf URL, if any. */
export function ncbiId(url) {
  const u = new URL(url);
  let m;
  if (/pubmed\.ncbi\.nlm\.nih\.gov$/.test(u.hostname) && (m = u.pathname.match(/^\/(\d+)/))) return { db: 'pubmed', id: m[1] };
  if ((m = u.pathname.match(/\/PMC(\d+)/i))) return { db: 'pmc', id: m[1] };
  if ((m = u.pathname.match(/\/books\/(NBK\d+)/i))) return { db: 'books', accession: m[1] };
  return null;
}

export function classify({ url, finalUrl, status, error, title, metaTitle, label, kind }) {
  const u = new URL(finalUrl || url);
  if (isSearchLink(new URL(url))) return 'search-link';
  if (metaTitle) {
    const m = titleMatch(label, metaTitle);
    return m !== null && m < 0.3 ? (kind === 'inline' ? 'review' : 'mismatch') : 'ok';
  }
  if (isChallenge(status, title)) return 'access';
  if (error && /ENOTFOUND|EAI_AGAIN|certificate|ECONNREFUSED/i.test(error)) return 'dead';
  if (status === 404 || status === 410) return 'dead';
  if (error || status === 401 || status === 403 || status === 429 || status >= 500) return 'access';
  if (status >= 400) return 'dead';
  if (isGeneric(u) && !isGeneric(new URL(url))) return 'redirected-to-homepage';
  if (isGeneric(u)) return 'generic';
  const m = titleMatch(label, title);
  if (m !== null && m < 0.3) return kind === 'inline' ? 'review' : 'mismatch';
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
  const ref = ncbiId(out.finalUrl || url) || ncbiId(url);
  if (ref) {
    // PubMed, PMC and Bookshelf block automated page views; NCBI's E-utilities
    // API is the sanctioned way to read the record's title.
    try {
      const eu = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
      let id = ref.id;
      if (ref.accession) {
        const s = await (await fetch(`${eu}/esearch.fcgi?db=books&retmode=json&term=${ref.accession}`, { signal: AbortSignal.timeout(20000) })).json();
        id = s.esearchresult?.idlist?.[0];
      }
      if (id) {
        const j = await (await fetch(`${eu}/esummary.fcgi?db=${ref.db}&retmode=json&id=${id}`, { signal: AbortSignal.timeout(20000) })).json();
        const rec = j.result?.[id];
        out.metaTitle = [rec?.title, rec?.booktitle, rec?.chaptertitle].filter(Boolean).join(' | ') || undefined;
        out.metaSource = `${ref.db}:${id}`;
      }
    } catch (e) { out.metaError = String(e.name || e.message); }
    await new Promise((r) => setTimeout(r, 400)); // E-utilities: max 3 requests/s without a key
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
  const ncbi = urls.filter((u) => ncbiId(u)), other = urls.filter((u) => !ncbiId(u));
  for (const u of ncbi) byUrl.set(u, await check(u));
  for (let i = 0; i < other.length; i += 6) {
    const batch = await Promise.all(other.slice(i, i + 6).map(check));
    for (const r of batch) byUrl.set(r.url, r);
  }
  const results = rows.map((row) => { const r = byUrl.get(row.url); return { ...row, ...r, label: row.label, verdict: classify({ ...r, label: row.label, kind: row.kind }) }; });
  const counts = results.reduce((a, r) => ({ ...a, [r.verdict]: (a[r.verdict] || 0) + 1 }), {});
  await writeFile('reference-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), cmsOrigin: ORIGIN, articles: docs.length, citations: results.length, uniqueUrls: urls.length, counts, results }, null, 2));
  console.log(JSON.stringify({ articles: docs.length, citations: results.length, uniqueUrls: urls.length, counts }));
  for (const r of results.filter((x) => x.verdict !== 'ok')) console.log(`[REF] ${r.verdict} | ${r.slug} | ${r.kind} | ${r.label.slice(0, 90)} | ${r.url} -> ${r.status ?? r.error} ${r.finalUrl && r.finalUrl !== r.url ? r.finalUrl : ''} | ${(r.metaTitle || r.title || '').slice(0, 140)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
