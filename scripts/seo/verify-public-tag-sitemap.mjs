/**
 * Public, read-only POST-DEPLOY acceptance for Wellness Hub tag sitemap.
 *
 * Default --check is inert. --verify is an explicitly approved, bounded set
 * of GET requests against ONE fixed public origin only. Never submits URLs,
 * uses cookies, sends credentials, changes files, or contacts CMS/Google.
 *
 * The pre-release public site currently has tag pages but no tag sitemap
 * entries. A NO-GO before actual deployment is correct.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { getAttribute, isIndexableHtml } from './sitemap-policy.mjs';

export const PUBLIC_ORIGIN = 'https://www.healthylifesstyles.com';
const TAG_PREFIX = PUBLIC_ORIGIN + '/wellness-hub/tag/';
const TAG_ROUTE = /^\/wellness-hub\/tag\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SITEMAP_ROUTE = /^\/sitemap-[0-9]+\.xml$/;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_SITEMAPS = 10;
const MAX_TAG_LINKS = 150;

export function parseLocations(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m => m[1].trim());
}
function requireSameOrigin(target, expectedRoute) {
  let u;
  try { u = new URL(target); } catch { throw new Error('Unexpected sitemap location format'); }
  if (u.origin !== PUBLIC_ORIGIN || !expectedRoute.test(u.pathname) ||
      u.search || u.hash || u.username || u.password ||
      u.href !== target) {
    throw new Error('Unexpected sitemap location or origin');
  }
  return u.href;
}
async function limitedText(response, label) {
  if (!response?.body) throw new Error(label + ': missing response body');
  const size = response.headers?.get('content-length');
  if (size !== null && size !== undefined &&
      (!/^\d+$/.test(size) || Number(size) > MAX_BYTES)) {
    throw new Error(label + ': response exceeds size limit');
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  let complete = false;
  try {
    while (true) {
      const value = await reader.read();
      if (value.done) { complete = true; break; }
      total += value.value.byteLength;
      if (total > MAX_BYTES) throw new Error(label + ': response exceeds size limit');
      chunks.push(value.value);
    }
  } finally {
    if (!complete) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}
async function getText(url, fetcher, label, { checkRobotsHeader = false } = {}) {
  let response;
  try {
    response = await fetcher(url, {
      method: 'GET', redirect: 'manual', credentials: 'omit',
      cache: 'no-store', signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/xml, text/xml, text/html' },
    });
  } catch {
    throw new Error(label + ': read-only request failed');
  }
  if (!response || response.status !== 200 || response.redirected ||
      (response.url && response.url !== url)) {
    throw new Error(label + ': expected direct HTTP 200 from approved public origin');
  }
  // Live HTTP headers can override an otherwise self-canonical HTML page.
  // Fail closed on noindex/none (including agent-scoped directives); this is
  // a release gate, not an assertion of Google's actual indexing state.
  if (checkRobotsHeader && /(?:^|[\s,;:])(?:noindex|none)(?=$|[\s,;])/i.test(response.headers?.get('x-robots-tag') ?? '')) {
    throw new Error(label + ': X-Robots-Tag disallows indexing');
  }
  return limitedText(response, label);
}
function tagLinks(html) {
  const result = new Set();
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    let u;
    try { u = new URL(match[2], PUBLIC_ORIGIN); } catch { continue; }
    if (u.origin !== PUBLIC_ORIGIN || !TAG_ROUTE.test(u.pathname) ||
        u.search || u.hash) continue;
    result.add(u.href);
    if (result.size > MAX_TAG_LINKS) throw new Error('Unexpected number of tag links');
  }
  return [...result].sort();
}
export function assertIndexableTagHtml(html, canonical) {
  // Require exactly one declared self-canonical. The shared build-time
  // parser catches robots/googlebot noindex and conflicting canonicals.
  const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => (getAttribute(tag, 'rel') ?? '')
      .trim().toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicals.length !== 1 ||
      getAttribute(canonicals[0], 'href') !== canonical) {
    throw new Error('Tag page canonical mismatch');
  }
  if (!isIndexableHtml(html, canonical)) {
    throw new Error('Tag page has noindex directive');
  }
}

/** Injected fetcher is used ONLY by offline tests; default is native fetch. */
export async function verifyPublicTagSitemap({ fetcher = fetch } = {}) {
  const index = await getText(PUBLIC_ORIGIN + '/sitemap-index.xml', fetcher, 'Sitemap index');
  if (!/<sitemapindex\b/i.test(index)) throw new Error('Invalid sitemap index');
  const child = parseLocations(index).map(loc => requireSameOrigin(loc, SITEMAP_ROUTE));
  if (child.length === 0 || child.length > MAX_SITEMAPS ||
      new Set(child).size !== child.length) {
    throw new Error('Unexpected child sitemap count or duplicates');
  }
  const locations = [];
  for (const url of child) {
    const xml = await getText(url, fetcher, 'Child sitemap');
    if (!/<urlset\b/i.test(xml)) throw new Error('Invalid child sitemap');
    locations.push(...parseLocations(xml));
  }
  if (locations.length === 0 || new Set(locations).size !== locations.length) {
    throw new Error('Empty or duplicated sitemap URL entries');
  }
  const tagURLs = locations.filter(url => url.startsWith(TAG_PREFIX));
  if (tagURLs.length === 0) throw new Error('Public sitemap contains zero Wellness Hub tag archives');
  if (tagURLs.some(url => {
    try { return requireSameOrigin(url, TAG_ROUTE) !== url; }
    catch { return true; }
  })) throw new Error('Sitemap has an invalid Wellness Hub tag URL');
  if (locations.some(url => url.startsWith(PUBLIC_ORIGIN + '/tag/'))) {
    throw new Error('Legacy /tag/ URLs remain in public sitemap');
  }

  const hub = await getText(PUBLIC_ORIGIN + '/wellness-hub', fetcher, 'Wellness Hub');
  const linked = tagLinks(hub);
  if (linked.length === 0) throw new Error('Wellness Hub contains no linked tag archives');
  const included = new Set(tagURLs);
  const missing = linked.filter(u => !included.has(u));
  if (missing.length) {
    throw new Error('Published sitemap omits ' + missing.length + ' linked Wellness Hub tag archives');
  }

  // Verify representative page HTML, not only sitemap XML. Keep the live
  // request budget small (at most three tag-page GETs).
  const samples = [linked[0], linked[Math.floor(linked.length / 2)], linked[linked.length - 1]];
  const uniqueSamples = [...new Set(samples)];
  for (const page of uniqueSamples) {
    assertIndexableTagHtml(await getText(page, fetcher, 'Tag archive', { checkRobotsHeader: true }), page);
  }
  return Object.freeze({
    kind: 'public-wellness-tag-sitemap-postdeploy',
    publicOrigin: PUBLIC_ORIGIN,
    childSitemaps: child.length,
    totalSitemapURLs: locations.length,
    linkedTagArchives: linked.length,
    listedTagArchives: tagURLs.length,
    tagPageSamplesVerified: uniqueSamples.length,
    tagPageHeaderSamplesVerified: uniqueSamples.length,
    verified: true,
    indexingSubmissionRequests: 0,
    productionWrites: 0,
  });
}
export async function main(args = process.argv.slice(2), env = process.env) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--check')) {
    process.stdout.write('CHECK_ONLY: public tag sitemap verifier is inert; --verify needs approval after a real deployment.\n');
    return 0;
  }
  if (args.length !== 1 || args[0] !== '--verify' ||
      env.HLS_PUBLIC_TAG_SITEMAP_READONLY_APPROVED !== 'yes') {
    throw new Error('Public tag sitemap verification is not approved');
  }
  const result = await verifyPublicTagSitemap();
  process.stdout.write(JSON.stringify(result) + '\n');
  return 0;
}
if (process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write('PUBLIC_TAG_SITEMAP_NO_GO: ' + error.message + '\n');
    process.exitCode = 1;
  });
}
