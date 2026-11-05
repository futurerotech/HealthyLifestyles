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

test('Hub discovery ignores raw title text containing fake tag anchors', async () => {
  const document = '<!doctype html><html><head>' +
    '<title data-note="1 > 0">Example <a href="/wellness-hub/tag/ghost-title"></title>' +
    '</head><body>' +
    names.map(n => '<a href="/wellness-hub/tag/' + n + '">Tag</a>').join('') +
    '</body></html>';
  const x = fixture({ responseOverrides: {
    [hubUrl]: new Response(document, {status: 200}),
  } });
  const result = await verifyPublicTagSitemap({fetcher: x.fetcher});
  assert.equal(result.linkedTagArchives, names.length);
  assert.equal(result.tagPageSamplesVerified, names.length);
  assert.equal(x.calls.length, 6);
});

test('Hub discovery excludes fake tag links in comments, scripts and quoted attributes', async () => {
  const real = names.map(n => '<a href="/wellness-hub/tag/' + n + '">Tag</a>').join('');
  const examples = '<!-- <a href="/wellness-hub/tag/ghost-comment"> -->' +
    '<script>var example = "<a href=/wellness-hub/tag/ghost-script>";</script>' +
    '<style>.sample::before { content: "<a href=/wellness-hub/tag/ghost-style>"; }</style>' +
    '<template><a href="/wellness-hub/tag/ghost-template">Example</a></template>' +
    '<div data-note="<a href=' + "'/wellness-hub/tag/ghost-attribute'" + '>">Text</div>';
  const x = fixture({ hub: real + examples });
  const result = await verifyPublicTagSitemap({ fetcher: x.fetcher });
  assert.equal(result.linkedTagArchives, names.length);
  assert.equal(result.tagPageSamplesVerified, names.length);
  assert.equal(x.calls.length, 6);
});

test('Hub link parser preserves href after a quoted greater-than and ignores attribute text', async () => {
  const hub = '<a data-note="1 > 0" href="/wellness-hub/tag/nutrition">Nutrition</a>' +
    '<a href="/wellness-hub/tag/sleep">Sleep</a>' +
    '<a data-note=" href=' + "'/wellness-hub/tag/ghost-attribute'" +
    ' " href="/wellness-hub/tag/strength-training">Strength</a>';
  const x = fixture({ hub });
  const result = await verifyPublicTagSitemap({ fetcher: x.fetcher });
  assert.equal(result.linkedTagArchives, 3);
  assert.equal(result.tagPageSamplesVerified, 3);
  assert.equal(x.calls.length, 6);
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

test('postdeploy uses shared indexability rules for unquoted attributes and canonical variants', () => {
  const url = tag('nutrition');
  assert.throws(() => assertIndexableTagHtml(
    '<meta content=noindex name=robots><link href=' + url + ' rel=CANONICAL>', url), /noindex/);
  assert.throws(() => assertIndexableTagHtml(
    '<meta name=googlebot content=none><link rel=canonical href=' + url + '>', url), /noindex/);
  assert.throws(() => assertIndexableTagHtml(
    '<link href=' + url + ' rel=canonical><link rel=canonical href=' + url + '>', url), /canonical mismatch/);
  assert.doesNotThrow(() => assertIndexableTagHtml(
    '<meta content=follow name=robots><link href=' + url + ' rel=CANONICAL>', url));
});

test('live X-Robots-Tag noindex/none disqualifies a tag sample despite indexable HTML', async () => {
  for (const directive of ['noindex', 'googlebot: none']) {
    const url = tag('nutrition');
    const x = fixture({ responseOverrides: {
      [url]: new Response(tagHtml('nutrition'), {
        status: 200, headers: { 'X-Robots-Tag': directive },
      }),
    } });
    await assert.rejects(() => verifyPublicTagSitemap({fetcher:x.fetcher}), /X-Robots-Tag/);
    assert.deepEqual(x.calls.map(c => c.url), [indexUrl, childUrl, hubUrl, url]);
  }
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
