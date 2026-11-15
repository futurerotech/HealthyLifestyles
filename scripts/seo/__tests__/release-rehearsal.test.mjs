// Deterministic rehearsal of the coordinated #56 release for the 16 unique article records.
//
// A simulated CMS with version history and the REAL release checks (content lock and
// article-tool gates from the preflight) stand in for production. The rehearsal shows that a
// build can only succeed when the published records are exactly one reviewed set, and that
// partial publishes, drift and rollbacks fail closed. No network, no CMS writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkContentLock, lockDigest } from '../../content/release-content-lock.mjs';
import { applyOps } from '../../content/verify-correction-packages.mjs';
import { checkArticleToolGates } from '../../content/preflight.mjs';

const json = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const gatesFile = await json('../../content/article-tool-gates.json');
const lockTemplate = await json('../../content/release-content-lock.json');
const pkg = await json('../../content/correction-packages/article-tool-gates.json');
const coupled = await json('../../content/correction-packages/release-coupled-articles.json');

const tools = new Map(['hrv-explainer-log', 'vitamin-d-sun-calculator', 'calorie-deficit-calculator', 'waist-to-hip-ratio-calculator',
  'waist-to-height-ratio-calculator', 'lean-body-mass-calculator'].map((slug, i) => [slug, { id: 100 + i, slug }]));
const embed = (slug) => ({ blockType: 'toolEmbed', tool: tools.get(slug) });
const text = (body) => ({ blockType: 'text', body });

/** Pre-release production fixture: the 5 gated defects exactly as gated, the 12 coupled with old text. */
function productionFixture() {
  const ids = [...new Set([...pkg.articles.map((a) => a.id), ...coupled.articles.map((a) => a.id)])].sort((a, b) => a - b);
  return ids.map((id) => {
    const slug = lockTemplate.records.find((r) => r.id === id).slug;
    const gate = gatesFile.gates.find((g) => g.id === id);
    const doc = { id, slug, title: `T${id}`, updatedAt: '2026-10-01T00:00:00.000Z', excerpt: `old ${id}`, layout: [text(`old body ${id}`)] };
    if (gate?.kind === 'missing') doc.primaryTool = tools.get(gate.expected);
    else if (gate?.kind === 'wrong-primary') { doc.primaryTool = tools.get('lean-body-mass-calculator'); doc.layout.push(embed('lean-body-mass-calculator'), embed('lean-body-mass-calculator')); }
    else doc.primaryTool = tools.get('lean-body-mass-calculator'), doc.layout.push(embed('lean-body-mass-calculator'));
    return doc;
  });
}

/** Reviewed release version: gate package applied, coupled text corrected. */
function releaseVersion(doc) {
  let d = structuredClone(doc);
  const p = pkg.articles.find((a) => a.id === d.id);
  if (p) d = applyOps(d, p.ops, tools);
  if (coupled.articles.some((a) => a.id === d.id)) d.layout = d.layout.map((b) => (b.blockType === 'text' ? text(`corrected body ${d.id}`) : b));
  return d;
}

/** A tiny CMS: published state, draft state and version history per record. */
class Cms {
  constructor(docs) { this.pub = new Map(docs.map((d) => [d.id, structuredClone(d)])); this.drafts = new Map(); this.history = new Map(docs.map((d) => [d.id, [structuredClone(d)]])); this.clock = 0; }
  saveDraft(doc) { this.drafts.set(doc.id, structuredClone(doc)); } // drafts are never public
  publish(id, { fail = false } = {}) {
    if (fail) throw Error(`publish ${id} failed`);
    const d = { ...structuredClone(this.drafts.get(id)), updatedAt: `2026-11-20T00:00:${String(++this.clock).padStart(2, '0')}.000Z` };
    this.pub.set(id, d); this.history.get(id).push(structuredClone(d)); this.drafts.delete(id);
  }
  restore(id, version) { const d = { ...structuredClone(version), updatedAt: `2026-11-20T01:00:${String(++this.clock).padStart(2, '0')}.000Z` }; this.pub.set(id, d); this.history.get(id).push(d); }
  edit(id, fn) { const d = structuredClone(this.pub.get(id)); fn(d); this.pub.set(id, d); }
  published() { return [...this.pub.values()]; }
}

/** The three frontend code states and what their build preflight enforces. */
function lockFor(mode, prod, rel) {
  return { ...lockTemplate, enabled: true, mode, records: lockTemplate.records.map((r) => ({ ...r, preReleaseDigest: lockDigest(prod.get(r.id)), releaseDigest: lockDigest(rel.get(r.id)) })) };
}
function builds(cms, locks) {
  const arts = cms.published();
  return {
    // PR #56 as reviewed today: gates in force, lock in pre-release mode.
    pr56: [...checkArticleToolGates(arts, gatesFile.gates, gatesFile.editorialPrimary), ...checkContentLock(arts, locks.pre)],
    // Release commit R: gates removed, lock in release mode.
    release: [...checkArticleToolGates(arts, [], gatesFile.editorialPrimary), ...checkContentLock(arts, locks.release)],
  };
}

function setup() {
  const prod = productionFixture();
  const cms = new Cms(prod);
  const pre = new Map(prod.map((d) => [d.id, d]));
  const rel = new Map(prod.map((d) => [d.id, releaseVersion(d)]));
  return { cms, rel, locks: { pre: lockFor('pre-release', pre, rel), release: lockFor('release', pre, rel) } };
}

test('fixture covers the 16 unique records; the lock template lists exactly those IDs', () => {
  const { cms } = setup();
  assert.equal(cms.published().length, 16);
  assert.deepEqual(lockTemplate.records.map((r) => r.id).sort((a, b) => a - b), cms.published().map((d) => d.id));
  assert.equal(lockTemplate.enabled, false, 'committed disabled until reviewed digests are filled');
});

test('baseline and drafts: #56 builds, the release commit fails closed (drafts are invisible)', () => {
  const { cms, rel, locks } = setup();
  assert.deepEqual(builds(cms, locks).pr56, []);
  assert.ok(builds(cms, locks).release.length > 0);
  for (const d of rel.values()) cms.saveDraft(d);
  assert.deepEqual(builds(cms, locks).pr56, [], 'saving drafts changes nothing public');
  assert.ok(builds(cms, locks).release.some((e) => /still the pre-release version/.test(e)));
});

test('partial publish (failure at record 9 of 16): every build fails closed, so no mixed set can ship', () => {
  const { cms, rel, locks } = setup();
  for (const d of rel.values()) cms.saveDraft(d);
  const order = [...rel.keys()];
  const before = new Map(cms.published().map((d) => [d.id, structuredClone(d)]));
  assert.throws(() => order.forEach((id, i) => cms.publish(id, { fail: i === 8 })), /publish 29 failed/);
  const b = builds(cms, locks);
  assert.ok(b.pr56.some((e) => /partial state, 8 of 16/.test(e)), 'old code + partly new content blocked');
  assert.ok(b.release.some((e) => /partial state, 8 of 16/.test(e)), 'new code + partly old content blocked');
  // Rollback of the partial batch from recorded pre-release versions restores a buildable #56 state.
  for (const id of order.slice(0, 8)) cms.restore(id, before.get(id));
  assert.deepEqual(builds(cms, locks).pr56, []);
});

test('complete publish: only the release commit builds; drift after review is caught', () => {
  const { cms, rel, locks } = setup();
  for (const d of rel.values()) { cms.saveDraft(d); cms.publish(d.id); }
  const b = builds(cms, locks);
  assert.deepEqual(b.release, []);
  assert.ok(b.pr56.length > 0, 'pre-release code cannot be rebuilt against released content');
  cms.edit(46, (d) => { d.excerpt = 'unreviewed edit'; });
  assert.ok(builds(cms, locks).release.some((e) => /ID 46 .*matches neither reviewed version/.test(e)));
});

test('rollback after release restores the exact pre-release digests (timestamps differ, content does not)', () => {
  const { cms, rel, locks } = setup();
  const before = new Map(cms.published().map((d) => [d.id, structuredClone(d)]));
  for (const d of rel.values()) { cms.saveDraft(d); cms.publish(d.id); }
  for (const [id, v] of before) cms.restore(id, v);
  assert.ok(cms.published().every((d) => d.updatedAt !== before.get(d.id).updatedAt));
  assert.deepEqual(builds(cms, locks).pr56, []);
  assert.ok(builds(cms, locks).release.length > 0);
});

test('an incomplete or unknown lock never passes', () => {
  const { cms } = setup();
  assert.ok(checkContentLock(cms.published(), { ...lockTemplate, enabled: true }).some((e) => /lock is incomplete/.test(e)));
  assert.ok(checkContentLock(cms.published(), { ...lockTemplate, enabled: true, mode: 'later' }).length === 1);
  assert.deepEqual(checkContentLock(cms.published(), lockTemplate), [], 'disabled lock is a no-op');
});
