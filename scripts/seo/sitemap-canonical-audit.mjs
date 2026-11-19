/**
 * Phase 1: audit the sitemap XML emitted by an isolated Astro static build.
 * Offline, dependency-free; checks that every advertised URL resolves to a
 * built indexable HTML page with an identical self-canonical.
 *
 * Run only after npm run build: node scripts/seo/sitemap-canonical-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.healthylifesstyles.com';
const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m => m[1].trim());

// This audits the emitted sitemap grammar, not arbitrary XML input. Reject
// orphan locations, malformed entries and roots other than the expected ones.
const sitemapPatterns = {
  index: {
    rootTag: 'sitemapindex', entryTag: 'sitemap',
    root: /^(?:<\?xml[^>]*\?>\s*)?<sitemapindex\b[^>]*>([\s\S]*)<\/sitemapindex>$/i,
    rootStarts: /<sitemapindex\b/gi,
    entryStarts: /<sitemap\b/gi,
    entries: /<sitemap\b[^>]*>([\s\S]*?)<\/sitemap\s*>/gi,
  },
  child: {
    rootTag: 'urlset', entryTag: 'url',
    root: /^(?:<\?xml[^>]*\?>\s*)?<urlset\b[^>]*>([\s\S]*)<\/urlset>$/i,
    rootStarts: /<urlset\b/gi,
    entryStarts: /<url\b/gi,
    entries: /<url\b[^>]*>([\s\S]*?)<\/url\s*>/gi,
  },
};

function readXmlLocations(xml, kind, label, issues) {
  const pattern = sitemapPatterns[kind];
  const source = xml.replace(/<!--[\s\S]*?-->/g, '').trim();
  const root = source.match(pattern.root);
  if (!root || [...source.matchAll(pattern.rootStarts)].length !== 1) {
    issues.push('Invalid ' + label + ': missing or duplicate ' + pattern.rootTag + ' root');
    return [];
  }

  const body = root[1];
  const starts = [...body.matchAll(pattern.entryStarts)].length;
  const entries = [...body.matchAll(pattern.entries)];
  if (starts !== entries.length) issues.push('Invalid ' + label + ': malformed ' + pattern.entryTag + ' entries');
  const urls = [];
  let containedLocations = 0;
  for (const entry of entries) {
    const found = locs(entry[1]);
    containedLocations += found.length;
    if (found.length !== 1) issues.push('Invalid ' + label + ': each ' + pattern.entryTag + ' needs one loc');
    else urls.push(found[0]);
  }
  if (containedLocations !== locs(body).length) {
    issues.push('Invalid ' + label + ': loc outside ' + pattern.entryTag + ' entries');
  }
  return urls;
}

// HTML attribute order and quoting are not significant. Inspect ALL robots
// directives and canonical links rather than only the first exact tag.
function elementAttributes(html, name) {
  const pattern = name === 'link' ? /<link\b[^>]*>/gi : /<meta\b[^>]*>/gi;
  return [...html.matchAll(pattern)].map(match => {
    const attrs = {};
    for (const attr of match[0].matchAll(/\b([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4];
    }
    return attrs;
  });
}

export function auditBuiltSitemap(root) {
  const issues = [];
  const indexPath = path.join(root, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    return { count: 0, sitemapCount: 0, issues: ['Missing built sitemap-index.xml'] };
  }

  const indexUrls = readXmlLocations(fs.readFileSync(indexPath, 'utf8'),
    'index', 'sitemap index', issues);
  if (indexUrls.length === 0) issues.push('Sitemap index has no child XML locations');
  const seenChildren = new Set();
  const seen = new Set();
  let count = 0;

  for (const rawIndexUrl of indexUrls) {
    let child;
    try {
      child = new URL(rawIndexUrl);
    } catch {
      issues.push('Invalid child sitemap URL: ' + rawIndexUrl);
      continue;
    }
    if (child.origin !== ORIGIN || !/^\/sitemap-\d+\.xml$/.test(child.pathname) ||
        child.search || child.hash) {
      issues.push('Unexpected sitemap child URL: ' + rawIndexUrl);
      continue;
    }
    if (seenChildren.has(child.href)) {
      issues.push('Duplicate sitemap child: ' + rawIndexUrl);
      continue;
    }
    seenChildren.add(child.href);
    const childPath = path.join(root, child.pathname.slice(1));
    if (!fs.existsSync(childPath)) {
      issues.push('Missing built sitemap child: ' + child.pathname);
      continue;
    }

    const pages = readXmlLocations(fs.readFileSync(childPath, 'utf8'),
      'child', 'sitemap child ' + child.pathname, issues);
    for (const rawUrl of pages) {
      count++;
      let page;
      try {
        page = new URL(rawUrl);
      } catch {
        issues.push('Invalid page URL: ' + rawUrl);
        continue;
      }
      if (page.origin !== ORIGIN || page.search || page.hash) {
        issues.push('Noncanonical sitemap URL: ' + rawUrl);
        continue;
      }
      if (page.pathname !== '/' && page.pathname.endsWith('/')) {
        issues.push('Trailing slash on nonroot sitemap URL: ' + rawUrl);
      }
      if (/^\/(api|embed|og)(\/|$)|^\/404(?:\/|$)/.test(page.pathname)) {
        issues.push('Utility or noindex route advertised: ' + rawUrl);
      }
      if (seen.has(page.href)) {
        issues.push('Duplicate page URL: ' + rawUrl);
        continue;
      }
      seen.add(page.href);

      const pathname = page.pathname.slice(1);
      const candidates = page.pathname === '/'
        ? [path.join(root, 'index.html')]
        : [path.join(root, pathname, 'index.html'), path.join(root, pathname + '.html')];
      const htmlFile = candidates.find(candidate => fs.existsSync(candidate));
      if (!htmlFile) {
        issues.push('Sitemap URL has no built HTML: ' + rawUrl);
        continue;
      }

      const html = fs.readFileSync(htmlFile, 'utf8');
      const canonicals = elementAttributes(html, 'link')
        .filter(attrs => attrs.rel?.toLowerCase().split(/\s+/).includes('canonical'));
      if (canonicals.length !== 1 || canonicals[0].href !== page.href) {
        issues.push('Sitemap/canonical mismatch at ' + rawUrl + ' (canonical count=' + canonicals.length + ')');
      }
      const robots = elementAttributes(html, 'meta')
        .filter(attrs => ['robots', 'googlebot', 'bingbot'].includes(attrs.name?.toLowerCase()));
      if (robots.some(attrs => /\bnoindex\b/i.test(attrs.content ?? ''))) {
        issues.push('Sitemap includes noindex HTML: ' + rawUrl);
      }
    }
  }

  if (count === 0) issues.push('No page URLs found in built child sitemaps');
  return { count, sitemapCount: indexUrls.length, issues };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.cwd(), 'dist', 'client');
  const result = auditBuiltSitemap(root);
  console.log('sitemap-canonical-audit: ' + result.count + ' entries, ' + result.sitemapCount + ' child sitemap(s)');
  if (result.issues.length) {
    for (const issue of result.issues) console.error('  FAIL ' + issue);
    process.exitCode = 1;
  } else {
    console.log('sitemap-canonical-audit: PASS — all XML URLs have matching indexable built HTML');
  }
}
