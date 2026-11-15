// Guard-only pre-release protection for the current production frontend (no #56 behavior).
// Synthetic records; the real check is the production build's preflight against the live CMS.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkContentLock, lockDigest } from '../../content/release-content-lock.mjs';

const json = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const lock = await json('../../content/release-content-lock.json');
const pkg = await json('../../../package.json');
const vercel = await json('../../../vercel.json');

const doc = (r, body = 'old') => ({ id: r.id, slug: r.slug, title: `T${r.id}`, updatedAt: '2026-10-01T00:00:00.000Z', layout: [{ blockType: 'text', body: `${body} ${r.id}` }] });
const pre = lock.records.map((r) => doc(r));
const withDigests = (docs, mode) => ({ ...lock, enabled: true, mode, records: lock.records.map((r, i) => ({ ...r, preReleaseDigest: lockDigest(pre[i]), releaseDigest: lockDigest(doc(r, 'new')) })) });

test('committed guard is enabled, pre-release, and covers exactly the 16 records', () => {
  assert.equal(lock.enabled, true);
  assert.equal(lock.mode, 'pre-release');
  assert.deepEqual(lock.records.map((r) => r.id), [5, 7, 8, 10, 21, 25, 27, 28, 29, 32, 37, 46, 56, 57, 58, 69]);
  assert.ok(lock.records.every((r) => /^[0-9a-f]{64}$/.test(r.preReleaseDigest)));
  assert.equal(lock.cmsOrigin, 'https://cms.healthylifesstyles.com');
});

test('every ordinary build runs the preflight: pinned npm lifecycle, preflight in postbuild', () => {
  assert.equal(vercel.buildCommand, 'npm run build');
  assert.match(pkg.scripts.postbuild, /^npm run content:preflight\b/);
  assert.equal(pkg.scripts['content:preflight'], 'node scripts/content/preflight.mjs');
});

test('old code passes only on the reviewed pre-release content', () => {
  const l = withDigests(pre, 'pre-release');
  assert.deepEqual(checkContentLock(pre, l), []);
  // 1 of 16 updated early.
  const one = pre.map((d, i) => (i === 0 ? doc(lock.records[0], 'new') : d));
  assert.ok(checkContentLock(one, l).some((e) => /partial state, 15 of 16/.test(e)));
  // all 16 corrected: old code must not build against new articles.
  assert.equal(checkContentLock(lock.records.map((r) => doc(r, 'new')), l).length, 16);
  // an unreviewed edit and a missing record.
  assert.ok(checkContentLock(pre.map((d, i) => (i === 5 ? { ...d, title: 'edited' } : d)), l).some((e) => /matches neither reviewed version/.test(e)));
  assert.ok(checkContentLock(pre.slice(1), l).some((e) => /not published/.test(e)));
  // a timestamp-only republish of identical content is still the reviewed version.
  assert.deepEqual(checkContentLock(pre.map((d) => ({ ...d, updatedAt: '2026-12-01T00:00:00.000Z' })), l), []);
});
