// Strength program: loadable weights and warm-up order. Lifestyle age: pulse
// framing consistent with the Resting Heart Rate Checker.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { buildProgram, roundToIncrement } = await import('../../../src/lib/strength-program.ts');
const { computeLifestyleAge } = await import('../../../src/lib/lifestyle-age.ts');

const prog = (oneRm: number, units: 'kg' | 'lb' = 'kg', goal: 'strength' | 'hypertrophy' = 'strength') =>
  buildProgram({ lifts: [{ key: 'ohp', oneRm }], daysPerWeek: 3, experience: 'intermediate', goal, units }).lifts[0];

test('ordinary 1RM keeps the published percentages and 2.5 kg rounding', () => {
  const l = prog(100);
  assert.deepEqual(l.weeks.map((w) => w.weight), [80, 82.5, 85, 65]);
  assert.equal(l.belowBar, false);
  assert.deepEqual(l.warmups.map((w) => w.weight), [20, 40, 55, 72.5]);
  assert.equal(roundToIncrement(101, 'lb'), 100);
});

test('weights lighter than an empty bar are flagged, never silently prescribed on a bar', () => {
  const l = prog(25); // 60–85% of 25 kg is 15–21 kg; deload 16 kg
  assert.equal(l.belowBar, true);
  assert.equal(l.barWeight, 20);
  assert.ok(l.weeks.some((w) => w.weight < 20));
  assert.equal(prog(50, 'lb').belowBar, true); // 45 lb bar
});

test('warm-ups are always lighter than the first working set', () => {
  for (const rm of [22, 25, 30, 40, 60, 100, 250]) for (const goal of ['strength', 'hypertrophy'] as const) {
    const l = prog(rm, 'kg', goal);
    for (const wu of l.warmups) assert.ok(wu.weight < l.weeks[0].weight, `${rm} ${goal}: ${wu.label} ${wu.weight} vs ${l.weeks[0].weight}`);
  }
  const ui = readFileSync(new URL('../../../src/islands/StrengthProgram.tsx', import.meta.url), 'utf8');
  assert.match(ui, /lift\.belowBar &&/);
  assert.match(ui, /lift\.warmups\.length/);
});

const base = { age: 40, sleepHours: 8, waist: 80, height: 175, activity: 'moderate', smoking: 'never', alcoholPerWeek: 2, fruitVegPerDay: 5, stress: 'low' } as const;
const heart = (restingHr: number) => {
  const r = computeLifestyleAge({ ...base, restingHr });
  return { r, f: r.factors.find((x) => x.key === 'heart')! };
};

test('lifestyle age: a pulse below 40 is not rewarded; above 100 prompts review', () => {
  assert.equal(heart(35).f.years, 0);
  assert.match(heart(35).f.tip, /seek prompt medical advice/);
  assert.match(heart(35).r.pulseNotice ?? '', /outside 40–100 bpm/);
  assert.equal(heart(110).f.years, 3.5);
  assert.match(heart(110).f.tip, /medical review/);
  assert.ok(heart(110).r.pulseNotice);
  assert.equal(heart(55).f.years, -2);
  assert.match(heart(55).f.tip, /check with a clinician/);
  assert.equal(heart(55).r.pulseNotice, undefined);
  assert.equal(heart(100).r.pulseNotice, undefined);
  const ui = readFileSync(new URL('../../../src/islands/LifestyleAge.tsx', import.meta.url), 'utf8');
  assert.match(ui, /result\.pulseNotice &&/);
});

test('lifestyle age: total swing stays capped at ±12 years', () => {
  const worst = computeLifestyleAge({ age: 40, restingHr: 95, sleepHours: 4, waist: 120, height: 170, activity: 'sedentary', smoking: 'current', alcoholPerWeek: 30, fruitVegPerDay: 0, stress: 'severe' });
  assert.equal(worst.totalAdjustment, 12);
  assert.equal(worst.bodyAge, 52);
});
