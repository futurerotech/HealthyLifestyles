import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { AFFILIATES, isAffiliateLink } = await import('../../../src/data/affiliates.ts');
const layout = readFileSync(new URL('../../../src/components/ToolPageLayout.astro', import.meta.url), 'utf8');

test('only tagged links count as affiliate links', () => {
  assert.equal(isAffiliateLink('https://www.amazon.com/s?k=food+scale'), false);
  assert.equal(isAffiliateLink('https://www.amazon.com/s?k=food+scale&tag='), false);
  assert.equal(isAffiliateLink('https://www.amazon.com/s?k=food+scale&tag=hls-20'), true);
  assert.equal(isAffiliateLink('not a url'), false);
});

test('the earnings disclosure and rel=sponsored appear only for tagged links', () => {
  assert.match(layout, /affiliateEarns\s*\?\s*'As an affiliate we may earn/);
  assert.match(layout, /not sponsored or affiliate placements\. We don’t earn from them\./);
  assert.match(layout, /rel=\{isAffiliateLink\(it\.href\) \? 'sponsored nofollow noopener' : 'nofollow noopener'\}/);
  assert.doesNotMatch(layout, /rel="sponsored nofollow noopener"/);
});

test('current suggestions are untagged search links, so no page claims affiliate earnings', () => {
  const items = Object.values(AFFILIATES).flatMap((s) => s.items);
  assert.ok(items.length > 0);
  assert.ok(items.every((it) => !isAffiliateLink(it.href)), 'a tagged link needs a verified affiliate relationship first');
});

test('product blurbs make no diagnostic or efficacy claims', () => {
  const text = JSON.stringify(AFFILIATES);
  assert.doesNotMatch(text, /reached ketosis/i);
  assert.match(text, /not a medical test/);
});
