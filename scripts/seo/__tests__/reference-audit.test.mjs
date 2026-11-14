// Unit tests for the §7.4 reference-audit classifier (no network).
import test from 'node:test';
import assert from 'node:assert/strict';
const { classify, titleMatch, isSearchLink } = await import('../../content/reference-audit.mjs');

test('title match compares meaningful words of the cited label with the destination title', () => {
  assert.ok(titleMatch('Age-predicted maximal heart rate revisited', 'Age-predicted maximal heart rate revisited - PubMed') > 0.9);
  assert.ok(titleMatch('CDC, Water and Healthier Drinks', 'Adult BMI Calculator | BMI | CDC') < 0.3);
  assert.equal(titleMatch('', 'x'), null);
});

test('classification separates defects from temporary access failures', () => {
  const base = { url: 'https://example.org/a/b', finalUrl: 'https://example.org/a/b', status: 200, title: 'Weight Gain During Pregnancy', label: 'Weight Gain During Pregnancy' };
  assert.equal(classify(base), 'ok');
  assert.equal(classify({ ...base, status: 404 }), 'dead');
  assert.equal(classify({ ...base, status: 403 }), 'access');
  assert.equal(classify({ ...base, status: 429 }), 'access');
  assert.equal(classify({ ...base, status: undefined, error: 'TimeoutError' }), 'access');
  assert.equal(classify({ ...base, status: undefined, error: 'ENOTFOUND' }), 'dead');
  assert.equal(classify({ ...base, title: 'Adult BMI Calculator', label: 'Water and Healthier Drinks' }), 'mismatch');
  assert.equal(classify({ ...base, finalUrl: 'https://example.org/' }), 'redirected-to-homepage');
  assert.equal(classify({ ...base, url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Life+between+clocks', finalUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term=Life+between+clocks' }), 'search-link');
  assert.ok(isSearchLink(new URL('https://www.google.com/search?q=x')));
});
