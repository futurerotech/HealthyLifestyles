/**
 * P15-P7 — article AEO schema emitter proof (fixtures, not production content).
 * Run: node --test scripts/seo/__tests__/article-schema.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speakableSelectors, buildFaqPage } from '../../../src/lib/article-schema.ts';

/** Minimal fixture article; only the fields these emitters read matter. */
const base = {
  slug: 'fixture', title: 'Fixture', seoTitle: 'Fixture', metaDescription: 'x',
  category: 'nutrition', excerpt: 'x', author: 'Tester', publishDate: '2026-01-01',
  updatedDate: '2026-01-01', primaryTool: '', relatedTools: [], sources: [],
  body: [{ type: 'paa', heading: 'People also ask', items: [
    { q: 'Is a calorie deficit required?', a: 'Yes — you must eat below maintenance.' },
    { q: 'How fast is safe?', a: 'About 0.5–1 kg per week per the CDC.' },
  ] }],
};

const withFlags = (extra: Record<string, unknown>) => ({ ...base, ...extra } as any);

test('valid visible FAQ + hasFAQ=true → FAQPage matching the visible Q&A', () => {
  const node = buildFaqPage(withFlags({ hasFAQ: true }));
  assert.ok(node, 'expected a FAQPage node');
  assert.equal(node!['@type'], 'FAQPage');
  const qa = node!.mainEntity as any[];
  assert.equal(qa.length, 2);
  assert.equal(qa[0].name, 'Is a calorie deficit required?');
  assert.equal(qa[0].acceptedAnswer.text, 'Yes — you must eat below maintenance.');
});

test('hasFAQ=false → NO FAQPage (even though PAA content exists)', () => {
  assert.equal(buildFaqPage(withFlags({ hasFAQ: false })), null);
});

test('hasFAQ=true but NO visible PAA content → NO FAQPage', () => {
  assert.equal(buildFaqPage(withFlags({ hasFAQ: true, body: [] })), null);
});

test('speakable always includes the lead; #key-takeaways only with exactly 3 takeaways', () => {
  assert.deepEqual(speakableSelectors(withFlags({})), ['.wh-article__lead']);
  assert.deepEqual(speakableSelectors(withFlags({ takeaways: ['a', 'b'] })), ['.wh-article__lead']);
  assert.deepEqual(speakableSelectors(withFlags({ takeaways: ['a', 'b', 'c'] })), ['.wh-article__lead', '#key-takeaways']);
  assert.deepEqual(speakableSelectors(withFlags({ takeaways: ['a', 'b', 'c', 'd'] })), ['.wh-article__lead']);
});
