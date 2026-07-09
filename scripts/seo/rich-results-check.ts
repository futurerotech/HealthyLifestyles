/**
 * rich-results-check.ts  (Phase 12 — delegates to the sandboxed SHACL validator)
 *
 *   node scripts/seo/rich-results-check.ts        # after `npm run build`
 *
 * Samples built pages, extracts their JSON-LD, and validates each page by
 * SPAWNING scripts/seo/validate-shacl.ts as an isolated child process
 * (never an in-process import): hard timeout, capped heap
 * (--max-old-space-size=256), vendored SHA-256-pinned shapes — zero network.
 *
 * NON-BLOCKING BY DESIGN — this MUST NOT strand the deploy pipeline:
 *   - Always exits 0. The hard structured-data gate remains validate-jsonld.ts.
 *   - Graceful degradation is law: on crash, timeout, OOM, tampered shapes,
 *     malformed output, or a missing validator file, each affected page logs a
 *     structured { degraded: true, reason } warning, contributes an empty
 *     { errors: [], warnings: [] } result, and the run still exits 0.
 *
 * Config (env, all optional):
 *   RICH_RESULTS_SAMPLE      comma-separated URL paths (default sample below)
 *   RICH_RESULTS_TIMEOUT_MS  per-page validator timeout (default 30000)
 *   VALIDATOR_PATH           validator script override (degradation testing)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

const DIST = path.resolve(process.cwd(), 'dist', 'client');
const VALIDATOR = path.resolve(process.env.VALIDATOR_PATH || path.join(process.cwd(), 'scripts', 'seo', 'validate-shacl.ts'));
const TIMEOUT_MS = Number(process.env.RICH_RESULTS_TIMEOUT_MS || 30_000);
const SAMPLE = (process.env.RICH_RESULTS_SAMPLE ||
  '/,/tools/calorie-calculator,/wellness-hub/how-to-calculate-your-macros,/wellness-hub/what-is-an-anti-inflammatory-diet,/wellness-hub/how-many-calories-to-lose-weight'
).split(',').map((s) => s.trim()).filter(Boolean);

interface Contract { errors: unknown[]; warnings: unknown[] }
type PageResult = { ok: true; result: Contract } | { ok: false; reason: string };

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

/** Spawn the sandboxed validator for one page's blocks. Never throws. */
function runValidator(blocks: string[]): Promise<PageResult> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: PageResult) => { if (!settled) { settled = true; resolve(r); } };
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(process.execPath, ['--max-old-space-size=256', VALIDATOR, '-'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });
    } catch (err) {
      done({ ok: false, reason: `spawn failed: ${(err as Error).message.slice(0, 80)}` });
      return;
    }

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      done({ ok: false, reason: `timeout after ${TIMEOUT_MS}ms (validator killed)` });
    }, TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timer);
      done({ ok: false, reason: `spawn error: ${err.message.slice(0, 80)}` });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const hint = (stderr.trim().split('\n').pop() || '').slice(0, 100);
        done({ ok: false, reason: `validator exited ${code}${hint ? ` — ${hint}` : ''}` });
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { errors?: unknown[]; warnings?: unknown[] };
        if (!Array.isArray(parsed.errors) || !Array.isArray(parsed.warnings)) {
          done({ ok: false, reason: 'malformed validator output (missing errors/warnings arrays)' });
          return;
        }
        done({ ok: true, result: { errors: parsed.errors, warnings: parsed.warnings } });
      } catch {
        done({ ok: false, reason: 'malformed validator output (not JSON)' });
      }
    });

    try {
      child.stdin?.write(JSON.stringify({ jsonld: blocks }));
      child.stdin?.end();
    } catch {
      /* close handler will settle the promise */
    }
  });
}

async function main() {
  console.log('Rich Results Check (sandboxed SHACL — non-blocking)');
  console.log('===================================================');
  if (!fs.existsSync(DIST)) {
    warn('dist/client not found — run "npm run build" first. Skipping (non-blocking).');
    process.exit(0);
  }
  console.log(`Validator: ${VALIDATOR} (child process, ${TIMEOUT_MS}ms timeout, 256MB heap, vendored shapes)`);

  let checked = 0;
  let degradedCount = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const urlPath of SAMPLE) {
    const html = htmlFor(urlPath);
    if (!html) { warn(`${urlPath}: no built HTML — skipped`); continue; }
    const blocks = extractJsonLd(html);
    if (blocks.length === 0) { warn(`${urlPath}: no JSON-LD — skipped`); continue; }

    const res = await runValidator(blocks);
    checked++;
    if (!res.ok) {
      degradedCount++;
      console.log(`  ⚠ ${urlPath}: ${JSON.stringify({ degraded: true, reason: res.reason })}`);
      // Degraded pages contribute the empty contract — never block CI.
      continue;
    }
    totalErrors += res.result.errors.length;
    totalWarnings += res.result.warnings.length;
    console.log(`  ${res.result.errors.length === 0 ? '✓' : '✗'} ${urlPath}: ${res.result.errors.length} error(s), ${res.result.warnings.length} warning(s)`);
  }

  console.log('\n---');
  if (checked > 0 && degradedCount === checked) {
    console.log(`DEGRADED: validator unavailable for all ${checked} sampled page(s). Non-blocking — deploy proceeds.`);
  } else {
    console.log(`Sampled ${checked} page(s): ${totalErrors} error(s), ${totalWarnings} warning(s)${degradedCount ? `, ${degradedCount} degraded` : ''}. Non-blocking — informational only.`);
    if (totalErrors > 0) console.log('NOTE: review the errors above; they do NOT block the deploy (structural gate is validate-jsonld.ts).');
  }
  process.exit(0); // ALWAYS non-blocking
}

main().catch((err) => {
  console.log(`  ⚠ ${JSON.stringify({ degraded: true, reason: `rich-results-check crashed: ${(err as Error).message.slice(0, 80)}` })} — non-blocking, deploy proceeds.`);
  process.exit(0);
});
