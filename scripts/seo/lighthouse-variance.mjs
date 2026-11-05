/**
 * Diagnostic-only summary for repeated localhost Lighthouse CI homepage runs.
 * The blocking single-run Lighthouse policy is independent and unchanged.
 * No network, writes, raw URLs, DOM, or script names leave this module.
 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const HOME = '/';
const ALLOWED_GROUPS = new Set([
  'scriptEvaluation', 'scriptParseCompile', 'styleLayout', 'parseHTML',
  'paintCompositeRender', 'garbageCollection', 'other',
]);

function metric(report, name) {
  const n = report?.audits?.[name]?.numericValue;
  if (!Number.isFinite(n) || n < 0) throw new Error('Lighthouse report missing valid ' + name);
  return n;
}
function rounded(n) { return Math.round(n * 100) / 100; }
function spread(values) {
  const sorted = [...values].sort((a,b) => a-b);
  return {
    min: rounded(sorted[0]),
    median: rounded(sorted[Math.floor(sorted.length / 2)]),
    max: rounded(sorted[sorted.length - 1]),
    range: rounded(sorted[sorted.length - 1] - sorted[0]),
  };
}
function isLocalHomepage(report) {
  try {
    const url = new URL(report?.finalUrl || report?.requestedUrl);
    return url.protocol === 'http:' && url.hostname === 'localhost' &&
      url.pathname === HOME && !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}

/** Pure, unit-testable summary. Only sanitized numbers and controlled labels. */
export function summarizeLighthouseVariance(reports, expectedRuns = 3) {
  if (!Number.isSafeInteger(expectedRuns) || expectedRuns < 2 || expectedRuns > 10) {
    throw new Error('Invalid expected Lighthouse diagnostic run count');
  }
  if (!Array.isArray(reports)) throw new Error('Expected Lighthouse reports');
  const runs = reports.filter(isLocalHomepage);
  if (runs.length !== expectedRuns) {
    throw new Error('Expected exactly ' + expectedRuns + ' localhost homepage reports; found ' + runs.length);
  }
  const versions = new Set(runs.map(r => r.lighthouseVersion));
  if (versions.size !== 1 || ![...versions][0]) throw new Error('Inconsistent Lighthouse versions');
  const lcp = runs.map(r => metric(r,'largest-contentful-paint'));
  const tbt = runs.map(r => metric(r,'total-blocking-time'));
  const cls = runs.map(r => metric(r,'cumulative-layout-shift'));
  const scores = runs.map(r => r.categories?.performance?.score);
  if (scores.some(n => !Number.isFinite(n) || n < 0 || n > 1)) {
    throw new Error('Lighthouse performance score unavailable');
  }
  const worst = runs[lcp.indexOf(Math.max(...lcp))];
  const groups = (worst.audits?.['mainthread-work-breakdown']?.details?.items || [])
    .filter(x => Number.isFinite(x.duration) && x.duration >= 0)
    .map(x => ({group: ALLOWED_GROUPS.has(x.group) ? x.group : 'other', duration: x.duration}))
    .sort((a,b) => b.duration - a.duration);
  const longestScriptMs = (worst.audits?.['bootup-time']?.details?.items || [])
    .map(x => x.total)
    .filter(n => Number.isFinite(n) && n >= 0)
    .reduce((a,b) => Math.max(a,b), 0);
  return Object.freeze({
    kind: 'localhost-homepage-lighthouse-variance-diagnostic',
    diagnosticOnly: true,
    changesReleaseGate: false,
    runCount: runs.length,
    lighthouseVersion: [...versions][0],
    lcpMs: {...spread(lcp), overExisting2000MsGate: lcp.filter(x => x > 2000).length},
    tbtMs: spread(tbt),
    cls: spread(cls),
    performanceScore: spread(scores),
    slowestLcpRun: {
      dominantMainThreadGroup: groups[0]?.group ?? null,
      dominantGroupMs: groups.length ? rounded(groups[0].duration) : null,
      longestScriptTotalMs: rounded(longestScriptMs),
    },
  });
}

export async function main(directory = '.lighthouseci') {
  const files = (await readdir(directory)).filter(n => /^lhr-[a-zA-Z0-9-]+\.json$/.test(n));
  const reports = await Promise.all(files.map(n => readFile(join(directory,n),'utf8').then(JSON.parse)));
  process.stdout.write(JSON.stringify(summarizeLighthouseVariance(reports)) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e => { process.stderr.write('LIGHTHOUSE_DIAGNOSTIC_UNAVAILABLE: ' + e.message + '\n'); process.exitCode = 1; });
}
