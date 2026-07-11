/**
 * D5 / SD3 CI guard — YMYL date integrity across the BUILT output.
 *
 * Fabricated editorial dates are the fingerprint of `new Date()` defaults at
 * build time: multiple items suddenly "published/modified" at the exact minute
 * the build ran. This guard runs immediately after `astro build` in CI and
 * HARD-FAILS when ≥2 distinct emitted dates fall within ±5 minutes of the
 * guard's own execution time.
 *
 * Scope (per D5): RSS <pubDate> + JSON-LD datePublished/dateModified in every
 * built HTML page. (Sitemap <lastmod> is a page-freshness hint, not an
 * editorial claim — tracked separately in the Phase-15 ledger.)
 *
 * Also validates the canonical feed's RSS structure (root/channel/item shape),
 * since no XML parser dependency is allowed (zero-new-deps law).
 *
 * Usage: node scripts/seo/date-integrity.ts   (exit 0 = pass, 1 = violation)
 */
import * as fs from 'fs';
import * as path from 'path';

const DIST = path.resolve(process.cwd(), 'dist', 'client');
const WINDOW_MS = 5 * 60 * 1000; // ±5min — the fabrication fingerprint window
const NOW = Date.now();

interface DatedItem {
  source: string; // file + field
  iso: string;
  ms: number;
}

const found: DatedItem[] = [];
const problems: string[] = [];

// ── 1. RSS feed: structure + pubDates ────────────────────────────────────────
const rssPath = path.join(DIST, 'rss.xml');
if (!fs.existsSync(rssPath)) {
  problems.push('rss.xml missing from build output — the canonical feed did not build.');
} else {
  const xml = fs.readFileSync(rssPath, 'utf-8');

  // Structural sanity (feed "validates as RSS"): root, channel, balanced items.
  if (!/^<\?xml[^>]*\?>\s*<rss[^>]*version="2\.0"/.test(xml)) problems.push('rss.xml: missing <?xml?> + <rss version="2.0"> root.');
  if (!/<channel>[\s\S]*<\/channel>/.test(xml)) problems.push('rss.xml: missing <channel> envelope.');
  const opens = (xml.match(/<item>/g) || []).length;
  const closes = (xml.match(/<\/item>/g) || []).length;
  if (opens !== closes) problems.push(`rss.xml: unbalanced <item> tags (${opens} open / ${closes} close).`);
  if (opens === 0) problems.push('rss.xml: zero <item> entries — feed is empty.');
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const body = m[1];
    if (!/<title>/.test(body) || !/<link>/.test(body)) problems.push('rss.xml: an <item> lacks <title> or <link>.');
    const link = body.match(/<link>([^<]+)<\/link>/)?.[1] || '';
    if (link && !/^https?:\/\//.test(link)) problems.push(`rss.xml: non-absolute <link>: ${link}`);
  }
  for (const m of xml.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)) {
    const ms = Date.parse(m[1]);
    if (Number.isFinite(ms)) found.push({ source: `rss.xml <pubDate>`, iso: m[1], ms });
  }
}

// ── 1b. Sitemap <lastmod> (D8): a modification-date claim like any other ────
// The old astro.config stamped BUILD_DATE on every URL — fabricated freshness.
// lastmod is now omitted entirely; if it ever returns, it must be a real
// per-page date, so build-time values here re-trip the fingerprint below.
for (const f of fs.existsSync(DIST) ? fs.readdirSync(DIST) : []) {
  if (!/^sitemap.*\.xml$/.test(f)) continue;
  const xml = fs.readFileSync(path.join(DIST, f), 'utf-8');
  for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    const ms = Date.parse(m[1]);
    if (Number.isFinite(ms)) found.push({ source: `${f} <lastmod>`, iso: m[1], ms });
  }
}

// ── 2. JSON-LD datePublished/dateModified in every built page ───────────────
function walkHtml(dir: string, cb: (p: string) => void): void {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(full, cb);
    else if (e.isFile() && e.name.endsWith('.html')) cb(full);
  }
}

function collectDates(node: unknown, file: string): void {
  if (Array.isArray(node)) return node.forEach((n) => collectDates(n, file));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if ((k === 'datePublished' || k === 'dateModified') && typeof v === 'string') {
        const ms = Date.parse(v);
        if (Number.isFinite(ms)) found.push({ source: `${file} ${k}`, iso: v, ms });
      } else {
        collectDates(v, file);
      }
    }
  }
}

walkHtml(DIST, (filePath) => {
  const rel = path.relative(DIST, filePath).replace(/\\/g, '/');
  const html = fs.readFileSync(filePath, 'utf-8');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      collectDates(JSON.parse(m[1]), rel);
    } catch {
      problems.push(`${rel}: unparseable JSON-LD block.`);
    }
  }
});

// ── 3. The fabrication fingerprint ───────────────────────────────────────────
const suspicious = found.filter((d) => Math.abs(d.ms - NOW) <= WINDOW_MS);
if (suspicious.length >= 2) {
  problems.push(
    `FABRICATION FINGERPRINT: ${suspicious.length} emitted dates within ±5min of the build:\n` +
      suspicious.slice(0, 10).map((s) => `    ${s.iso}  ← ${s.source}`).join('\n'),
  );
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`date-integrity: ${found.length} editorial dates scanned (rss pubDate + JSON-LD).`);
if (problems.length) {
  console.error('\nDATE-INTEGRITY VIOLATIONS (D5/SD3):');
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log('date-integrity: PASS — no fabricated dates, feed structure valid.');
