import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validSittingInputs } from '../../../src/lib/sitting.ts';

const valid = { sittingHours: 8, weightKg: 75, currentSteps: 5000, job: 'desk' as const };

test('accepts zero sitting time and ordinary valid daily inputs', () => {
  assert.equal(validSittingInputs(valid), true);
  assert.equal(validSittingInputs({ ...valid, sittingHours: 0, currentSteps: 0 }), true);
  assert.equal(validSittingInputs({ ...valid, sittingHours: 18, weightKg: 300, currentSteps: 100000 }), true);
});

test('rejects blank/invalid/unsafe weight rather than displaying a one-kilogram result', () => {
  for (const weightKg of [0, -2, 301, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(validSittingInputs({ ...valid, weightKg }), false);
  }
});

test('rejects out-of-range and non-finite sitting hours or steps', () => {
  for (const sittingHours of [-0.5, 18.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(validSittingInputs({ ...valid, sittingHours }), false);
  }
  for (const currentSteps of [-1, 100001, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(validSittingInputs({ ...valid, currentSteps }), false);
  }
});

test('visible UI hides result and prevents sharing when inputs are invalid', () => {
  const source = readFileSync(new URL('../../../src/islands/SittingReversal.tsx', import.meta.url), 'utf8');
  assert.match(source, /validInputs = validSittingInputs/);
  assert.match(source, /\{validInputs && \(/);
  assert.match(source, /disabled=\{!validInputs\}/);
  assert.match(source, /if \(!validInputs\) return;/);
  assert.doesNotMatch(source, /and add\s+consider/);
});
