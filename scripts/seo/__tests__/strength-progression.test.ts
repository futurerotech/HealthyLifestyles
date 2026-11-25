import test from 'node:test';
import assert from 'node:assert/strict';

const { nextBlock, progressionStep, buildProgram } = await import('../../../src/lib/strength-program.ts');

test('completed block adds a fixed step: lower 5 kg / 10 lb, upper 2.5 kg / 5 lb', () => {
  assert.equal(nextBlock('squat', 100, 'completed', 'kg').nextOneRm, 105);
  assert.equal(nextBlock('bench', 80, 'completed', 'kg').nextOneRm, 82.5);
  assert.equal(nextBlock('deadlift', 275, 'completed', 'lb').nextOneRm, 285);
  assert.equal(nextBlock('ohp', 115, 'completed', 'lb').nextOneRm, 120);
  assert.equal(progressionStep('row', 'kg'), 2.5);
});

test('increase never exceeds 10% of the 1RM (ACSM 2–10%)', () => {
  for (const [key, rm, units] of [['squat', 30, 'kg'], ['ohp', 20, 'kg'], ['squat', 60, 'lb'], ['bench', 45, 'lb']] as const) {
    const r = nextBlock(key, rm, 'completed', units);
    assert.ok(r.change <= rm * 0.1 + 1e-9, `${key} ${rm}${units} +${r.change}`);
  }
  const tiny = nextBlock('ohp', 20, 'completed', 'kg');
  assert.equal(tiny.nextOneRm, 20);
  assert.match(tiny.note, /smaller plates/);
});

test('missed reps: one week repeats, two or more weeks reset 10% lighter', () => {
  assert.equal(nextBlock('bench', 80, 'missed-one', 'kg').nextOneRm, 80);
  assert.equal(nextBlock('squat', 100, 'missed-multiple', 'kg').nextOneRm, 90);
  assert.equal(nextBlock('squat', 225, 'missed-multiple', 'lb').nextOneRm, 205);
  assert.ok(nextBlock('ohp', 2.5, 'missed-multiple', 'kg').nextOneRm! > 0);
});

test('pain never yields a progression number and points to a clinician', () => {
  const r = nextBlock('deadlift', 140, 'pain', 'kg');
  assert.equal(r.nextOneRm, null);
  assert.match(r.note, /clinician|physical therapist/);
});

test('invalid 1RM is rejected; next block builds from the suggested 1RM', () => {
  assert.throws(() => nextBlock('squat', 0, 'completed', 'kg'), RangeError);
  const next = nextBlock('squat', 100, 'completed', 'kg').nextOneRm!;
  const p = buildProgram({ lifts: [{ key: 'squat', oneRm: next }], daysPerWeek: 3, experience: 'intermediate', goal: 'strength', units: 'kg' });
  assert.equal(p.lifts[0].oneRm, 105);
  assert.equal(p.lifts[0].weeks[0].weight, 85);
});
