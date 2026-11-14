// Unit tests for the §7.4 reference-audit classifier (no network).
import test from 'node:test';
import assert from 'node:assert/strict';
const { classify, titleMatch, isSearchLink, ncbiId } = await import('../../content/reference-audit.mjs');

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

test('bot challenges are access failures; NCBI metadata titles decide PubMed/PMC/Bookshelf matches', () => {
  const base = { url: 'https://pubmed.ncbi.nlm.nih.gov/11153730/', finalUrl: 'https://pubmed.ncbi.nlm.nih.gov/11153730/', status: 203, title: 'Cookies must be enabled', label: 'Age-Predicted Maximal Heart Rate Revisited' };
  assert.equal(classify(base), 'access');
  assert.equal(classify({ ...base, status: 200, title: 'Checking your browser - reCAPTCHA' }), 'access');
  assert.equal(classify({ ...base, metaTitle: 'Age-predicted maximal heart rate revisited.' }), 'ok');
  assert.equal(classify({ ...base, label: 'Body Composition and Health', metaTitle: 'Oxysterol Signatures Distinguish Age-Related Macular Degeneration from Physiologic Aging' }), 'mismatch');
  assert.equal(classify({ ...base, kind: 'inline', label: 'a 2016 study', metaTitle: 'Oxysterol signatures' }), 'review');
  assert.deepEqual(ncbiId('https://pubmed.ncbi.nlm.nih.gov/11153730/'), { db: 'pubmed', id: '11153730' });
  assert.deepEqual(ncbiId('https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6021272/'), { db: 'pmc', id: '6021272' });
  assert.deepEqual(ncbiId('https://www.ncbi.nlm.nih.gov/books/NBK459351/'), { db: 'books', accession: 'NBK459351' });
  assert.equal(ncbiId('https://www.cdc.gov/sleep/about/'), null);
});
