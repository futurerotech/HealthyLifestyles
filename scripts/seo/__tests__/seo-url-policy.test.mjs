import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrlForPath, serializeSitemapEntry } from '../../../src/lib/seo-url-policy.mjs';

const origin = 'https://www.healthylifesstyles.com';

test('homepage canonical retains exactly one trailing slash', () => {
  assert.equal(canonicalUrlForPath('/', origin), `${origin}/`);
  assert.equal(canonicalUrlForPath('/', `${origin}/`), `${origin}/`);
});

test('canonical subpages retain the no-trailing-slash policy', () => {
  assert.equal(canonicalUrlForPath('/tools/', origin), `${origin}/tools`);
  assert.equal(canonicalUrlForPath('/wellness-hub/guide/', origin), `${origin}/wellness-hub/guide`);
  assert.equal(canonicalUrlForPath('/about', origin), `${origin}/about`);
});

test('sitemap home URL and priority match the homepage canonical', () => {
  const item = { url: `${origin}/`, changefreq: 'weekly' };
  const entry = serializeSitemapEntry(item, origin);
  assert.deepEqual(entry, { url: canonicalUrlForPath('/', origin), changefreq: 'weekly', priority: 1 });
  assert.equal(item.url, `${origin}/`, 'input must not be mutated');
});

test('sitemap preserves existing article, tool and hub hierarchy', () => {
  for (const [path, priority] of [
    ['/wellness-hub/example-guide/', 0.8],
    ['/tools/example-tool/', 0.8],
    ['/wellness-hub/', 0.9],
    ['/tools/', 0.9],
    ['/author/', 0.9],
    ['/wellness-hub/tag/example/', 0.7],
    ['/unlisted/', 0.7],
  ]) {
    const result = serializeSitemapEntry({ url: origin + path }, origin);
    assert.equal(result.url, canonicalUrlForPath(path, origin), path);
    assert.equal(result.priority, priority, path);
  }
});

test('every approved information route receives priority 0.5', () => {
  for (const slug of [
    'about', 'privacy', 'contact', 'terms', 'accessibility',
    'editorial-policy', 'methodology', 'medical-disclaimer',
    'cookie-policy', 'health-score', 'ai-assistant',
  ]) {
    const result = serializeSitemapEntry({ url: `${origin}/${slug}/` }, origin);
    assert.equal(result.url, `${origin}/${slug}`, slug);
    assert.equal(result.priority, 0.5, slug);
  }
});
