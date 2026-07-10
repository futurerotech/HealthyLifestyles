/**
 * D5 fixture proof — YMYL date integrity in the canonical feed.
 *
 * The fabrication bug-class this immunizes: `pubDate: a.publishDate ? ... : new Date()`
 * (shipping the build timestamp as an editorial date). These tests make that
 * regression build-impossible: an article with no/invalid publishDate must
 * emit NO pubDate at all.
 *
 * Run: node --test scripts/seo/__tests__/feed-date-integrity.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeedItems, feedImageUrl, DISCOVER_MIN_WIDTH } from '../../../src/lib/feed-items.ts';

const ORIGIN = 'https://www.healthylifesstyles.com';

test('D5: article WITHOUT publishDate → pubDate omitted entirely (never now())', () => {
  const [item] = buildFeedItems([{ title: 'No date', slug: 'no-date' }], ORIGIN);
  assert.equal(item.pubDate, undefined);
});

test('D5: article with INVALID publishDate → pubDate omitted', () => {
  const [item] = buildFeedItems([{ title: 'Bad date', slug: 'bad', publishDate: 'not-a-date' }], ORIGIN);
  assert.equal(item.pubDate, undefined);
});

test('article WITH publishDate → pubDate is exactly the CMS date', () => {
  const [item] = buildFeedItems([{ title: 'Dated', slug: 'dated', publishDate: '2026-04-12T00:00:00Z' }], ORIGIN);
  assert.equal(item.pubDate?.toISOString(), '2026-04-12T00:00:00.000Z');
});

test('links are absolute under the canonical origin', () => {
  const [item] = buildFeedItems([{ title: 'A', slug: 'macro-guide' }], ORIGIN);
  assert.equal(item.link, `${ORIGIN}/wellness-hub/macro-guide`);
});

test('media:content falls back to the 1200×630 OG endpoint when no large hero', () => {
  const [item] = buildFeedItems([{ title: 'A', slug: 'bmi' }], ORIGIN);
  assert.match(String(item.customData), /<media:content url="https:\/\/www\.healthylifesstyles\.com\/og\/articles\/bmi\.png" medium="image" width="1200" height="630" \/>/);
});

test('hero ≥1200px is used with its REAL dimensions (no invented metadata)', () => {
  const img = feedImageUrl(
    { slug: 'x', heroImage: { url: '/media/hero.jpg', alt: '', width: 1600, height: 900 } },
    ORIGIN,
  );
  assert.deepEqual(img, { url: `${ORIGIN}/media/hero.jpg`, width: 1600, height: 900 });
});

test(`hero below ${DISCOVER_MIN_WIDTH}px is rejected in favor of the OG endpoint`, () => {
  const img = feedImageUrl(
    { slug: 'x', heroImage: { url: '/media/small.jpg', alt: '', width: 800, height: 450 } },
    ORIGIN,
  );
  assert.equal(img.url, `${ORIGIN}/og/articles/x.png`);
});

test('XML attribute escaping in media URL', () => {
  const [item] = buildFeedItems(
    [{ title: 'A', slug: 'x', heroImage: { url: '/m/a&b.jpg', alt: '', width: 1300, height: 700 } }],
    ORIGIN,
  );
  assert.match(String(item.customData), /a&amp;b\.jpg/);
});
