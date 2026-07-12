/**
 * P16-G — evidence-based HTML/DOM/hydration budgets (regression gate).
 *
 * Measured baseline (2026-07-12, feat/phase-16 audit):
 *   /tools            → 197,171 B raw · 27,138 B gzip · 1,722 DOM tags · 0 islands
 *   heaviest article  → ~119 KB raw   · (well under article budget below)
 *
 * The raw-vs-gzip gap is repeated inline SVG icons + card markup, which gzip
 * collapses ~7:1 — measured evidence that a refactor is NOT currently
 * justified. These budgets exist to catch REGRESSIONS (accidental hydration
 * of the tools grid, serialized Payload dumps, unbounded DOM growth), with
 * ~30–40% headroom over baseline so normal content growth doesn't false-fail.
 *
 * Usage (after build): node scripts/seo/size-budget.ts   (exit 1 = budget exceeded)
 */
import * as fs from 'fs';
import * as path from 'path';
import { gzipSync } from 'zlib';

const DIST = path.resolve(process.cwd(), 'dist', 'client');

interface Budget {
  page: string; // route-relative index.html
  maxGzipBytes: number;
  maxDomTags: number;
  maxIslands: number;
}

const BUDGETS: Budget[] = [
  // tools index: baseline 27.1 KB gz / 1722 tags / 0 islands
  { page: 'tools/index.html', maxGzipBytes: 40_000, maxDomTags: 2_500, maxIslands: 0 },
  // home: navigational hub — keep lean
  { page: 'index.html', maxGzipBytes: 40_000, maxDomTags: 2_500, maxIslands: 4 },
  // representative article (heaviest at baseline)
  { page: 'wellness-hub/how-to-calculate-your-macros/index.html', maxGzipBytes: 45_000, maxDomTags: 3_000, maxIslands: 4 },
];

const failures: string[] = [];

for (const b of BUDGETS) {
  const file = path.join(DIST, b.page);
  if (!fs.existsSync(file)) {
    failures.push(`${b.page}: missing from build output (budgeted page must exist)`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf-8');
  const gz = gzipSync(html).length;
  const tags = (html.match(/<[a-z]/g) || []).length;
  const islands = (html.match(/<astro-island/g) || []).length;
  const line = `${b.page}: gzip=${gz}B (max ${b.maxGzipBytes}) tags=${tags} (max ${b.maxDomTags}) islands=${islands} (max ${b.maxIslands})`;
  console.log('  ' + line);
  if (gz > b.maxGzipBytes) failures.push(`${b.page}: gzip ${gz}B exceeds budget ${b.maxGzipBytes}B`);
  if (tags > b.maxDomTags) failures.push(`${b.page}: ${tags} DOM tags exceed budget ${b.maxDomTags}`);
  if (islands > b.maxIslands) failures.push(`${b.page}: ${islands} hydration islands exceed budget ${b.maxIslands}`);
}

if (failures.length) {
  console.error(`\nsize-budget: FAIL — ${failures.length} budget violation(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('size-budget: PASS — all pages within evidence-based budgets.');
