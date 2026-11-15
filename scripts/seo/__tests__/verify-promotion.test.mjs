// Exact-content promotion attestation, on a real temporary git repository.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyPromotion } from '../../release/verify-promotion.mjs';

const dir = mkdtempSync(join(tmpdir(), 'promo-'));
const g = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@x', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@x' } }).trim();
const commit = (file, body, msg) => { writeFileSync(join(dir, file), body); g('add', '-A'); g('commit', '-q', '-m', msg); return g('rev-parse', 'HEAD'); };
g('init', '-q', '-b', 'main');
const base = commit('a.txt', 'old', 'base');
g('checkout', '-q', '-b', 'release');
const r = commit('a.txt', 'new', 'release R');
const io = (checks) => ({
  parents: (s) => g('rev-list', '--parents', '-n', '1', s).split(' ').slice(1),
  treeOf: (s) => g('rev-parse', `${s}^{tree}`),
  mergeBase: (a, b) => g('merge-base', a, b),
  checks: (s) => checks[s] || {},
});

test('an up-to-date merge commit carries exactly the tested tree', () => {
  g('checkout', '-q', 'main');
  g('merge', '-q', '--no-ff', '-m', 'merge R', 'release');
  const m = g('rev-parse', 'HEAD');
  const res = verifyPromotion({ sha: m, ...io({ [r]: { verify: 'success', rc: 'success' } }), requireRc: true });
  assert.deepEqual(res, { releaseCommit: r, errors: [] });
});

test('missing or failed checks and a missing RC acceptance are rejected', () => {
  const m = g('rev-parse', 'HEAD');
  assert.ok(verifyPromotion({ sha: m, ...io({ [r]: { verify: 'failure', rc: 'success' } }), requireRc: true }).errors.some((e) => /Verify check .* failure/.test(e)));
  assert.ok(verifyPromotion({ sha: m, ...io({ [r]: { verify: 'success' } }), requireRc: true }).errors.some((e) => /release-candidate acceptance .* missing/.test(e)));
  assert.deepEqual(verifyPromotion({ sha: m, ...io({ [r]: { verify: 'success' } }), requireRc: false }).errors, []);
});

test('a stale branch merge (main moved after testing) produces an untested tree and is rejected', () => {
  g('checkout', '-q', '-b', 'stale', base);
  const r2 = commit('b.txt', 'x', 'release R2 (based on old main)');
  g('checkout', '-q', 'main');
  commit('c.txt', 'y', 'someone else lands first');
  g('merge', '-q', '--no-ff', '-m', 'merge R2', 'stale');
  const m2 = g('rev-parse', 'HEAD');
  const res = verifyPromotion({ sha: m2, ...io({ [r2]: { verify: 'success' } }), requireRc: false });
  assert.ok(res.errors.some((e) => /not up to date/.test(e)));
  assert.ok(res.errors.some((e) => /tree differs/.test(e)));
});

test('a fast-forward lands the tested commit itself', () => {
  g('checkout', '-q', '-b', 'ff');
  const r3 = commit('d.txt', 'z', 'release R3');
  assert.deepEqual(verifyPromotion({ sha: r3, ...io({ [r3]: { verify: 'success' } }), requireRc: false }), { releaseCommit: r3, errors: [] });
});
