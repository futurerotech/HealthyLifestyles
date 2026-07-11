/**
 * P15-P6 — Empty-Shell Detector (BLOCKING).
 *
 * Walks the built output for locale-prefixed pages (/es/…, /ar/…) and fails
 * the build when a target-locale page (a) is empty/placeholder, or (b)
 * reproduces the meaningful content of its English counterpart (an untranslated
 * shell). Language-neutral routes (e.g. calculators) may be allowlisted WITH a
 * written justification — they are then exempt from the "reproduces English"
 * check but must still be non-empty.
 *
 * Usage (after `astro build`): node scripts/seo/empty-shell-detector.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { assessShell } from './lib/empty-shell.ts';

const DIST = path.resolve(process.cwd(), 'dist', 'client');
const NON_DEFAULT_LOCALES = ['es', 'ar'];

/**
 * Routes intentionally language-neutral (mostly UI/numbers), exempt from the
 * "reproduces-English" check ONLY. Each entry REQUIRES a justification.
 * Empty today — no localized calculators exist yet.
 */
const ALLOWLIST: { route: string; reason: string }[] = [
  // { route: '/tools/bmi-calculator', reason: 'Calculator UI is numeric; labels localized via islands.' },
];
const isAllowlisted = (route: string) => ALLOWLIST.some((a) => a.route === route);

function walkHtml(dir: string, cb: (p: string) => void): void {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(full, cb);
    else if (e.isFile() && e.name === 'index.html') cb(full);
  }
}

interface Failure { locale: string; route: string; reason: string }

const failures: Failure[] = [];
let localizedPages = 0;

walkHtml(DIST, (filePath) => {
  const route = '/' + path.relative(DIST, filePath).replace(/\\/g, '/').replace(/\/?index\.html$/, '');
  const seg = route.split('/')[1];
  if (!NON_DEFAULT_LOCALES.includes(seg)) return; // English pages are the baseline
  localizedPages++;

  const localeRoute = route; // e.g. /es/wellness-hub/x
  const enRoute = route.replace(new RegExp(`^/${seg}`), '') || '/';
  const enFile = path.join(DIST, enRoute.replace(/^\//, ''), 'index.html');

  const localizedHtml = fs.readFileSync(filePath, 'utf-8');
  const defaultHtml = fs.existsSync(enFile) ? fs.readFileSync(enFile, 'utf-8') : null;

  const verdict = assessShell(localizedHtml, defaultHtml);
  if (!verdict.isShell) return;

  // Allowlisted routes may legitimately mirror English content — but never be empty.
  if (verdict.reason === 'reproduces-default-locale' && isAllowlisted(enRoute)) return;

  failures.push({
    locale: seg,
    route: localeRoute,
    reason:
      verdict.reason === 'placeholder-or-empty'
        ? `empty/placeholder localized content (${verdict.chars} meaningful chars)`
        : `reproduces the English page at ${enRoute} verbatim (untranslated shell)`,
  });
});

console.log(`empty-shell-detector: ${localizedPages} localized page(s) scanned, ${failures.length} shell(s).`);
if (failures.length) {
  console.error('\nEMPTY-SHELL VIOLATIONS (P6 — YMYL/spam risk):');
  for (const f of failures) console.error(`  ✗ [${f.locale}] ${f.route} — ${f.reason}`);
  process.exit(1);
}
// A PASS is only meaningful over real pages. With zero localized production
// pages the detector has verified nothing — report NOT APPLICABLE (still
// exit 0, non-blocking) so a green build never masks "the check ran on air".
if (localizedPages === 0) {
  console.log('empty-shell-detector: NOT APPLICABLE — 0 localized production pages exist (no translations yet).');
} else {
  console.log(`empty-shell-detector: PASS — ${localizedPages} localized page(s), no untranslated or placeholder content.`);
}
