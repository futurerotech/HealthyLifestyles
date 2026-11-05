/**
 * Check original server HTML, never the post-hydration DOM.
 * No page body, credentials or headers are logged.
 * X-Robots-Tag from Preview authentication is NOT checked here.
 */
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
const LIMIT = 4_000_000;

function attrs(tag) {
  const out = Object.create(null);
  for (const m of tag.matchAll(/([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/gi)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
}

export function assertRawArticleHead(html, expected) {
  assert.equal(typeof html, 'string', 'Missing original HTML document');
  assert.ok(Buffer.byteLength(html, 'utf8') <= LIMIT, 'Raw HTML exceeds safe size limit');
  assert.match(expected, /^https:\/\/www\.healthylifesstyles\.com\/wellness-hub\/[a-z0-9-]+$/,
    'Expected canonical must be an exact public article URL');
  const match = html.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head\s*>/i);
  assert.ok(match, 'Missing complete original HTML head');
  const head = match[1].replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  const canonical = [...head.matchAll(/<link\b[^>]*>/gi)]
    .map(x => attrs(x[0])).filter(x => (x.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
  assert.equal(canonical.length, 1, 'SSR must have exactly one canonical link');
  assert.equal(canonical[0].href, expected, 'SSR canonical must be the exact production article URL');
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(x => attrs(x[0]));
  const og = metas.filter(x => (x.property || '').toLowerCase() === 'og:url');
  assert.equal(og.length, 1, 'SSR must have exactly one og:url');
  assert.equal(og[0].content, expected, 'SSR og:url must match canonical');
  for (const meta of metas) {
    if (['robots','googlebot','googlebot-news'].includes((meta.name || '').toLowerCase())) {
      assert.doesNotMatch(meta.content || '', /(?:^|[\s,])(?:none|noindex)(?:$|[\s,])/i,
        'Indexable article HTML must not contain noindex');
    }
  }
  return { canonical: expected, rawDocument: true, htmlMetaIndexable: true, ogUrlConsistent: true };
}

export async function readRawDocumentHtml(cdp, origin, articlePath) {
  const path = articlePath.replace(/\/$/, '');
  let doc;
  for (let i = 0; i < 100; i++) {
    doc = cdp.documents.find(d => {
      try {
        const u = new URL(d.url);
        return d.status === 200 && d.finished === true &&
          u.origin === origin && u.pathname.replace(/\/$/, '') === path;
      } catch { return false; }
    });
    if (doc) break;
    await sleep(100);
  }
  assert.ok(doc?.requestId, 'Exact HTTP 200 article body not available from CDP');
  const response = await cdp.send('Network.getResponseBody', { requestId: doc.requestId });
  assert.equal(typeof response?.body, 'string', 'CDP did not return original response body');
  const html = response.base64Encoded
    ? Buffer.from(response.body, 'base64').toString('utf8') : response.body;
  assert.ok(html.length > 0 && Buffer.byteLength(html, 'utf8') <= LIMIT,
    'Original article response is empty or too large');
  return html;
}

export function selfTestRawArticleHead() {
  const expected = 'https://www.healthylifesstyles.com/wellness-hub/example';
  const valid = '<!doctype html><html><head>' +
    '<!-- <link rel="canonical" href="https://bad.test/"> -->' +
    '<script>const fake = "<meta name=robots content=noindex>";</script>' +
    '<meta content="max-image-preview:large" name="robots">' +
    '<link href="' + expected + '" rel="canonical">' +
    '<meta content="' + expected + '" property="og:url">' +
    '</head><body>fixture</body></html>';
  assert.equal(assertRawArticleHead(valid, expected).canonical, expected);
  assert.throws(() => assertRawArticleHead(valid.replace('href="' + expected + '"',
    'href="https://bad.test/"'), expected), /canonical/);
  assert.throws(() => assertRawArticleHead(valid.replace('</head>',
    '<link rel="canonical" href="' + expected + '"></head>'), expected), /exactly one canonical/);
  assert.throws(() => assertRawArticleHead(valid.replace('max-image-preview:large',
    'noindex, follow'), expected), /noindex/);
  assert.throws(() => assertRawArticleHead(valid.replace('property="og:url"',
    'property="og:title"'), expected), /og:url/);
  assert.throws(() => assertRawArticleHead(valid.replace('content="' + expected + '"',
    'content="https://bad.test/"'), expected), /og:url/);
  console.log('PASS offline raw-HTML SEO contract: canonical uniqueness, OG parity, noindex rejection, inert tags ignored');
}
