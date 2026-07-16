/**
 * P16 (Phases B/C/K) — metadata audit over the BUILT output (dist/client).
 *
 * BLOCKING (high-confidence defects only):
 *   - missing/empty <title>, meta description, or canonical on an indexable page
 *   - duplicate <title>/<link rel=canonical>/meta-description tags within a page
 *   - canonical collisions: two different indexable pages claiming one canonical
 *   - canonical pointing at a URL that is not this page (self-canonical policy;
 *     pagination pages self-canonicalize per Phase-E)
 *   - hreflang set present but non-reciprocal, or missing x-default, or target
 *     page absent from the build
 *
 * ADVISORY (warn-only — length is NOT a Google ranking rule; ranges are
 * editorial guidance): title ~30–60 chars, description ~120–160 chars,
 * cross-page duplicate titles/descriptions.
 *
 * noindex pages (404, /embed/*) are exempt from cross-page uniqueness and
 * description requirements — they are not indexable surfaces.
 *
 * Usage (after build): node scripts/seo/metadata-audit.ts   (exit 1 = blocking defect)
 */
import * as fs from 'fs';
import * as path from 'path';
import { walkHtmlFiles } from './lib/html-scan.ts';

const DIST = path.resolve(process.cwd(), 'dist', 'client');
const ORIGIN = 'https://www.healthylifesstyles.com';

// Advisory ranges — editorial guidance, deliberately configurable, never blocking.
const TITLE_RANGE = [30, 60] as const;
const DESC_RANGE = [120, 160] as const;

interface Page {
  route: string;
  title: string[];
  description: string[];
  canonical: string[];
  robots: string[];
  hreflang: { lang: string; href: string }[];
  noindex: boolean;
}

const pages: Page[] = [];

// Walking via the shared lib; this audit only reads page-level files.
const walk = (dir: string): void =>
  walkHtmlFiles(dir, parse, (n) => n === 'index.html' || n === '404.html');

function attrs(html: string, re: RegExp, group = 1): string[] {
  return [...html.matchAll(re)].map((m) => m[group].trim());
}

function parse(file: string): void {
  const html = fs.readFileSync(file, 'utf-8');
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  const route = '/' + rel.replace(/\/?index\.html$/, '').replace(/404\.html$/, '404');
  const robots = attrs(html, /<meta name="robots" content="([^"]*)"/g);
  pages.push({
    route: route === '/' ? '/' : route.replace(/\/$/, ''),
    title: attrs(html, /<title>([\s\S]*?)<\/title>/g),
    description: attrs(html, /<meta name="description" content="([^"]*)"/g),
    canonical: attrs(html, /<link rel="canonical" href="([^"]*)"/g),
    robots,
    noindex: robots.some((r) => /noindex/i.test(r)),
    hreflang: [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] })),
  });
}

walk(DIST);

const blocking: string[] = [];
const warnings: string[] = [];
const indexable = pages.filter((p) => !p.noindex);

// ── per-page structural checks ───────────────────────────────────────────────
for (const p of pages) {
  if (p.title.length === 0 || !p.title[0]) blocking.push(`${p.route}: missing/empty <title>`);
  if (p.title.length > 1) blocking.push(`${p.route}: ${p.title.length} <title> tags`);
  if (p.canonical.length > 1) blocking.push(`${p.route}: ${p.canonical.length} canonical tags`);
  if (p.description.length > 1) blocking.push(`${p.route}: ${p.description.length} meta descriptions`);
  if (p.robots.length > 1) blocking.push(`${p.route}: ${p.robots.length} robots metas`);
  if (p.noindex) continue; // non-indexable surfaces end here
  if (p.description.length === 0 || !p.description[0]) blocking.push(`${p.route}: indexable page missing meta description`);
  if (p.canonical.length === 0) blocking.push(`${p.route}: indexable page missing canonical`);
  // Self-canonical policy (Phase E: pagination self-canonicalizes too).
  const expected = p.route === '/' ? [ORIGIN, `${ORIGIN}/`] : [`${ORIGIN}${p.route}`];
  if (p.canonical[0] && !expected.includes(p.canonical[0])) {
    blocking.push(`${p.route}: canonical points elsewhere (${p.canonical[0]})`);
  }
  // Advisory lengths — guidance, not gospel.
  const t = p.title[0] ?? '';
  const d = p.description[0] ?? '';
  if (t && (t.length < TITLE_RANGE[0] || t.length > TITLE_RANGE[1])) warnings.push(`${p.route}: title ${t.length} chars (advisory ${TITLE_RANGE[0]}–${TITLE_RANGE[1]})`);
  if (d && (d.length < DESC_RANGE[0] || d.length > DESC_RANGE[1])) warnings.push(`${p.route}: description ${d.length} chars (advisory ${DESC_RANGE[0]}–${DESC_RANGE[1]})`);
}

// ── cross-page: canonical collisions + duplicate copy ────────────────────────
const byCanonical = new Map<string, string[]>();
const byTitle = new Map<string, string[]>();
const byDesc = new Map<string, string[]>();
for (const p of indexable) {
  if (p.canonical[0]) byCanonical.set(p.canonical[0], [...(byCanonical.get(p.canonical[0]) ?? []), p.route]);
  if (p.title[0]) byTitle.set(p.title[0], [...(byTitle.get(p.title[0]) ?? []), p.route]);
  if (p.description[0]) byDesc.set(p.description[0], [...(byDesc.get(p.description[0]) ?? []), p.route]);
}
for (const [c, routes] of byCanonical) if (routes.length > 1) blocking.push(`canonical collision: ${routes.length} pages claim ${c} (${routes.slice(0, 4).join(', ')})`);
for (const [t, routes] of byTitle) if (routes.length > 1) warnings.push(`duplicate title "${t.slice(0, 60)}" on ${routes.length} pages (${routes.slice(0, 3).join(', ')})`);
for (const [d, routes] of byDesc) if (routes.length > 1) warnings.push(`duplicate description on ${routes.length} pages (${routes.slice(0, 3).join(', ')})`);

// ── hreflang reciprocity + x-default (Phase-B rails; 0 sets today) ──────────
const routeSet = new Set(pages.map((p) => `${ORIGIN}${p.route === '/' ? '' : p.route}`));
let hreflangSets = 0;
for (const p of indexable) {
  if (p.hreflang.length === 0) continue;
  hreflangSets++;
  if (!p.hreflang.some((h) => h.lang === 'x-default')) blocking.push(`${p.route}: hreflang set lacks x-default`);
  for (const h of p.hreflang) {
    if (!routeSet.has(h.href.replace(/\/$/, ''))) {
      blocking.push(`${p.route}: hreflang ${h.lang} → ${h.href} not present in build output`);
      continue;
    }
    const targetRoute = h.href.replace(ORIGIN, '') || '/';
    const target = pages.find((q) => q.route === targetRoute);
    if (target && target.hreflang.length > 0 && !target.hreflang.some((b) => b.href.replace(/\/$/, '') === `${ORIGIN}${p.route === '/' ? '' : p.route}`)) {
      blocking.push(`${p.route}: non-reciprocal hreflang with ${targetRoute}`);
    }
  }
}

// ── report ───────────────────────────────────────────────────────────────────
console.log(`metadata-audit: ${pages.length} pages (${indexable.length} indexable), ${hreflangSets} hreflang sets.`);
if (warnings.length) {
  console.log(`\n${warnings.length} ADVISORY warning(s) (non-blocking):`);
  for (const w of warnings.slice(0, 25)) console.log('  ⚠ ' + w);
  if (warnings.length > 25) console.log(`  … and ${warnings.length - 25} more`);
}
if (blocking.length) {
  console.error(`\n${blocking.length} BLOCKING defect(s):`);
  for (const b of blocking) console.error('  ✗ ' + b);
  process.exit(1);
}
console.log('metadata-audit: PASS — no blocking metadata defects.');
