/**
 * rich-results-check.ts  (Phase 9, Priority 3)
 *
 *   node scripts/seo/rich-results-check.ts        # after `npm run build`
 *
 * Best-effort external structured-data validation for a SAMPLE of built pages.
 * Complements the structural `validate-jsonld.ts` (which is the hard gate) by
 * asking an external validator whether the JSON-LD is Rich-Results-eligible.
 *
 * NON-BLOCKING BY DESIGN — this MUST NOT strand the deploy pipeline:
 *   - Always exits 0. External problems are reported as warnings, never failures.
 *   - Per-request timeout + bounded retries with backoff.
 *   - If no validator is reachable / configured, it degrades to a clear
 *     "skipped" notice (never a false "pass").
 *
 * Config (all optional):
 *   RICH_RESULTS_VALIDATOR_URL  validator endpoint (default: schema.org validator)
 *   RICH_RESULTS_SAMPLE         comma-separated URL paths to check (default sample)
 *   RICH_RESULTS_TIMEOUT_MS     per-request timeout (default 15000)
 *   RICH_RESULTS_RETRIES        retries per URL (default 2)
 */
import * as fs from 'fs';
import * as path from 'path';

const DIST = path.resolve(process.cwd(), 'dist', 'client');
const VALIDATOR = process.env.RICH_RESULTS_VALIDATOR_URL || 'https://validator.schema.org/validate';
const TIMEOUT_MS = Number(process.env.RICH_RESULTS_TIMEOUT_MS || 15_000);
const RETRIES = Number(process.env.RICH_RESULTS_RETRIES || 2);
const SAMPLE = (process.env.RICH_RESULTS_SAMPLE ||
  '/,/tools/calorie-calculator,/wellness-hub/how-to-calculate-your-macros,/wellness-hub/what-is-an-anti-inflammatory-diet,/wellness-hub/how-many-calories-to-lose-weight'
).split(',').map((s) => s.trim()).filter(Boolean);

function warn(msg: string) { console.log(`  ⚠ ${msg}`); }

function htmlFor(urlPath: string): string | null {
  const rel = urlPath === '/' ? 'index.html' : `${urlPath.replace(/^\/|\/$/g, '')}/index.html`;
  const file = path.join(DIST, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
}

function extractJsonLd(html: string): string[] {
  const out: string[] = [];
  const re = /<script type="application\/ld\+json">(.*?)<\/script>/gis;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1].trim());
  return out;
}

async function postWithRetry(body: string): Promise<{ ok: boolean; errors: number; warnings: number; detail?: string }> {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(VALIDATOR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        if (res.status === 429 && attempt < RETRIES) { await sleep(1000 * (attempt + 1)); continue; }
        return { ok: false, errors: 0, warnings: 0, detail: `HTTP ${res.status}` };
      }
      const text = await res.text();
      // Defensive parse — validator response shapes vary; look for common keys.
      let errors = 0, warnings = 0;
      try {
        const j = JSON.parse(text) as Record<string, unknown>;
        errors = countIssues(j, /error/i);
        warnings = countIssues(j, /warning/i);
      } catch {
        // Unparseable response — the endpoint isn't a validator we understand.
        // Report as unavailable (not a false "0 errors") — still non-blocking.
        return { ok: false, errors: 0, warnings: 0, detail: 'unrecognised validator response' };
      }
      return { ok: true, errors, warnings };
    } catch (err) {
      clearTimeout(timer);
      if (attempt < RETRIES) { await sleep(1000 * (attempt + 1)); continue; }
      return { ok: false, errors: 0, warnings: 0, detail: (err as Error).name === 'AbortError' ? 'timeout' : (err as Error).message.slice(0, 60) };
    }
  }
  return { ok: false, errors: 0, warnings: 0, detail: 'exhausted retries' };
}

function countIssues(obj: unknown, rx: RegExp): number {
  // Walk the response and count numeric fields / array lengths under error/warning-ish keys.
  let n = 0;
  const walk = (v: unknown, keyMatched: boolean) => {
    if (Array.isArray(v)) { if (keyMatched) n += v.length; v.forEach((x) => walk(x, keyMatched)); return; }
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        const km = rx.test(k);
        if (km && typeof val === 'number') n += val;
        walk(val, km);
      }
    }
  };
  walk(obj, false);
  return n;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('Rich Results Check (non-blocking)');
  console.log('=================================');
  if (!fs.existsSync(DIST)) {
    warn(`dist/client not found — run "npm run build" first. Skipping (non-blocking).`);
    process.exit(0);
  }
  console.log(`Validator: ${VALIDATOR}`);
  let checked = 0, totalErrors = 0, totalWarnings = 0, unreachable = 0;

  for (const urlPath of SAMPLE) {
    const html = htmlFor(urlPath);
    if (!html) { warn(`${urlPath}: no built HTML — skipped`); continue; }
    const blocks = extractJsonLd(html);
    if (blocks.length === 0) { warn(`${urlPath}: no JSON-LD — skipped`); continue; }
    const body = JSON.stringify({ url: urlPath, jsonld: blocks });
    const r = await postWithRetry(body);
    checked++;
    if (!r.ok) { unreachable++; warn(`${urlPath}: validator unavailable (${r.detail}) — non-blocking`); continue; }
    totalErrors += r.errors; totalWarnings += r.warnings;
    const suffix = r.detail ? ` [${r.detail}]` : '';
    console.log(`  ${r.errors === 0 ? '✓' : '✗'} ${urlPath}: ${r.errors} error(s), ${r.warnings} warning(s)${suffix}`);
  }

  console.log('\n---');
  if (unreachable === checked && checked > 0) {
    console.log(`SKIPPED: external validator unreachable for all ${checked} sampled page(s). Non-blocking — deploy proceeds.`);
  } else {
    console.log(`Sampled ${checked} page(s): ${totalErrors} error(s), ${totalWarnings} warning(s). Non-blocking — informational only.`);
    if (totalErrors > 0) console.log('NOTE: review the errors above; they do NOT block the deploy (structural gate is validate-jsonld.ts).');
  }
  process.exit(0); // ALWAYS non-blocking
}

main().catch((err) => {
  console.log(`  ⚠ rich-results-check crashed (${(err as Error).message.slice(0, 80)}) — non-blocking, deploy proceeds.`);
  process.exit(0);
});
