/**
 * degradation.test.ts (Phase 12, Gate 2) — chaos tests for the non-blocking
 * rich-results-check → validate-shacl pipeline.
 *
 *   npm run test:degradation
 *   (node --test; spawns the REAL CLIs — no mocks, no app imports)
 *
 * Law under test: graceful degradation. Whatever happens to the validator
 * (crash mid-run, timeout, tampered shapes, missing file), the CI check must
 * log a structured { degraded: true, reason } warning, contribute the empty
 * contract, and EXIT 0 — deploys are never blocked by this check.
 */
import { test, before, after } from 'node:test';
import * as assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '..', '..', '..');
const CHECKER = path.join(REPO, 'scripts', 'seo', 'rich-results-check.ts');
const VALIDATOR = path.join(REPO, 'scripts', 'seo', 'validate-shacl.ts');
const SHAPES = path.join(REPO, 'scripts', 'seo', 'shapes');
const VALID_FIXTURE = path.join(REPO, 'scripts', 'seo', '__tests__', 'fixtures', 'valid-article.json');

let tmpRoot: string;
let tamperedShapes: string;

before(() => {
  // Synthetic build output: one page embedding a known-valid JSON-LD block.
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'p12-degradation-'));
  const pageDir = path.join(tmpRoot, 'dist', 'client');
  fs.mkdirSync(pageDir, { recursive: true });
  const block = fs.readFileSync(VALID_FIXTURE, 'utf8').trim();
  fs.writeFileSync(
    path.join(pageDir, 'index.html'),
    `<!doctype html><html><head><script type="application/ld+json">${block}</script></head><body>x</body></html>`,
  );
  // Tampered copy of the shapes dir (corrupted payload, original lock).
  tamperedShapes = path.join(tmpRoot, 'tampered-shapes');
  fs.mkdirSync(tamperedShapes);
  fs.copyFileSync(path.join(SHAPES, 'shapes.lock.json'), path.join(tamperedShapes, 'shapes.lock.json'));
  fs.copyFileSync(path.join(SHAPES, 'schemarama-full.shacl'), path.join(tamperedShapes, 'schemarama-full.shacl'));
  fs.appendFileSync(path.join(tamperedShapes, 'schemarama-full.shacl'), '\n# tampered\n');
});

after(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function runChecker(extraEnv: Record<string, string>): { status: number | null; out: string } {
  const res = spawnSync(process.execPath, [CHECKER], {
    cwd: tmpRoot, // checker resolves dist/ from cwd → our synthetic build
    env: {
      ...process.env,
      RICH_RESULTS_SAMPLE: '/',
      VALIDATOR_PATH: VALIDATOR,
      SHAPES_DIR: SHAPES,
      ...extraEnv,
    },
    encoding: 'utf8',
    timeout: 90_000,
  });
  return { status: res.status, out: `${res.stdout || ''}${res.stderr || ''}` };
}

test('happy path — valid block validates cleanly (control)', () => {
  const { status, out } = runChecker({});
  assert.strictEqual(status, 0, `exit 0 expected, got ${status}\n${out}`);
  assert.match(out, /✓ \/: 0 error\(s\)/, `expected clean validation:\n${out}`);
  assert.doesNotMatch(out, /degraded/, `must not degrade on the happy path:\n${out}`);
});

test('chaos (a): validator killed mid-run → degraded, exit 0', () => {
  const { status, out } = runChecker({ VALIDATE_SHACL_TEST_CRASH: '1' });
  assert.strictEqual(status, 0, `exit 0 expected, got ${status}\n${out}`);
  assert.match(out, /"degraded":\s*true/, `expected structured degraded warning:\n${out}`);
  assert.match(out, /exited/, `reason should mention abnormal exit:\n${out}`);
});

test('chaos (b): forced timeout via env flag → degraded, exit 0', () => {
  const { status, out } = runChecker({
    VALIDATE_SHACL_TEST_DELAY_MS: '10000',
    RICH_RESULTS_TIMEOUT_MS: '500',
  });
  assert.strictEqual(status, 0, `exit 0 expected, got ${status}\n${out}`);
  assert.match(out, /"degraded":\s*true/, `expected structured degraded warning:\n${out}`);
  assert.match(out, /timeout/, `reason should mention the timeout:\n${out}`);
});

test('chaos (c): corrupted shapes → validator fails closed → degraded, exit 0', () => {
  const { status, out } = runChecker({ SHAPES_DIR: tamperedShapes });
  assert.strictEqual(status, 0, `exit 0 expected, got ${status}\n${out}`);
  assert.match(out, /"degraded":\s*true/, `expected structured degraded warning:\n${out}`);
  assert.match(out, /exited 2|TAMPER/i, `reason should surface the tamper exit:\n${out}`);
});

test('chaos (d): validator file deleted/missing → degraded, exit 0', () => {
  const { status, out } = runChecker({ VALIDATOR_PATH: path.join(tmpRoot, 'does-not-exist.ts') });
  assert.strictEqual(status, 0, `exit 0 expected, got ${status}\n${out}`);
  assert.match(out, /"degraded":\s*true/, `expected structured degraded warning:\n${out}`);
});
