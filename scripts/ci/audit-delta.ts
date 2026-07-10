/**
 * audit-delta.ts — baseline-aware npm-audit gate (Phase 13, P2).
 *
 *   node scripts/ci/audit-delta.ts                     # CI gate (default)
 *   node scripts/ci/audit-delta.ts --write-baseline    # (re)generate baseline — review + commit the diff
 *   node scripts/ci/audit-delta.ts --baseline <path>   # explicit baseline (used by the regression test)
 *
 * Policy (Phase 13 decree — the 22 pre-existing legacy vulnerabilities are
 * recorded, NOT fixed, and explicitly out of scope):
 *   - FAIL (exit 1) on any HIGH or CRITICAL advisory NOT present in the baseline.
 *   - WARN ONLY on new moderate/low advisories (visible in the log, exit 0).
 *   - FAIL (exit 1) if the baseline is past its reviewBy date — baselines rot;
 *     a human must re-review and regenerate deliberately.
 *   - FAIL (exit 1) if the baseline file is missing or npm audit is unreadable
 *     (a security gate that cannot evaluate must not silently pass).
 *
 * Identity model: npm's headline count ("22 vulnerabilities") counts vulnerable
 * PACKAGE PATHS; the stable diffable unit is the ADVISORY ID (via[].source).
 * The baseline stores both: npm totals for human cross-checking, advisory ids
 * (sorted, deduped) as the actual diff basis.
 *
 * Dependency-free by design: node builtins only, spawns `npm audit --json`.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REVIEW_DAYS = 90;

interface Advisory { id: number; severity: string; package: string; title: string }
interface Baseline {
  createdAt: string;
  reviewBy: string;
  npmTotals: Record<string, number>;
  advisories: Advisory[];
}

const args = process.argv.slice(2);
const writeMode = args.includes('--write-baseline');
const baselineArg = args.indexOf('--baseline');
const BASELINE_PATH = path.resolve(baselineArg !== -1 ? args[baselineArg + 1] : path.join(process.cwd(), 'audit-baseline.json'));

function runNpmAudit(): { totals: Record<string, number>; advisories: Advisory[] } {
  // npm audit exits non-zero when vulns exist — the JSON is valid either way.
  const res = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  if (!res.stdout) throw new Error(`npm audit produced no output (status ${res.status}): ${String(res.stderr).slice(0, 200)}`);
  const report = JSON.parse(res.stdout) as {
    metadata?: { vulnerabilities?: Record<string, number> };
    vulnerabilities?: Record<string, { via?: unknown[] }>;
  };
  const totals = report.metadata?.vulnerabilities ?? {};
  const byId = new Map<number, Advisory>();
  for (const [pkg, vuln] of Object.entries(report.vulnerabilities ?? {})) {
    for (const via of vuln.via ?? []) {
      if (via && typeof via === 'object' && 'source' in via) {
        const v = via as { source: number; severity?: string; name?: string; title?: string };
        if (!byId.has(v.source)) {
          byId.set(v.source, { id: v.source, severity: v.severity || 'unknown', package: v.name || pkg, title: (v.title || '').slice(0, 100) });
        }
      }
    }
  }
  const advisories = [...byId.values()].sort((a, b) => a.id - b.id);
  return { totals, advisories };
}

function main(): void {
  const { totals, advisories } = runNpmAudit();

  if (writeMode) {
    const createdAt = new Date();
    const reviewBy = new Date(createdAt.getTime() + REVIEW_DAYS * 24 * 60 * 60 * 1000);
    const baseline: Baseline = {
      createdAt: createdAt.toISOString().slice(0, 10),
      reviewBy: reviewBy.toISOString().slice(0, 10),
      npmTotals: totals,
      advisories,
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
    console.log(`baseline written: ${BASELINE_PATH}`);
    console.log(`  npm totals: ${JSON.stringify(totals)}`);
    console.log(`  advisories: ${advisories.length} (review by ${baseline.reviewBy})`);
    console.log('Review + commit the diff deliberately — the baseline is an accepted-risk ledger.');
    return;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`audit-delta: FAIL — baseline missing (${BASELINE_PATH}). Generate with --write-baseline and commit it.`);
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) as Baseline;

  if (new Date(baseline.reviewBy).getTime() < Date.now()) {
    console.error(`audit-delta: FAIL — baseline expired (reviewBy ${baseline.reviewBy}). Re-review the accepted advisories and regenerate with --write-baseline.`);
    process.exit(1);
  }

  const known = new Set(baseline.advisories.map((a) => a.id));
  const fresh = advisories.filter((a) => !known.has(a.id));
  const freshBlocking = fresh.filter((a) => a.severity === 'high' || a.severity === 'critical');
  const freshInfo = fresh.filter((a) => a.severity !== 'high' && a.severity !== 'critical');

  console.log(`audit-delta: ${advisories.length} advisory(ies) present, ${known.size} baselined (review by ${baseline.reviewBy}).`);
  for (const a of freshInfo) {
    console.log(`  ⚠ NEW ${a.severity}: #${a.id} ${a.package} — ${a.title} (warn-only)`);
  }
  if (freshBlocking.length > 0) {
    for (const a of freshBlocking) {
      console.error(`  ✗ NEW ${a.severity.toUpperCase()}: #${a.id} ${a.package} — ${a.title}`);
    }
    console.error(`audit-delta: FAIL — ${freshBlocking.length} new high/critical advisory(ies) not in baseline.`);
    process.exit(1);
  }
  console.log('audit-delta: PASS — no new high/critical advisories.');
}

try {
  main();
} catch (err) {
  console.error(`audit-delta: FAIL — ${(err as Error).message.slice(0, 200)}`);
  process.exit(1);
}
