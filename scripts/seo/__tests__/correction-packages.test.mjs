// Offline checks for the draft-only CMS correction packages (no network, no CMS writes).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyOps, outOfScopeChanges } from '../../content/verify-correction-packages.mjs';
import { articleToolIntegration } from '../../content/preflight.mjs';

const json = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const tools = new Map([
  ['hrv-explainer-log', { id: 65, slug: 'hrv-explainer-log' }],
  ['waist-to-height-ratio-calculator', { id: 16, slug: 'waist-to-height-ratio-calculator' }],
  ['lean-body-mass-calculator', { id: 9, slug: 'lean-body-mass-calculator' }],
]);
const article = (over = {}) => ({
  id: 1, slug: 'a', title: 'T', updatedAt: '2026-10-01T00:00:00.000Z', meta: { description: 'd' },
  layout: [{ blockType: 'text', body: 'one' }, { blockType: 'text', body: 'two' }], ...over,
});

test('the article-tool package covers exactly the gated IDs and slugs', async () => {
  const pkg = await json('../../content/correction-packages/article-tool-gates.json');
  const gates = await json('../../content/article-tool-gates.json');
  const ids = (xs) => xs.map((x) => `${x.id}:${x.slug}`).sort();
  assert.deepEqual(ids(pkg.articles), ids(gates.gates));
  assert.equal(pkg.cmsOrigin, gates.cmsOrigin);
});

test('the coupled manifest lists 12 unique published-article IDs with ISO baselines', async () => {
  const m = await json('../../content/correction-packages/release-coupled-articles.json');
  assert.equal(m.articles.length, 12);
  assert.equal(new Set(m.articles.map((a) => a.id)).size, 12);
  for (const a of m.articles) assert.match(a.baselineUpdatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, String(a.id));
});

test('insertToolEmbed adds one embed after the first text block and changes nothing else', () => {
  const a = article({ primaryTool: { id: 65, slug: 'hrv-explainer-log' } });
  assert.equal(articleToolIntegration(a)?.kind, 'missing');
  const out = applyOps(a, [{ op: 'insertToolEmbed', tool: 'hrv-explainer-log', position: 'afterFirstText' }], tools);
  assert.deepEqual(out.layout.map((b) => b.blockType), ['text', 'toolEmbed', 'text']);
  assert.deepEqual(out.layout[1].tool, { id: 65, slug: 'hrv-explainer-log' });
  assert.equal(articleToolIntegration(out), null);
  assert.deepEqual(outOfScopeChanges(a, out), []);
  assert.equal(a.layout.length, 2, 'the live record copy is not mutated');
  assert.throws(() => applyOps(out, [{ op: 'insertToolEmbed', tool: 'hrv-explainer-log' }], tools), /stale package/);
});

test('wrong primary: set the editorial primary and replace every wrong embed', () => {
  const wrong = { blockType: 'toolEmbed', tool: { id: 9, slug: 'lean-body-mass-calculator' } };
  const a = article({ slug: 'healthy-waist-to-height-ratio', primaryTool: { id: 9, slug: 'lean-body-mass-calculator' }, layout: [{ blockType: 'text', body: 'x' }, wrong, wrong] });
  assert.equal(articleToolIntegration(a, 'waist-to-height-ratio-calculator')?.kind, 'wrong-primary');
  const out = applyOps(a, [{ op: 'setPrimaryTool', tool: 'waist-to-height-ratio-calculator' }, { op: 'replaceToolEmbed', from: 'lean-body-mass-calculator', tool: 'waist-to-height-ratio-calculator' }], tools);
  assert.equal(articleToolIntegration(out, 'waist-to-height-ratio-calculator'), null);
  assert.ok(out.layout.filter((b) => b.blockType === 'toolEmbed').every((b) => b.tool.slug === 'waist-to-height-ratio-calculator'));
  assert.deepEqual(outOfScopeChanges(a, out), []);
  assert.throws(() => applyOps(out, [{ op: 'replaceToolEmbed', from: 'lean-body-mass-calculator', tool: 'waist-to-height-ratio-calculator' }], tools), /stale package/);
});

test('scope guard detects any change outside primaryTool and embeds; unknown tools and ops are refused', () => {
  const a = article();
  assert.deepEqual(outOfScopeChanges(a, { ...a, title: 'Changed' }), ['title']);
  assert.deepEqual(outOfScopeChanges(a, { ...a, layout: [a.layout[1], a.layout[0]] }), ['layout (non-embed blocks)']);
  assert.throws(() => applyOps(a, [{ op: 'setPrimaryTool', tool: 'not-published' }], tools), /tool not published/);
  assert.throws(() => applyOps(a, [{ op: 'publish' }], tools), /unknown op/);
});
