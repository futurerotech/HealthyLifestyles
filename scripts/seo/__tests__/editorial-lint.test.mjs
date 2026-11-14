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
