import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendContentPage, documentProof } from '../../../src/lib/content-integrity.mjs';
import { readPublishedCollection, readPublishedInventory } from '../inventory.mjs';
import { verifyContent, expectedMetadata, inspectDocument, hasPermanentRedirect } from '../preflight.mjs';

const article = { id: 1, slug: 'preserved-article', title: 'Preserved article', _status: 'published', updatedAt: '2026-10-15T10:00:00.000Z', publishDate: '2026-01-01T00:00:00.000Z', updatedDate: '2026-02-01T00:00:00.000Z', excerpt: 'Original excerpt.', layout: [{ blockType: 'text', style: 'p', text: 'Original published text.' }], faq: [{ question: 'A real question?', answer: 'A real published answer.' }], heroImage: { id: 5, url: 'https://images.example.test/original.webp', alt: 'Original image', width: 1200, height: 630 }, author: { id: 2, slug: 'editor', name: 'Original author' }, seo: { metaTitle: 'Original SEO title', metaDescription: 'Original SEO description', ogTitle: 'Original social title' } };
const cmsOrigin = 'https://cms.example.test';
const inventory = { cmsOrigin, collections: { articles: [article], tools: [], pages: [], 'pseo-pages': [] } };
const baseline = { cmsOrigin, collections: { articles: [{ id: '1', slug: article.slug }], tools: [], pages: [], 'pseo-pages': [] } };
function manifest(docs = [article]) { return { version: 1, source: 'cms', buildKind: 'cms', cmsOrigin, collections: ['articles', 'tools', 'categories', 'authors', 'tags', 'pages', 'pseo-pages', 'redirects', 'global:settings', 'global:ad-management', 'global:lead-gen'], records: docs.map((doc) => ({ collection: 'articles', docId: String(doc.id), updatedAt: doc.updatedAt, path: `/wellness-hub/${doc.slug}`, proof: documentProof('articles', doc) })) }; }
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
function html(doc = article) {
  const m = expectedMetadata('articles', doc, cmsOrigin);
  return `<title>${m.title}</title><link rel="canonical" href="${m.canonical}">${Object.entries({ description: m.description, 'og:title': m.ogTitle, 'og:description': m.ogDescription, 'twitter:title': m.twitterTitle, 'twitter:description': m.twitterDescription, 'og:image': m.ogImage, 'twitter:image': m.twitterImage, robots: doc.seo?.noIndex ? 'noindex, follow' : 'max-image-preview:large' }).map(([key, value]) => `<meta name="${key}" content="${escape(value)}">`).join('')}<script type="application/ld+json">${JSON.stringify({ '@type': 'Article', datePublished: doc.publishDate.split('T')[0], dateModified: doc.updatedDate.split('T')[0], author: doc.author })}</script><article data-cms-id="${doc.id}"><h1>${doc.title}</h1><p>${doc.excerpt}</p><p>${doc.layout[0].text}</p><img src="${doc.heroImage.url}" alt="${doc.heroImage.alt}" width="${doc.heroImage.width}" height="${doc.heroImage.height}">${doc.faq.map((f) => `<h2>${f.question}</h2><p>${f.answer}</p>`).join('')}</article>`;
}
const verify = (changes = {}) => verifyContent({ inventory, baseline, manifest: manifest(), readHtml: async () => html(), ...changes });

test('every published ID, slug, editorial fingerprint and actual HTML is required', async () => {
  const good = await verify(); assert.deepEqual(good.errors, []); assert.equal(good.counts.articles.generatedPages, 1);
  const missing = await verify({ readHtml: async () => { throw new Error('ENOENT'); } }); assert.ok(missing.errors.some((e) => e.includes('HTML file missing')));
  const noRecord = await verify({ manifest: manifest([]) }); assert.ok(noRecord.errors.some((e) => e.includes('fingerprint')));
});
test('offline, fixtures, snapshot proxies and wrong CMS origins cannot pass release preflight', async () => {
  for (const change of [{ source: 'local' }, { buildKind: 'fixture' }, { source: 'diagnostic', buildKind: 'diagnostic' }, { cmsOrigin: 'http://127.0.0.1:3000' }]) {
    const result = await verify({ manifest: { ...manifest(), ...change } }); assert.ok(result.errors.some((e) => e.includes('expected production CMS')));
  }
});
test('same counts do not hide swapped IDs, changed slugs or stale metadata', async () => {
  const changedId = { ...article, id: 99 };
  assert.ok((await verify({ manifest: manifest([changedId]) })).errors.length);
  const changedSlug = { ...article, slug: 'renamed' };
  assert.ok((await verify({ inventory: { ...inventory, collections: { ...inventory.collections, articles: [changedSlug] } } })).errors.some((e) => e.includes('slug change')));
  const changedSeo = { ...article, seo: { ...article.seo, ogTitle: 'New current title' } };
  assert.ok((await verify({ inventory: { ...inventory, collections: { ...inventory.collections, articles: [changedSeo] } } })).errors.some((e) => e.includes('fingerprint')));
});
test('even a valid empty CMS response cannot hide a reduction from the reviewed baseline', async () => {
  const result = await verify({ inventory: { ...inventory, collections: { ...inventory.collections, articles: [] } }, manifest: manifest([]) });
  assert.ok(result.errors.some((e) => e.includes('Unexpected reduction')));
});
test('images, publication dates, FAQ answers and visible text cannot disappear while counts stay equal', () => {
  for (const [before, after] of [['Original published text.', ''], ['A real published answer.', ''], ['original.webp', 'wrong.webp'], ['2026-01-01', '2026-01-02'], ['Original social title', 'Wrong social title']]) assert.ok(inspectDocument('articles', article, html().replace(before, after), cmsOrigin).errors.length, before);
});
test('pagination refuses absent totals, duplicate IDs, changed counts and incomplete pages', () => {
  const state = () => ({ docs: [], ids: new Set(), total: null });
  assert.throws(() => appendContentPage(state(), { docs: [article] }, 'articles'), /envelope/);
  let s = state(); assert.equal(appendContentPage(s, { docs: [article], totalDocs: 2 }, 'articles'), false);
  assert.throws(() => appendContentPage(s, { docs: [article], totalDocs: 2 }, 'articles'), /duplicate/);
  s = state(); appendContentPage(s, { docs: [article], totalDocs: 2 }, 'articles');
  assert.throws(() => appendContentPage(s, { docs: [], totalDocs: 2 }, 'articles'), /truncated/);
  s = state(); appendContentPage(s, { docs: [article], totalDocs: 2 }, 'articles');
  assert.throws(() => appendContentPage(s, { docs: [{ ...article, id: 2 }], totalDocs: 3 }, 'articles'), /total changed/);
  assert.throws(() => appendContentPage(state(), { docs: [article], totalDocs: 0 }, 'articles'), /exceeds/);
});
test('production inventory walks every page and fails on HTTP failure, malformed or unpublished documents', async () => {
  const calls = [];
  const docs = await readPublishedCollection(cmsOrigin, 'articles', { fetchImpl: async (url) => { calls.push(url); const page = Number(url.searchParams.get('page')); return Response.json({ totalDocs: 3, docs: [{ ...article, id: page, slug: `article-${page}` }] }); } });
  assert.equal(docs.length, 3); assert.equal(calls.length, 3);
  for (const response of [new Response('', { status: 403 }), Response.json({ totalDocs: 1, docs: [{ ...article, _status: 'draft' }] }), Response.json({ docs: [] })]) await assert.rejects(readPublishedCollection(cmsOrigin, 'articles', { fetchImpl: async () => response }));
});

test('legacy URLs must be permanent redirects in actual provider output', () => {
  const config = (status, destination) => ({ routes: [{ src: '^/tools/legacy$', status, headers: { Location: destination } }] });
  assert.equal(hasPermanentRedirect(config(301, '/tools/canonical'), '/tools/legacy', '/tools/canonical'), true);
  assert.equal(hasPermanentRedirect(config(302, '/tools/canonical'), '/tools/legacy', '/tools/canonical'), false);
  assert.equal(hasPermanentRedirect(config(301, '/'), '/tools/legacy', '/tools/canonical'), false);
});

test('a published tool becoming disabled or an original publication date changing requires review', async () => {
  const prior = { ...baseline, collections: { ...baseline.collections, articles: [{ id: '1', slug: article.slug, publishDate: '2025-12-01T00:00:00.000Z' }] } };
  assert.ok((await verify({ baseline: prior })).errors.some((e) => e.includes('publication date change')));
  const tool = { id: 12, slug: 'bmi-calculator', name: 'BMI', enabled: false };
  const inv = { ...inventory, collections: { ...inventory.collections, tools: [tool] } };
  const prev = { ...baseline, collections: { ...baseline.collections, tools: [{ id: '12', slug: tool.slug, enabled: true }] } };
  assert.ok((await verify({ inventory: inv, baseline: prev })).errors.some((e) => e.includes('was disabled')));
});

test('pSEO uses its custom published status and denies unknown inventory instead of assuming zero', async () => {
  const doc = { id: 9, slug: 'generated-guide', status: 'published', headline: 'Generated guide', bodyHtml: '<p>Original generated content.</p>', seo: {} };
  let query;
  const pages = await readPublishedCollection(cmsOrigin, 'pseo-pages', { fetchImpl: async (url) => { query = url; return Response.json({ totalDocs: 1, docs: [doc] }); } });
  assert.equal(pages.length, 1); assert.equal(query.searchParams.get('where[status][equals]'), 'published');
  assert.equal(query.searchParams.get('where[_status][equals]'), null);
  await assert.rejects(readPublishedInventory(cmsOrigin, { fetchImpl: async (url) => url.pathname.endsWith('/pseo-pages') ? new Response('', { status: 403 }) : Response.json({ docs: [], totalDocs: 0 }) }), /pseo-pages.*HTTP 403/);
  const unknown = { ...inventory, collections: { articles: [article], tools: [], pages: [] } };
  assert.ok((await verify({ inventory: unknown })).errors.some((e) => e.includes('Missing live inventory for pseo-pages')));
});

test('pSEO preservation includes published body and SEO but never generation inputs', async () => {
  const doc = { id: 9, slug: 'generated-guide', status: 'published', headline: 'Generated guide', bodyHtml: '<p>Original generated content.</p>', seo: {}, variables: { private: 'private-test-marker' }, dataset: 7 };
  assert.deepEqual(documentProof('pseo-pages', doc), documentProof('pseo-pages', { ...doc, variables: { private: 'different' }, dataset: 99 }));
  assert.notEqual(documentProof('pseo-pages', doc).digest, documentProof('pseo-pages', { ...doc, bodyHtml: 'Missing content' }).digest);
  const record = { collection: 'pseo-pages', docId: '9', path: '/tools/pseo/generated-guide', proof: documentProof('pseo-pages', doc) };
  const inv = { ...inventory, collections: { ...inventory.collections, 'pseo-pages': [doc] } };
  const prev = { ...baseline, collections: { ...baseline.collections, 'pseo-pages': [{ id: '9', slug: doc.slug }] } };
  const result = await verify({ inventory: inv, baseline: prev, manifest: { ...manifest(), records: [...manifest().records, record] }, readHtml: async (path) => { if (path.includes('/pseo/')) throw new Error('ENOENT'); return html(); } });
  assert.ok(result.errors.some((e) => e.includes('pseo-pages ID 9') && e.includes('HTML file missing')));
});

test('an unverified pSEO baseline cannot be turned into an assumed zero count', async () => {
  const result = await verify({ baseline: { ...baseline, unverifiedCollections: ['pseo-pages'] } });
  assert.ok(result.errors.some((e) => e.includes('still unverified for pseo-pages')));
});

test('article toolEmbed blocks must render their canonical tool with a live calculator (Roadmap 6.3)', () => {
  const embedDoc = (tool) => ({ ...article, layout: [...article.layout, { blockType: 'toolEmbed', tool, label: 'Try it' }] });
  const card = (slug, island = true) => `<div class="wh-embed" data-tool="${slug}"><div class="wh-embed__head"></div>${island ? '<astro-island uid="x" component-url="/c.js"></astro-island>' : '<p>This tool is coming soon.</p>'}</div>`;
  const run = (doc, extra) => inspectDocument('articles', doc, html(doc) + extra, cmsOrigin).errors;
  const live = { slug: 'bmi-calculator', enabled: true };
  assert.deepEqual(run(embedDoc(live), card('bmi-calculator')), []);
  // Unknown or unpublished tool: ToolEmbed renders nothing.
  assert.ok(run(embedDoc(live), '').some((e) => e.includes('toolEmbed bmi-calculator renders nothing')));
  // Card without an interactive island.
  assert.ok(run(embedDoc(live), card('bmi-calculator', false)).some((e) => e.includes('has no interactive calculator')));
  // A disabled tool may show the "coming soon" card.
  assert.deepEqual(run(embedDoc({ slug: 'bmi-calculator', enabled: false }), card('bmi-calculator', false)), []);
  // Aliases resolve to their canonical tool.
  assert.deepEqual(run(embedDoc({ slug: 'body-fat-percentage-calculator', enabled: true }), card('body-fat-calculator')), []);
  assert.ok(run(embedDoc(null), '').some((e) => e.includes('toolEmbed block has no tool')));
});

test('a tool-focused article must embed its primary tool: wrong and missing embeds fail (Roadmap 6.3)', async () => {
  const { articleToolIntegration, checkArticleToolGates } = await import('../preflight.mjs');
  const embed = (slug) => ({ blockType: 'toolEmbed', tool: { slug, enabled: true } });
  const art = (primary, ...embeds) => ({ id: 7, slug: 'healthy-waist-to-height-ratio', primaryTool: primary && { slug: primary }, layout: [{ blockType: 'text', text: 'x' }, ...embeds.map(embed)] });
  // Consistent, including aliases on either side.
  assert.equal(articleToolIntegration(art('waist-to-height-ratio-calculator', 'waist-to-height-ratio-calculator')), null);
  assert.equal(articleToolIntegration(art('body-fat-percentage-calculator', 'body-fat-calculator')), null);
  assert.equal(articleToolIntegration(art('body-fat-calculator', 'body-fat-percentage-calculator')), null);
  // An extra secondary embed is fine as long as the primary one is present.
  assert.equal(articleToolIntegration(art('bmi-calculator', 'bmi-calculator', 'waist-to-height-ratio-calculator')), null);
  // Not tool-focused: no requirement.
  assert.equal(articleToolIntegration(art(null)), null);
  assert.equal(articleToolIntegration(art(null, 'bmi-calculator')), null);
  // The two real cases recorded by the Phase 3 audit.
  assert.deepEqual(articleToolIntegration(art('waist-to-height-ratio-calculator', 'lean-body-mass-calculator')), { kind: 'wrong', expected: 'waist-to-height-ratio-calculator', actual: 'lean-body-mass-calculator' });
  assert.deepEqual(articleToolIntegration(art('waist-to-hip-ratio-calculator')), { kind: 'missing', expected: 'waist-to-hip-ratio-calculator', actual: '' });
  // Unlisted defects fail; exact gates hold; stale or changed gates fail.
  const wrong = art('waist-to-height-ratio-calculator', 'lean-body-mass-calculator');
  assert.match(checkArticleToolGates([wrong], [])[0], /embeds lean-body-mass-calculator instead of primary tool waist-to-height-ratio-calculator/);
  const gate = { id: 7, slug: wrong.slug, kind: 'wrong', expected: 'waist-to-height-ratio-calculator', actual: 'lean-body-mass-calculator' };
  assert.deepEqual(checkArticleToolGates([wrong], [gate]), []);
  assert.match(checkArticleToolGates([art('waist-to-height-ratio-calculator', 'waist-to-height-ratio-calculator')], [gate])[0], /gate is stale/);
  assert.match(checkArticleToolGates([art('waist-to-height-ratio-calculator', 'bmi-calculator')], [gate])[0], /no longer matches the live record/);
  assert.match(checkArticleToolGates([], [gate])[0], /does not match any published article/);
});

test('an editorially recorded intended tool catches a wrong primaryTool relationship', async () => {
  const { articleToolIntegration, checkArticleToolGates } = await import('../preflight.mjs');
  const doc = { id: 9, slug: 'healthy-waist-to-height-ratio', primaryTool: { slug: 'lean-body-mass-calculator' }, layout: [{ blockType: 'toolEmbed', tool: { slug: 'lean-body-mass-calculator' } }] };
  // Without the editorial expectation, relation and embed agree, so it looks consistent.
  assert.equal(articleToolIntegration(doc), null);
  assert.deepEqual(articleToolIntegration(doc, 'waist-to-height-ratio-calculator'), { kind: 'wrong-primary', expected: 'waist-to-height-ratio-calculator', actual: 'lean-body-mass-calculator,lean-body-mass-calculator' });
  assert.match(checkArticleToolGates([doc], [], { 'healthy-waist-to-height-ratio': 'waist-to-height-ratio-calculator' })[0], /editorial audit's intended tool is waist-to-height-ratio-calculator/);
  const fixed = { ...doc, primaryTool: { slug: 'waist-to-height-ratio-calculator' }, layout: [{ blockType: 'toolEmbed', tool: { slug: 'waist-to-height-ratio-calculator' } }] };
  assert.deepEqual(checkArticleToolGates([fixed], [], { 'healthy-waist-to-height-ratio': 'waist-to-height-ratio-calculator' }), []);
});

test('the committed gate file is well-formed and every gate names its correction', async () => {
  const { readFile } = await import('node:fs/promises');
  const g = JSON.parse(await readFile(new URL('../article-tool-gates.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(g.gates) && typeof g.editorialPrimary === 'object');
  for (const x of g.gates) {
    for (const k of ['id', 'slug', 'kind', 'expected', 'evidence', 'correction']) assert.ok(x[k] !== undefined && x[k] !== '', `${x.slug}: ${k}`);
    assert.ok(['missing', 'wrong', 'wrong-primary'].includes(x.kind));
  }
  assert.equal(new Set(g.gates.map((x) => String(x.id))).size, g.gates.length);
});

test('production gates never apply to a fixture or synthetic CMS inventory', async () => {
  const { readFile } = await import('node:fs/promises');
  const g = JSON.parse(await readFile(new URL('../article-tool-gates.json', import.meta.url), 'utf8'));
  assert.equal(g.cmsOrigin, 'https://cms.healthylifesstyles.com');
  // A fixture inventory (other origin) with no tool-focused articles passes with the real gate file.
  const result = await verify({ toolGates: g });
  assert.deepEqual(result.errors, []);
  // On the production origin, the same gates against an inventory without those articles are reported as stale.
  const prod = await verifyContent({ inventory: { ...inventory, cmsOrigin: g.cmsOrigin }, baseline: { ...baseline, cmsOrigin: g.cmsOrigin }, manifest: { ...manifest(), cmsOrigin: g.cmsOrigin }, readHtml: async () => html(), toolGates: g });
  assert.ok(prod.errors.some((e) => /does not match any published article/.test(e)));
});
