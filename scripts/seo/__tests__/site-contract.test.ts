import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { canonicalToolSlug, toolPath, categoryPath, normalizeInternalHref, SUPPORTED_TOOL_SLUGS, assertUniquePublicPaths } from '../../../src/lib/site-routes.ts';
import { registerHooks } from 'node:module';
import { resolveCanonical } from '../../../src/lib/seo.ts';
import { buildRedirects } from '../redirects.mjs';
import { isIndexableHtml, isExcludedSitemapPath } from '../sitemap-policy.mjs';
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

test('sitemap indexability honors robots and canonical attributes regardless of order', () => {
  const url = 'https://www.healthylifesstyles.com/wellness-hub/tag/nutrition';
  const wrong = 'https://www.healthylifesstyles.com/wellness-hub/tag/other';
  const excluded = [
    '<meta content="noindex, follow" name="robots">',
    "<meta content='follow, NOINDEX' name='ROBOTS'>",
    '<meta name="googlebot" content="noindex">',
    '<meta content="none" name="googlebot">',
    '<meta content=none name=robots>',
    '<meta content="nofollow,none" name="robots">',
    `<link href="${wrong}" rel="canonical">`,
    `<link href='${wrong}' rel='canonical alternate'>`,
    `<link href=${wrong} rel=canonical>`,
    '<link rel="canonical">',
    `<link rel="canonical" href="${url}"><link href="${wrong}" rel="canonical">`,
  ];
  for (const html of excluded) {
    assert.equal(isIndexableHtml(html, url), false, html);
  }
  const allowed = [
    '<meta content="index, follow" name="robots">',
    '<meta name="description" content="the text mentions noindex">',
    '<meta content="nofollow" name="robots">',
    `<link href="${url}" rel="canonical">`,
    `<link rel="canonical" href="${url}/">`,
    `<meta name="robots" content="max-image-preview:large"><link href="${url}" rel="canonical">`,
  ];
  for (const html of allowed) {
    assert.equal(isIndexableHtml(html, url), true, html);
  }
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

test('sitemap ignores inert comment, script and body metadata, but still obeys real head robots', () => {
  const url = 'https://www.healthylifesstyles.com/wellness-hub/tag/nutrition';
  const head = '<!doctype html><html><head><link href=' + url + ' rel=canonical></head>';
  const inert = '<body><!-- <meta name="robots" content="noindex"> -->' +
    '<script>const x = `<link rel="canonical" href="https://wrong.test">`;</script>' +
    '<template><meta name="robots" content="none"></template>' +
    '<meta name="robots" content="noindex"></body></html>';
  assert.equal(isIndexableHtml(head + inert, url), true);
  assert.equal(isIndexableHtml(head.replace('</head>', '<meta name="robots" content="noindex"></head>') + inert, url), false);
});

test('sitemap allows real wellness tag archives while excluding legacy tag paths', () => {
  assert.equal(isExcludedSitemapPath('/wellness-hub/tag/nutrition'), false);
  assert.equal(isExcludedSitemapPath('/wellness-hub/tag/sleep-recovery'), false);
  for (const path of ['/tag/nutrition', '/legacy/tag/nutrition', '/category/nutrition',
    '/wellness-hub/tag/', '/wellness-hub/tag/foo/bar', '/api/private', '/embed/tool']) {
    assert.equal(isExcludedSitemapPath(path), true, path);
  }
});


test('quoted attribute values cannot impersonate metadata attributes', () => {
  const url = 'https://www.healthylifesstyles.com/wellness-hub/tag/nutrition';
  assert.equal(isIndexableHtml('<meta data-note=" name=robots " content=noindex>', url), true);
  assert.equal(isIndexableHtml('<meta data-note=" name=robots " name=robots content=noindex>', url), false);
  assert.equal(isIndexableHtml(`<link data-note=" href=wrong " href="${url}" rel=canonical>`, url), true);
  assert.equal(isIndexableHtml(`<link data-note=" rel=canonical " href="${url}/wrong">`, url), true);
});
