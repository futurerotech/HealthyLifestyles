// Unit tests for the §7.3/§7.5 editorial lint (no network).
import test from 'node:test';
import assert from 'node:assert/strict';
const { lintArticle, internalLinks, hits, BRITISH, OVERCLAIM } = await import('../../content/editorial-lint.mjs');

test('British spellings and overclaims are detected; American spellings are not', () => {
  assert.deepEqual(hits(BRITISH, 'Drink two litres of water, eat yoghurt and fibre; normalise sleep.').map((s) => s.toLowerCase()), ['litres', 'yoghurt', 'fibre', 'normalise']);
  assert.deepEqual(hits(BRITISH, 'Drink two liters, eat yogurt and fiber; normalize sleep; center; aging.'), []);
  assert.deepEqual(hits(OVERCLAIM, 'This tea cures bloating and helps detox your liver.').map((s) => s.toLowerCase()), ['cures', 'detox']);
  assert.deepEqual(hits(OVERCLAIM, 'Talk to a clinician; the tool cannot diagnose a condition.'), []);
});

test('internal links resolve against published articles and tools (aliases honored)', () => {
  assert.deepEqual(internalLinks(['See [BMI](/tools/bmi-calculator/) and [sleep](https://www.healthylifesstyles.com/wellness-hub/sleep-cycles#x) and [CDC](https://www.cdc.gov/x)']), ['/tools/bmi-calculator', '/wellness-hub/sleep-cycles']);
  const ctx = { articleSlugs: new Set(['sleep-cycles']), toolSlugs: new Set(['bmi-calculator']), toolAliases: { bmi: 'bmi-calculator' } };
  const doc = { id: 1, slug: 'a', title: 'A', layout: [{ blockType: 'text', text: 'Use [BMI](/tools/bmi) or [gone](/wellness-hub/missing). ' + 'word '.repeat(800) }], sources: [{ url: 'u1' }, { url: 'u2' }, { url: 'u3' }], faq: [{ question: 'q', answer: 'a' }] };
  const r = lintArticle(doc, ctx);
  assert.deepEqual(r.findings, [{ code: 'broken-internal-link', detail: '/wellness-hub/missing' }]);
  const thin = lintArticle({ id: 2, slug: 'b', title: 'B', layout: [{ blockType: 'text', text: 'short' }] }, ctx);
  assert.deepEqual(thin.findings.map((f) => f.code), ['thin-content', 'few-sources', 'no-internal-links', 'no-faq']);
});

test('negated overclaims are not flagged; peopleAlsoAsk counts as an FAQ', () => {
  const ctx = { articleSlugs: new Set(), toolSlugs: new Set() };
  const base = { id: 3, slug: 'c', title: 'C', sources: [{ url: 1 }, { url: 2 }, { url: 3 }] };
  const ok = lintArticle({ ...base, layout: [{ blockType: 'text', text: 'No calculator can guarantee results. This is not a miracle. [x](/wellness-hub/c) ' + 'w '.repeat(800) }, { blockType: 'peopleAlsoAsk', items: [{ question: 'q', answer: 'a' }] }] }, { ...ctx, articleSlugs: new Set(['c']) });
  assert.deepEqual(ok.findings, []);
  const bad = lintArticle({ ...base, layout: [{ blockType: 'text', text: 'This plan is guaranteed to work. [x](/wellness-hub/c) ' + 'w '.repeat(800) }] , faq: [{ question: 'q', answer: 'a' }] }, { ...ctx, articleSlugs: new Set(['c']) });
  assert.equal(bad.findings[0].code, 'overclaim-review');
  assert.match(bad.findings[0].detail, /guaranteed to work/);
});
