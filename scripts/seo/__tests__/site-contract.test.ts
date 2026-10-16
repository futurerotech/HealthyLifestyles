import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { canonicalToolSlug, toolPath, categoryPath, normalizeInternalHref, SUPPORTED_TOOL_SLUGS, assertUniquePublicPaths } from '../../../src/lib/site-routes.ts';
import { registerHooks } from 'node:module';
import { resolveCanonical } from '../../../src/lib/seo.ts';
import { buildRedirects } from '../redirects.mjs';
import { isIndexableHtml } from '../sitemap-policy.mjs';
import { reviewMetadataIssues } from '../lib/review-metadata.ts';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getToolContent } = await import('../../../src/data/tool-content.ts');
const { mapToolContent } = await import('../../../src/lib/cms-content.ts');
const { renderInline } = await import('../../../src/lib/text.ts');

test('the two repositories share one route contract', () => {
  const cms = new URL('../../../cms/src/lib/site-contract.json', import.meta.url);
  if (existsSync(cms)) assert.equal(readFileSync(cms, 'utf8'), readFileSync(new URL('../../../src/lib/site-contract.json', import.meta.url), 'utf8'));
});

test('supported tools all have authored content and aliases resolve to those tools', () => {
  for (const slug of SUPPORTED_TOOL_SLUGS) assert.ok(getToolContent(slug), slug);
  assert.equal(canonicalToolSlug('body-fat-percentage-calculator'), 'body-fat-calculator');
  assert.equal(toolPath('how-much-protein-do-i-need'), '/tools/protein-intake-calculator');
  assert.equal(categoryPath('nutrition', 'tool'), '/nutrition');
  assert.equal(categoryPath('nutrition', 'section'), '/wellness-hub/nutrition');
  assert.equal(normalizeInternalHref('https://www.healthylifesstyles.com/tools/body-fat-percentage-calculator?q=1#result'), '/tools/body-fat-calculator?q=1#result');
  assert.equal(normalizeInternalHref('https://elsewhere.test/tools/body-fat-percentage-calculator'), 'https://elsewhere.test/tools/body-fat-percentage-calculator');
});

test('CMS redirects reject cycles and unsafe destinations', () => {
  assert.throws(() => buildRedirects([{ from: '/a', to: '/b' }, { from: '/b', to: '/a' }]), /cycle/);
  assert.throws(() => buildRedirects([{ from: '/a', to: 'javascript:alert(1)' }]), /Invalid/);
  const rules = buildRedirects([{ from: '/old-bmi', to: '/tools/bmi-calculator', type: '302' }]);
  assert.equal(rules['/old-bmi'].status, 302);
  assert.equal(rules['/tools/body-fat-percentage-calculator'].destination, '/tools/body-fat-calculator');
});

test('canonicals and noindex control sitemap membership', () => {
  const origin = 'https://www.healthylifesstyles.com';
  assert.equal(resolveCanonical('/preferred#fragment', '/other', origin), `${origin}/preferred`);
  assert.throws(() => resolveCanonical('javascript:alert(1)', '/other', origin));
  assert.equal(isIndexableHtml('<meta name="robots" content="noindex, follow">', `${origin}/a`), false);
  assert.equal(isIndexableHtml(`<link rel="canonical" href="${origin}/b">`, `${origin}/a`), false);
  assert.equal(isIndexableHtml(`<link rel="canonical" href="${origin}/a">`, `${origin}/a`), true);
});

test('article/category collisions and reserved static routes block a build', () => {
  assert.throws(() => assertUniquePublicPaths([{ collection: 'articles', slug: 'nutrition' }, { collection: 'categories', slug: 'nutrition', kind: 'section' }]), /Duplicate/);
  assert.throws(() => assertUniquePublicPaths([{ collection: 'pages', slug: 'about' }]), /Duplicate/);
  assert.doesNotThrow(() => assertUniquePublicPaths([{ collection: 'categories', slug: 'nutrition', kind: 'tool' }, { collection: 'categories', slug: 'nutrition', kind: 'section' }]));
});

test('CMS explanations, FAQs and source removals replace stale authored content', () => {
  const value = mapToolContent({ whatItIs: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'An updated explanation.' }] }] } }, faq: [{ question: 'Updated?', answer: 'Yes.' }], sources: [] });
  assert.equal(value.sections?.[0].paragraphs?.[0], 'An updated explanation.');
  assert.deepEqual(value.faq, [{ q: 'Updated?', a: 'Yes.' }]);
  assert.deepEqual(value.sources, []);
});

test('CMS inline prose cannot emit executable or attribute-breaking links', () => {
  assert.ok(!renderInline('[click](javascript:alert(1))').includes('<a'));
  assert.ok(!renderInline('[click](data:text/html,bad)').includes('<a'));
  assert.match(renderInline('[calculator](/tools/body-fat-percentage-calculator)'), /href="\/tools\/body-fat-calculator"/);
});
test('review metadata never requires invented reviews and rejects malformed claims', () => {
  assert.deepEqual(reviewMetadataIssues({}), []);
  assert.deepEqual(reviewMetadataIssues({ reviewedBy: { name: 'Assigned reviewer' } }), []);
  assert.deepEqual(reviewMetadataIssues({ reviewedBy: { '@id': '/author/reviewer' }, lastReviewed: '2026-01-01' }), []);
  assert.ok(reviewMetadataIssues({ reviewedBy: {} }).length);
  assert.ok(reviewMetadataIssues({ lastReviewed: '2026-01-01' }).length);
  assert.ok(reviewMetadataIssues({ reviewedBy: { name: 'Reviewer' }, lastReviewed: '2026-02-30' }).length);
  assert.ok(reviewMetadataIssues({ reviewedBy: { name: 'Reviewer' }, lastReviewed: '2099-01-01' }).length);
});
