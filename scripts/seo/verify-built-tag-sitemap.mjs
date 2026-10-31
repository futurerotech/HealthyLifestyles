/**
 * Verify real (non-fixture) Astro CMS build tag archives in the generated
 * sitemap and in the exact Vercel provider bundle.
 *
 * Read only. Run AFTER the published-CMS build/postbuild preflight in CI.
 * Never reads secrets or calls external services.
 */
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isIndexableHtml } from './sitemap-policy.mjs';

const ORIGIN = 'https://www.healthylifesstyles.com';
const output = resolve('dist/client');
const provider = resolve('.vercel/output/static');
const tagDirectory = join(output, 'wellness-hub', 'tag');

const sitemapFiles = (await readdir(output)).filter((n) => /^sitemap-\d+\.xml$/.test(n)).sort();
assert.ok(sitemapFiles.length, 'Actual CMS build produced no child sitemap files');

const locations = [];
for (const name of sitemapFiles) {
  const xml = await readFile(join(output, name), 'utf8');
  const deployed = await readFile(join(provider, name), 'utf8');
  assert.equal(deployed, xml, 'Vercel deployment sitemap differs from the generated CMS build: ' + name);
  locations.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
}
assert.equal(new Set(locations).size, locations.length, 'Duplicate canonical URL in sitemap');

const tagPrefix = ORIGIN + '/wellness-hub/tag/';
const tagURLs = locations.filter((url) => url.startsWith(tagPrefix));
const emittedSlugs = [];
const entries = await readdir(tagDirectory, { withFileTypes: true });
let indexable = 0;
let excluded = 0;
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const slug = entry.name;
  assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Unexpected CMS tag slug in output');
  const canonical = tagPrefix + slug;
  emittedSlugs.push(slug);
  const html = await readFile(join(tagDirectory, slug, 'index.html'), 'utf8');
  const shouldIndex = isIndexableHtml(html, canonical);
  const inSitemap = locations.includes(canonical);
  assert.equal(inSitemap, shouldIndex,
    'Tag indexability/sitemap mismatch: ' + slug + ' (indexable=' + shouldIndex + ')');
  if (shouldIndex) {
    const link = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? '';
    const href = link.match(/\bhref=["']([^"']+)["']/i)?.[1];
    assert.equal(href?.replace(/\/$/, ''), canonical,
      'Indexable tag archive must declare a self-canonical: ' + slug);
    indexable++;
  } else {
    excluded++;
  }
}

assert.ok(emittedSlugs.length > 0, 'Published-CMS build emitted zero tag archives');
assert.equal(tagURLs.length, indexable,
  'Sitemap contains missing, stale or excluded tag canonical URLs');
assert.ok(tagURLs.every((url) => emittedSlugs.includes(url.slice(tagPrefix.length))),
  'Sitemap lists a tag archive absent from built HTML');
assert.ok(!locations.some((url) => url.startsWith(ORIGIN + '/tag/')),
  'Legacy tag aliases must remain outside the sitemap');

console.log('PASS: actual published-CMS Astro build emitted ' + emittedSlugs.length +
  ' tag archives; ' + indexable + ' indexable in sitemap; ' + excluded +
  ' excluded; Vercel provider sitemap identical. No external submissions.');
