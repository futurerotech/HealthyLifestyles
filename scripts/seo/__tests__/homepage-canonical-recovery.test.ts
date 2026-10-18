import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'));
const rules = config.routes || [];
const site = readFileSync(new URL('../../../src/pages/index.astro', import.meta.url), 'utf8');
const astro = readFileSync(new URL('../../../astro.config.mjs', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../../../public/robots.txt', import.meta.url), 'utf8');

test('non-www redirect stays single hop and preserves the requested path', () => {
  const r = rules.find(x => x.has?.some(y => y.type === 'host' && y.value === 'healthylifesstyles.com'));
  assert.ok(r);
  assert.equal(r.status, 301);
  assert.equal(r.headers.Location, 'https://www.healthylifesstyles.com/$1');
});
test('legacy arcade and WordPress paths are Gone and not sent to homepage', () => {
  for (const path of ['/game/save-my-girl','/games/foo','/index.php/category/fitness/','/wp-content/uploads/x','/wp-admin/','/wp-includes/file','/category/old','/tag/old']) {
    const matching = rules.find(x => x.status === 410 && new RegExp('^'+x.src+'$').test(path));
    assert.ok(matching, path);
    assert.equal(matching.headers['X-Robots-Tag'], 'noindex');
    assert.equal(matching.dest, undefined);
  }
});
test('homepage contains crawlable original editorial content and no reveal gate on major sections', () => {
  assert.match(site, /<section class="section" aria-labelledby="about-platform">/);
  assert.match(site, /Mifflin/);
  assert.match(site, /WHO-5/);
  assert.doesNotMatch(site, /aria-labelledby="popular-title" data-reveal/);
  assert.doesNotMatch(site, /aria-labelledby="cat-title" data-reveal/);
});
test('sitemap preserves root slash; robots advertises XML index', () => {
  assert.match(astro, /pathname === '\/' \? item.url/);
  assert.match(robots,/Sitemap: https:\/\/www.healthylifesstyles.com\/sitemap-index.xml/);
  for(const p of ['/api/','/embed/','/og/']) assert.ok(robots.includes('Disallow: '+p));
});
