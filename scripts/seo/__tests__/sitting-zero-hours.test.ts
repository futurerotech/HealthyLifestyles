import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSitting } from '../../../src/lib/sitting.ts';

const originalInput = { sittingHours: 8, weightKg: 75, currentSteps: 5000, job: 'desk' as const };

test('zero sitting hours never yields a fabricated extra-step prescription', () => {
  const r = computeSitting({ ...originalInput, sittingHours: 0 });
  assert.equal(r.ok, true);
  assert.equal(r.sittingHours, 0);
  assert.equal(r.addedSteps, 0);
  assert.equal(r.newDailySteps, 5000);
  assert.equal(r.breaksPerDay, 0);
  assert.equal(r.movementMinutes, 0);
  assert.equal(r.walkMinutes, 0);
  assert.equal(r.kcalSteps, 0);
  assert.equal(r.kcalBreaks, 0);
  assert.equal(r.caloriesReclaimed, 0);
  assert.equal(r.caloriesWeekly, 0);
  assert.match(r.sittingNote, /No sitting hours entered/);
});

test('negative sitting hours clamped to zero keep all sitting-related additions at zero', () => {
  const r = computeSitting({ ...originalInput, sittingHours: -1 });
  assert.equal(r.sittingHours, 0);
  assert.equal(r.addedSteps, 0);
  assert.equal(r.caloriesReclaimed, 0);
});

test('positive sitting inputs retain prior optional planning cadence', () => {
  const r = computeSitting(originalInput);
  assert.equal(r.sittingHours, 8);
  assert.equal(r.addedSteps, 4100);
  assert.equal(r.newDailySteps, 9100);
  assert.equal(r.breaksPerDay, 11);
  assert.equal(r.movementMinutes, 33);
});

test('empty daily-step baseline cannot become negative after zero sitting time', () => {
  const r = computeSitting({ ...originalInput, sittingHours: 0, currentSteps: 0 });
  assert.equal(r.newDailySteps, 0);
  assert.equal(r.addedSteps, 0);
});
