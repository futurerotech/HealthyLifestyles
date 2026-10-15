import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

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
    { slug: 'body-fat-percentage-calculator', name: 'Legacy', enabled: true },
    { slug: 'body-fat-calculator', name: 'Canonical', enabled: true, seo: { metaTitle: 'From CMS' } },
  ] })) as typeof fetch;
  const cms = await fresh();
  assert.equal((await cms.getTools()).length, 1);
  assert.equal((await cms.getTool('body-fat-percentage-calculator'))?.title, 'Canonical');
  assert.equal((await cms.getTool('body-fat-calculator'))?.seo?.metaTitle, 'From CMS');
});

test('production aborts an incomplete CMS response instead of mixing stale local content', async () => {
  globalThis.fetch = (async (input) => {
    const page = new URL(String(input)).searchParams.get('page');
    return page === '1' ? Response.json({ totalDocs: 2, docs: [{ slug: 'cms-only', title: 'CMS', layout: [] }] }) : new Response('', { status: 503 });
  }) as typeof fetch;
  const cms = await fresh();
  await assert.rejects(cms.getArticles(), /unreachable/);
});

test('an enabled legacy alias cannot resurrect a disabled or unpublished canonical tool', async () => {
  globalThis.fetch = (async () => Response.json({ totalDocs: 1, docs: [{ slug: 'body-fat-percentage-calculator', name: 'Legacy', enabled: true }] })) as typeof fetch;
  const cms = await fresh();
  assert.deepEqual(await cms.getTools(), []);
  assert.equal(await cms.getTool('body-fat-calculator'), undefined);
});
