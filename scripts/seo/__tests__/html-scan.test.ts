/**
 * SEO Quality Gate Phase 1 — shared scan primitives + REGRESSION FIXTURES for
 * every historical scanner bug. Run: node --test scripts/seo/__tests__/html-scan.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonLdBlocks, nodeTypes, hasTopLevelType, firstTopLevelOfType } from '../lib/html-scan.ts';

/** REGRESSION FIXTURE 1 (P16/P17 bug class): real production article-page shape. */
const PROD_ARTICLE_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': ['MedicalWebPage', 'Article'],
  '@id': 'https://www.healthylifesstyles.com/wellness-hub/healthy-bmi-by-age',
  headline: "What's a Healthy BMI by Age?",
  speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.wh-article__lead'] },
});

/** REGRESSION FIXTURE 2 (discover-audit P16 bug class): archive with nested Article stubs. */
const PROD_ARCHIVE_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Nutrition Guides',
  hasPart: [
    { '@type': 'Article', headline: 'A', url: 'https://x/wellness-hub/a' },
    { '@type': 'Article', headline: 'B', url: 'https://x/wellness-hub/b' },
  ],
});

const page = (ld: string) =>
  `<!doctype html><html><head><script type="application/ld+json">${ld}</script></head><body><main>x</main></body></html>`;

test('REGRESSION P16/P17: array @type — production article shape IS detected as Article', () => {
  const { blocks, invalid } = extractJsonLdBlocks(page(PROD_ARTICLE_LD));
  assert.equal(invalid, 0);
  assert.equal(hasTopLevelType(blocks, 'Article'), true);
  assert.equal(hasTopLevelType(blocks, 'MedicalWebPage'), true);
});

test('REGRESSION P16: archive with nested hasPart Articles is NOT a top-level Article', () => {
  const { blocks } = extractJsonLdBlocks(page(PROD_ARCHIVE_LD));
  assert.equal(hasTopLevelType(blocks, 'Article'), false); // nested stubs must not qualify
  assert.equal(hasTopLevelType(blocks, 'CollectionPage'), true);
});

test('string @type form still works', () => {
  const { blocks } = extractJsonLdBlocks(page('{"@type":"Organization","name":"x"}'));
  assert.equal(hasTopLevelType(blocks, 'Organization'), true);
});

test('top-level ARRAY of nodes (multiple entities in one block)', () => {
  const { blocks } = extractJsonLdBlocks(page('[{"@type":"WebSite"},{"@type":["Article"]}]'));
  assert.equal(hasTopLevelType(blocks, 'WebSite'), true);
  assert.equal(hasTopLevelType(blocks, 'Article'), true);
});

test('invalid JSON-LD counted, valid blocks still extracted (fail-safe)', () => {
  const html = page('{broken json') + page('{"@type":"Article"}');
  const { blocks, invalid } = extractJsonLdBlocks(html);
  assert.equal(invalid, 1);
  assert.equal(blocks.length, 1);
  assert.equal(hasTopLevelType(blocks, 'Article'), true);
});

test('firstTopLevelOfType returns the node (for image/date extraction)', () => {
  const { blocks } = extractJsonLdBlocks(page(PROD_ARTICLE_LD));
  const node = firstTopLevelOfType(blocks, 'Article');
  assert.equal((node as { headline?: string })?.headline, "What's a Healthy BMI by Age?");
});

test('nodeTypes: junk-safe normalization', () => {
  assert.deepEqual(nodeTypes({ '@type': ['Article', 42, null] }), ['Article']);
  assert.deepEqual(nodeTypes({ '@type': 'X' }), ['X']);
  assert.deepEqual(nodeTypes(null), []);
  assert.deepEqual(nodeTypes([{ '@type': 'X' }]), []); // arrays are node LISTS, not nodes
});
