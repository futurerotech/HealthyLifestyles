import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  PUBLIC_ORIGIN,
  assertIndexableTagHtml,
  verifyPublicTagSitemap,
} from '../verify-public-tag-sitemap.mjs';

const ROOT = PUBLIC_ORIGIN;
const names = ['nutrition', 'sleep', 'strength-training'];
const tag = slug => ROOT + '/wellness-hub/tag/' + slug;
const indexUrl = ROOT + '/sitemap-index.xml';
const childUrl = ROOT + '/sitemap-0.xml';
const hubUrl = ROOT + '/wellness-hub';
const tagHtml = slug => '<!doctype html><html><head>' +
  '<meta content="max-image-preview:large" name="robots">' +
  '<link href="' + tag(slug) + '" rel="canonical"></head>' +
  '<body><h1>' + slug + ' Articles</h1><p>2 articles</p></body></html>';
const childXml = urls => '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  urls.map(url => '<url><loc>' + url + '</loc></url>').join('') + '</urlset>';
const indexXml = urls => '<?xml version="1.0"?><sitemapindex>' +
  urls.map(url => '<sitemap><loc>' + url + '</loc></sitemap>').join('') + '</sitemapindex>';

function fixture({ index = indexXml([childUrl]), sitemap = childXml([hubUrl, ...names.map(tag)]),
    hub = names.map(n => '<a href="/wellness-hub/tag/' + n + '">Tag</a>').join(''),
    htmlBySlug = {}, responseOverrides = {} } = {}) {
  const pages = new Map([
    [indexUrl, index], [childUrl, sitemap],
    [hubUrl, '<html><body>' + hub + '</body></html>'],
    ...names.map(n => [tag(n), htmlBySlug[n] ?? tagHtml(n)]),
  ]);
  const calls = [];
  async function fetcher(url, options) {
    calls.push({url, options});
    if (url in responseOverrides) return responseOverrides[url];
    assert.ok(pages.has(url), 'unexpected URL attempted: ' + url);
    return new Response(pages.get(url), {status:200});
  }
  return {fetcher, calls};
}

test('valid postdeploy sitemap contains every linked tag and sampled pages are indexable', async () => {
  const x = fixture();
  const result = await verifyPublicTagSitemap({fetcher:x.fetcher});
  assert.equal(result.verified, true);
  assert.equal(result.linkedTagArchives, 3);
  assert.equal(result.listedTagArchives, 3);
  assert.equal(result.tagPageSamplesVerified, 3);
  assert.equal(result.totalSitemapURLs, 4);
  assert.equal(result.indexingSubmissionRequests, 0);
  assert.equal(result.productionWrites, 0);
  assert.equal(x.calls.length, 6); // index, child sitemap, hub, 3 pages
  assert.ok(x.calls.every(c => c.url.startsWith(ROOT + '/') &&
    c.options.method === 'GET' && c.options.redirect === 'manual' &&
    c.options.credentials === 'omit' && c.options.signal));
});

test('predeployment public sitemap with zero tags is explicitly NO-GO', async () => {
  const x = fixture({sitemap:childXml([hubUrl])});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:x.fetcher}), /zero Wellness Hub tag archives/);
  assert.equal(x.calls.length, 2);
});

test('missing a linked tag fails even if some archives are listed', async () => {
  const x = fixture({sitemap:childXml([hubUrl,tag('nutrition')])});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:x.fetcher}), /omits 2 linked/);
  assert.equal(x.calls.length, 3);
});

test('unexpected external child sitemap is refused before reaching outside origin', async () => {
  const x = fixture({index:indexXml(['https://untrusted.example/sitemap-0.xml'])});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:x.fetcher}), /Unexpected sitemap location/);
  assert.deepEqual(x.calls.map(x => x.url), [indexUrl]);
});

test('duplicate sitemap URLs and legacy tag aliases fail closed', async () => {
  const duplicated = fixture({sitemap:childXml([hubUrl,tag('nutrition'),tag('nutrition')])});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:duplicated.fetcher}), /duplicated sitemap/);
  const legacy = fixture({sitemap:childXml([hubUrl, ...names.map(tag), ROOT + '/tag/nutrition'])});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:legacy.fetcher}), /Legacy \/tag/);
});

test('noindex meta or mismatched canonical on tag archives rejects release', async () => {
  assert.throws(() => assertIndexableTagHtml(
    '<link rel="canonical" href="' + tag('nutrition') + '"><meta name="robots" content="noindex,follow">',
    tag('nutrition')), /noindex/);
  assert.throws(() => assertIndexableTagHtml(
    '<link rel="canonical" href="' + tag('sleep') + '">',
    tag('nutrition')), /canonical mismatch/);
  const x = fixture({htmlBySlug:{
    sleep: '<meta content="noindex" name="googlebot"><link href="' + tag('sleep') + '" rel="canonical">',
  }});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:x.fetcher}), /noindex/);
});

test('redirects and oversized sitemap responses are not followed or accepted', async () => {
  const redir = fixture({responseOverrides:{
    [indexUrl]: new Response(null,{status:302,headers:{location:'/different.xml'}}),
  }});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:redir.fetcher}), /direct HTTP 200/);
  const tooLarge = fixture({responseOverrides:{
    [indexUrl]: new Response(indexXml([childUrl]),{
      status:200, headers:{'content-length':String(3*1024*1024)},
    }),
  }});
  await assert.rejects(() => verifyPublicTagSitemap({fetcher:tooLarge.fetcher}), /size limit/);
});

test('real Node CLI defaults to inert --check and refuses unauthorized --verify', () => {
  const script = resolve('scripts/seo/verify-public-tag-sitemap.mjs');
  const invoke = args => spawnSync(process.execPath,[script,...args],{
    env:{PATH:process.env.PATH||''},encoding:'utf8',timeout:5000,maxBuffer:16000,
  });
  const check = invoke([]);
  assert.equal(check.status,0);
  assert.match(check.stdout,/CHECK_ONLY/);
  assert.equal(check.stderr,'');
  const denied = invoke(['--verify']);
  assert.equal(denied.status,1);
  assert.equal(denied.stdout,'');
  assert.match(denied.stderr,/PUBLIC_TAG_SITEMAP_NO_GO/);
});
