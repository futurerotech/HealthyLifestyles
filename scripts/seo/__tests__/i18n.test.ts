/**
 * P15-P6 — i18n rail helpers. Run: node --test scripts/seo/__tests__/i18n.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localePath, hreflangSet, dirFor, ogLocaleFor, NON_DEFAULT_LOCALES } from '../../../src/lib/i18n.ts';

const O = 'https://www.healthylifesstyles.com';

test('default locale stays unprefixed; others get a /locale prefix', () => {
  assert.equal(localePath('en', '/wellness-hub/x'), '/wellness-hub/x');
  assert.equal(localePath('es', '/wellness-hub/x'), '/es/wellness-hub/x');
  assert.equal(localePath('ar', '/wellness-hub/x'), '/ar/wellness-hub/x');
});

test('single-language page emits NO hreflang (avoids unpaired return-tags)', () => {
  assert.deepEqual(hreflangSet(O, '/wellness-hub/x', []), []);
});

test('translated page emits self + siblings + x-default→English, all reciprocal', () => {
  const set = hreflangSet(O, '/wellness-hub/x', ['es']);
  assert.deepEqual(set, [
    { hreflang: 'en', href: `${O}/wellness-hub/x` },
    { hreflang: 'es', href: `${O}/es/wellness-hub/x` },
    { hreflang: 'x-default', href: `${O}/wellness-hub/x` },
  ]);
});

test('x-default always targets the canonical English URL', () => {
  const set = hreflangSet(O, '/wellness-hub/x', ['es', 'ar']);
  const xd = set.find((s) => s.hreflang === 'x-default');
  assert.equal(xd?.href, `${O}/wellness-hub/x`);
});

test('RTL only for Arabic; og:locale mapped; default locale excluded from prefixed set', () => {
  assert.equal(dirFor('ar'), 'rtl');
  assert.equal(dirFor('es'), 'ltr');
  assert.equal(dirFor('en'), 'ltr');
  assert.equal(ogLocaleFor('ar'), 'ar_AR');
  assert.equal(ogLocaleFor('es'), 'es_ES');
  assert.equal(ogLocaleFor('en'), 'en_US');
  assert.deepEqual([...NON_DEFAULT_LOCALES], ['es', 'ar']);
});
