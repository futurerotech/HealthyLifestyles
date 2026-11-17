import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDocumentedReviewer } from '../../../src/lib/review-evidence.mjs';

const authors = [
  { slug: 'editorial-team', name: 'Editorial Team' },
  { slug: 'reviewer', name: 'Qualified Reviewer' },
];

test('review claim requires literal true CMS human-review evidence', () => {
  for (const flag of [false, undefined, null, 'true', 1]) {
    assert.equal(selectDocumentedReviewer({ author: 'Editorial Team', reviewer: 'reviewer', reviewedByHuman: flag }, authors), null);
  }
});

test('review claim requires a real, explicitly linked reviewer', () => {
  assert.equal(selectDocumentedReviewer({ author: 'editorial-team', reviewer: 'reviewer', reviewedByHuman: true }, authors), authors[1]);
  assert.equal(selectDocumentedReviewer({ author: 'Editorial Team', reviewer: 'Qualified Reviewer', reviewedByHuman: true }, authors), authors[1]);
  for (const reviewer of [undefined, '', 'unknown', 'editorial-team', 'Editorial Team']) {
    assert.equal(selectDocumentedReviewer({ author: 'Editorial Team', reviewer, reviewedByHuman: true }, authors), null);
  }
});

test('self-review and missing reviewer records cannot be attributed', () => {
  assert.equal(selectDocumentedReviewer({ author: 'editorial-team', reviewer: 'Editorial Team', reviewedByHuman: true }, authors), null);
  assert.equal(selectDocumentedReviewer({ author: 'Editorial Team', reviewer: 'editorial-team', reviewedByHuman: true }, authors), null);
  assert.equal(selectDocumentedReviewer({ author: 'Editorial Team', reviewer: 'reviewer', reviewedByHuman: true }, []), null);
  assert.equal(selectDocumentedReviewer({ author: 'Editorial Team', reviewer: 'reviewer', reviewedByHuman: true }, [{ slug: 'reviewer', name: '' }]), null);
});
