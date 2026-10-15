import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { TOOLS } = await import('../../src/data/tools.ts');
const { CATEGORIES } = await import('../../src/data/categories.ts');
const { AUTHORS } = await import('../../src/data/authors.ts');
const updatedAt = '2026-10-15T10:00:00.000Z';
const disabled = 'hrv-explainer-log';
const category = { id: 90, name: 'Nutrition', slug: 'nutrition', kind: 'section', updatedAt };
const article = (slug, seo = {}) => ({ id: slug, slug, title: `Guide ${slug}`, excerpt: 'A published CMS guide with a real calculator link.', publishDate: '2026-07-01', updatedDate: '2026-07-02', updatedAt, _status: 'published', category, author: { name: AUTHORS[0].name }, layout: [{ blockType: 'text', style: 'p', text: 'Use the [legacy body fat link](/tools/body-fat-percentage-calculator) or the [BMI calculator](/tools/bmi-calculator).' }], seo });
const catalogue = {
  tools: [...TOOLS.map((t, i) => ({ ...t, id: i + 1, name: t.title, _status: 'published', enabled: t.slug !== disabled, updatedAt, category: CATEGORIES.find((c) => c.id === t.category), seo: { metaTitle: `CMS ${t.title}`, metaDescription: t.blurb } })), ...['body-fat-percentage-calculator', 'how-much-protein-do-i-need'].map((slug) => ({ id: slug, slug, name: slug, _status: 'published', enabled: true, updatedAt }))],
  articles: [article('calories-burned-calculator-guide'), article('how-many-calories-to-lose-weight'), article('how-to-calculate-your-macros'), article('hidden-guide', { noIndex: true }), article('duplicate-guide', { canonical: '/wellness-hub/calories-burned-calculator-guide' })],
  categories: [...CATEGORIES.map((c) => ({ ...c, name: c.name, kind: 'tool', updatedAt })), category],
  authors: AUTHORS.map((a, i) => ({ ...a, id: i + 1, updatedAt })),
  pages: [{ id: 1, slug: 'custom-guide', title: 'Custom page', _status: 'published', updatedAt, seo: { metaTitle: 'CMS custom title', metaDescription: 'CMS custom description', ogTitle: 'CMS social title', twitterTitle: 'CMS Twitter title' }, layout: [{ blockType: 'text', text: 'CMS page body is rendered.' }] }],
  tags: [],
  redirects: [{ id: 1, from: '/old-bmi', to: '/tools/bmi-calculator', type: '301', updatedAt }],
  'pseo-pages': [{ id: 1, slug: 'generated-guide', headline: 'Generated guide', bodyHtml: '<p>A published generated guide.</p>', status: 'published', updatedAt, ctaUrl: '/tools/bmi-calculator', ctaText: 'Calculate' }],
};
const cmsEditedTool = catalogue.tools.find((t) => t.slug === 'body-fat-calculator');
catalogue.articles[0].layout.push(
  { blockType: 'hero', title: 'Inline CMS article hero' },
  { blockType: 'calculatorEmbed', tool: { slug: 'bmi-calculator', name: 'BMI' } },
  { blockType: 'twoColumn', heading: 'CMS article columns', text: 'CMS column body.' },
  { blockType: 'viralHookBanner', hook: 'CMS article banner' },
);
cmsEditedTool.whatItIs = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'CMS revised tool explanation.' }] }] } };
cmsEditedTool.faq = [{ question: 'CMS question?', answer: 'CMS answer.' }];
const requests = new Map();
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  requests.set(url.pathname + url.search, (requests.get(url.pathname + url.search) || 0) + 1);
  res.setHeader('Content-Type', 'application/json');
  if (url.pathname.startsWith('/api/globals/')) {
    const slug = url.pathname.split('/').pop();
    res.end(JSON.stringify({ id: 1, updatedAt, ...(slug === 'ad-management' ? { adsenseEnabled: false, slots: [] } : slug === 'lead-gen' ? { enabled: false, offers: [] } : {}) }));
    return;
  }
  const name = url.pathname.split('/')[2];
  let docs = catalogue[name] || [];
  if (url.searchParams.has('locale')) docs = [];
  if (url.searchParams.get('where[enabled][equals]') === 'true') docs = docs.filter((d) => d.enabled);
  const kind = url.searchParams.get('where[kind][equals]');
  if (kind) docs = docs.filter((d) => d.kind === kind);
  const page = Number(url.searchParams.get('page') || 1);
  const size = 50;
  res.end(JSON.stringify({ totalDocs: docs.length, docs: docs.slice((page - 1) * size, page * size) }));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
let output = '';
try {
  const env = { ...process.env, CMS_DISABLE: '0', CMS_URL: `http://127.0.0.1:${server.address().port}`, VERCEL_ENV: 'production', INDEXNOW_DISABLE: 'true' };
  const child = spawn(process.execPath, [resolve('node_modules/astro/astro.js'), 'build'], { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  const exit = await new Promise((done) => { child.on('error', (error) => done(error.message)); child.on('exit', done); });
  assert.equal(exit, 0, output.slice(-7000));
  const html = (path) => readFile(resolve(`dist/client/${path}/index.html`), 'utf8');
  const custom = await html('custom-guide');
  assert.match(custom, /<title>CMS custom title<\/title>/);
  assert.match(custom, /property="og:title" content="CMS social title"/);
  assert.match(custom, /name="twitter:title" content="CMS Twitter title"/);
  assert.match(custom, /CMS page body is rendered\./);
  const bodyFat = await html('tools/body-fat-calculator');
  assert.match(bodyFat, /<title>CMS Body Fat Calculator<\/title>/);
  assert.match(bodyFat, /CMS revised tool explanation\./);
  assert.match(bodyFat, /CMS question\?/);
  await assert.rejects(access(resolve(`dist/client/tools/${disabled}/index.html`)));
  const renderedArticle = await html('wellness-hub/calories-burned-calculator-guide');
  assert.match(renderedArticle, /href="\/tools\/body-fat-calculator"/);
  assert.doesNotMatch(renderedArticle, /href="\/tools\/body-fat-percentage-calculator"/);
  assert.match(renderedArticle, /<h2[^>]*>Inline CMS article hero<\/h2>/);
  assert.match(renderedArticle, /CMS article columns/);
  assert.match(renderedArticle, /CMS article banner/);
  assert.doesNotMatch(renderedArticle, /cms\.healthylifesstyles\.com\/embed\//);
  const hub = await html('wellness-hub');
  assert.doesNotMatch(hub, /\[object Promise\]/);
  const xml = await readFile('dist/client/sitemap-0.xml', 'utf8');
  assert.ok(xml.includes('/tools/pseo/generated-guide'));
  assert.ok(!xml.includes('/wellness-hub/hidden-guide'));
  assert.ok(!xml.includes('/wellness-hub/duplicate-guide'));
  assert.match(await html('wellness-hub/hidden-guide'), /content="noindex, follow"/);
  const providerXml = await readFile('.vercel/output/static/sitemap-0.xml', 'utf8');
  assert.equal(providerXml, xml, 'Deployment output must use the filtered sitemap too');
  const manifest = JSON.parse(await readFile('dist/client/content-manifest.json', 'utf8'));
  assert.equal(manifest.source, 'cms');
  assert.ok(manifest.collections.includes('redirects'));
  assert.ok(manifest.records.some((r) => r.collection === 'pseo-pages'));
  assert.ok([...requests.entries()].filter(([url]) => url.startsWith('/api/articles?')).every(([, n]) => n === 1), 'Pages must share article requests');
  console.log('CMS integration build passed: SEO/social metadata, aliases, disabled tools, pSEO, noindex/canonical sitemap policy, provider output, shared snapshot, deployment manifest.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await new Promise((done) => server.close(done));
}
