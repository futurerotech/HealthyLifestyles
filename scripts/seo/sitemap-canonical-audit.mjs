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

export function auditBuiltSitemap(root) {
  const issues = [];
  const indexPath = path.join(root, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    return { count: 0, sitemapCount: 0, issues: ['Missing built sitemap-index.xml'] };
  }

  const indexUrls = locs(fs.readFileSync(indexPath, 'utf8'));
  if (indexUrls.length === 0) issues.push('Sitemap index has no child XML locations');
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
    const childPath = path.join(root, child.pathname.slice(1));
    if (!fs.existsSync(childPath)) {
      issues.push('Missing built sitemap child: ' + child.pathname);
      continue;
    }

    const pages = locs(fs.readFileSync(childPath, 'utf8'));
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
      const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
      if (canonical !== page.href) {
        issues.push('Sitemap/canonical mismatch at ' + rawUrl + ' (canonical=' + String(canonical) + ')');
      }
      const robots = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1] ?? '';
      if (/\bnoindex\b/i.test(robots)) {
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
