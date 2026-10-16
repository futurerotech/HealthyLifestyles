import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import type { ArticleBlock } from '../../../src/data/articles';

const env = { CMS_URL: 'https://cms.example.test', CMS_DISABLE: '0' };
const sourceRoot = new URL('../../../src/', import.meta.url).href;
(globalThis as any).__cmsSnapshotEnv = env;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[a-z]+(?:\?.*)?$/i.test(specifier)) specifier += '.ts';
    return next(specifier, context);
  },
  load(url, context, next) {
    const result = next(url, context);
    if (url.startsWith(sourceRoot) && result.source) return { ...result, source: String(result.source).replaceAll('import.meta.env', '(globalThis as any).__cmsSnapshotEnv') };
    return result;
  },
});
const originalFetch = globalThis.fetch;
const originalEnv = { CMS_URL: process.env.CMS_URL, CMS_DISABLE: process.env.CMS_DISABLE, VERCEL_ENV: process.env.VERCEL_ENV };
let run = 0;
const fresh = () => import(`../../../src/lib/cms.ts?case=${++run}`);
beforeEach(() => { process.env.CMS_URL = env.CMS_URL; process.env.CMS_DISABLE = '0'; process.env.VERCEL_ENV = 'production'; });
after(() => { globalThis.fetch = originalFetch; for (const [k, v] of Object.entries(originalEnv)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });

test('list, individual article, and pagination use one authoritative CMS snapshot', async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (input) => {
    const url = new URL(String(input)); calls.push(url.href);
    assert.equal(url.searchParams.get('where[_status][equals]'), 'published');
    const page = Number(url.searchParams.get('page'));
    return Response.json({ totalDocs: 2, docs: [{ id: page, slug: `article-${page}`, title: `CMS article ${page}`, _status: 'published', layout: [], seo: { canonical: '/preferred', noIndex: true, ogTitle: 'Social title', ogImage: { url: '/image.png' } } }] });
  }) as typeof fetch;
  const cms = await fresh();
  const list = await cms.getArticles();
  assert.equal(list.length, 2);
  assert.equal((await cms.getArticle('article-1'))?.title, 'CMS article 1');
  assert.equal((await cms.getArticle('missing')), null);
  assert.equal(calls.length, 2, 'No per-page refetch and no local resurrection');
  assert.deepEqual(list[0].seo, { canonical: '/preferred', noIndex: true, ogTitle: 'Social title', ogImage: 'https://cms.example.test/image.png', twitterImage: undefined });
});

test('empty and disabled CMS catalogues do not resurrect local tools', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 0, docs: [] })) as typeof fetch;
  const cms = await fresh();
  assert.deepEqual(await cms.getTools(), []);
  assert.deepEqual(await cms.getToolsByCategory('nutrition'), []);
  assert.deepEqual(await cms.getPopularTools(), []);
});

test('alias documents cannot create duplicate or unimplemented tool pages', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 2, docs: [
    { id: 1, slug: 'body-fat-percentage-calculator', name: 'Legacy', enabled: true },
    { id: 2, slug: 'body-fat-calculator', name: 'Canonical', enabled: true, seo: { metaTitle: 'From CMS' } },
  ] })) as typeof fetch;
  const cms = await fresh();
  assert.equal((await cms.getTools()).length, 1);
  assert.equal((await cms.getTool('body-fat-percentage-calculator'))?.title, 'Canonical');
  assert.equal((await cms.getTool('body-fat-calculator'))?.seo?.metaTitle, 'From CMS');
});

test('production aborts an incomplete CMS response instead of mixing stale local content', async () => {
  globalThis.fetch = (async (input) => {
    const page = new URL(String(input)).searchParams.get('page');
    return page === '1' ? Response.json({ totalDocs: 2, docs: [{ id: 1, slug: 'cms-only', title: 'CMS', layout: [] }] }) : new Response('', { status: 503 });
  }) as typeof fetch;
  const cms = await fresh();
  await assert.rejects(cms.getArticles(), /unreachable/);
});

test('an enabled legacy alias cannot resurrect a disabled or unpublished canonical tool', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 1, docs: [{ id: 1, slug: 'body-fat-percentage-calculator', name: 'Legacy', enabled: true }] })) as typeof fetch;
  const cms = await fresh();
  assert.deepEqual(await cms.getTools(), []);
  assert.equal(await cms.getTool('body-fat-calculator'), undefined);
});

test('a configured CMS failure cannot silently use local articles outside Vercel production', async () => {
  delete process.env.VERCEL_ENV;
  process.env.ALLOW_LOCAL_CONTENT_FALLBACK = 'true';
  globalThis.fetch = (async () => new Response('', { status: 503 })) as typeof fetch;
  try { await assert.rejects((await fresh()).getArticles(), /Refusing stale LOCAL/); }
  finally { delete process.env.ALLOW_LOCAL_CONTENT_FALLBACK; }
});

test('separate CMS FAQs are preserved without duplicating visible block FAQs', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 1, docs: [{ id: 42, slug: 'preserved', title: 'Preserved article', publishDate: '2026-01-01T00:00:00Z', heroImage: { url: 'https://images.example.test/hero.webp', alt: 'Original hero' }, layout: [{ blockType: 'peopleAlsoAsk', items: [{ question: 'Existing?', answer: 'Existing answer.' }] }], faq: [{ question: 'Existing?', answer: 'Existing answer.' }, { question: 'Separate?', answer: 'Separate original answer.' }] }] })) as typeof fetch;
  const result = (await (await fresh()).getArticles())[0];
  assert.equal(result.cmsId, '42');
  assert.equal(result.publishDate, '2026-01-01');
  assert.equal(result.heroImage?.url, 'https://images.example.test/hero.webp');
  assert.deepEqual(result.body.flatMap((b: ArticleBlock) => b.type === 'paa' ? b.items : []), [{ q: 'Existing?', a: 'Existing answer.' }, { q: 'Separate?', a: 'Separate original answer.' }]);
});

test('invalid published article fields fail instead of dropping the record', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 1, docs: [{ id: 4, title: 'Missing required slug' }] })) as typeof fetch;
  await assert.rejects((await fresh()).getArticles(), /cannot omit it silently/);
});

test('public pSEO reads paginate published pages, whitelist fields, and share one snapshot without credentials', async () => {
  const calls: URL[] = [];
  globalThis.fetch = (async (input, options) => {
    const url = new URL(String(input)); calls.push(url);
    assert.equal(url.searchParams.get('where[status][equals]'), 'published');
    assert.equal(url.searchParams.get('select[bodyHtml]'), 'true');
    assert.equal(url.searchParams.get('select[variables]'), null);
    assert.equal(new Headers(options?.headers).has('authorization'), false);
    const page = Number(url.searchParams.get('page'));
    return Response.json({ totalDocs: 3, docs: [{ id: page, slug: `generated-${page}`, status: 'published', headline: `Generated ${page}`, bodyHtml: '<p>Published original content.</p>', variables: { private: 'private-test-marker' }, dataset: 17, template: 4 }] });
  }) as typeof fetch;
  const cms = await fresh();
  const pages = await cms.getPseoPages();
  assert.equal(pages.length, 3); assert.equal(calls.length, 3);
  assert.strictEqual(await cms.getPseoPages(), pages);
  assert.ok(!JSON.stringify(pages).includes('private-test-marker'));
  assert.ok(!('dataset' in pages[0]) && !('template' in pages[0]));
});

test('pSEO HTTP 403 stops with an actionable access-control error and no fallback', async () => {
  globalThis.fetch = (async () => new Response('', { status: 403 })) as typeof fetch;
  await assert.rejects((await fresh()).getPseoPages(), /HTTP 403.*Public reads.*No local fallback/);
});

test('pSEO rejects drafts even if a CMS response incorrectly ignores the publication filter', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 1, docs: [{ id: 1, slug: 'draft', status: 'draft', headline: 'Private', bodyHtml: '<p>Private</p>' }] })) as typeof fetch;
  await assert.rejects((await fresh()).getPseoPages(), /Invalid published pSEO/);
});

test('only a successful complete pSEO response may establish an empty collection', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 0, docs: [] })) as typeof fetch;
  assert.deepEqual(await (await fresh()).getPseoPages(), []);
});
