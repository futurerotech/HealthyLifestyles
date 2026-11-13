import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeSitting } from '../../../src/lib/sitting.ts';

test('the old job type choices did not influence any calculated result', () => {
  const base = { sittingHours: 8, weightKg: 75, currentSteps: 5000 };
  const desk = computeSitting({ ...base, job: 'desk' });
  assert.deepEqual(computeSitting({ ...base, job: 'mixed' }), desk);
  assert.deepEqual(computeSitting({ ...base, job: 'active' }), desk);
});

test('the UI no longer presents an inert job-type field as personalization', () => {
  const island = readFileSync(new URL('../../../src/islands/SittingReversal.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(island, /Job type \(optional\)|setJob\(/);
  assert.match(island, /const calculationInput = \{ sittingHours, weightKg, currentSteps: steps, job: 'desk' as const \}/);
});
