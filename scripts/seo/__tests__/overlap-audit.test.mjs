// Unit tests for the Phase 7 overlap screen (no network).
import test from 'node:test';
import assert from 'node:assert/strict';
const { intent, jaccard, screen } = await import('../../content/overlap-audit.mjs');

test('intent normalizes stop words and plurals; jaccard compares intents', () => {
  assert.deepEqual([...intent('How Many Calories to Lose Weight')].sort(), ['calory', 'lose', 'weight']);
  assert.equal(jaccard(intent('Healthy BMI by age'), intent('BMI by age chart')), 0.5);
});

test('same-kind overlaps are flagged; a tool and its article are not', () => {
  const pages = [
    { kind: 'article', ref: 'article:a', intent: intent('Waist to height ratio explained') },
    { kind: 'article', ref: 'article:b', intent: intent('Healthy waist to height ratio') },
    { kind: 'tool', ref: 'tool:whtr', intent: intent('Waist to height ratio calculator') },
  ];
  const r = screen(pages);
  assert.equal(r.length, 1);
  assert.deepEqual([r[0].a, r[0].b], ['article:a', 'article:b']);
});
