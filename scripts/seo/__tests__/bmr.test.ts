import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const bmr = DEFS['bmr-calculator'];
const compute = (weight: number, height: number, age: number,
                 sex: ComputeCtx['sex'] = 'male',
                 units: ComputeCtx['units'] = 'metric') =>
  bmr.compute({ vals: { weight, height, age }, sex, units, selects: {} });

test('male simplified Mifflin-St Jeor uses +5 and returns estimated REE', () => {
  const r = compute(70, 175, 30);
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '1,649 kcal/day');
  assert.equal(r.primaryLabel, 'Estimated resting energy (REE)');
  assert.match(r.note ?? '', /not identical to measured basal metabolic rate/);
});

test('female simplified Mifflin-St Jeor uses -161 and differs by 166 kcal', () => {
  const male = compute(70, 175, 30, 'male');
  const female = compute(70, 175, 30, 'female');
  assert.equal(female.ok, true);
  assert.equal(female.primaryValue, '1,483 kcal/day');
  assert.equal(Number(male.primaryValue.replace(/[^0-9]/g, '')) -
    Number(female.primaryValue.replace(/[^0-9]/g, '')), 166);
});

test('increasing whole-year age by one reduces predicted REE by 5 kcal/day', () => {
  const younger = compute(80, 180, 40);
  const older = compute(80, 180, 41);
  assert.equal(younger.primaryValue, '1,730 kcal/day');
  assert.equal(older.primaryValue, '1,725 kcal/day');
});

test('activity-factor rows are illustrative TDEE, not another resting rate', () => {
  const r = compute(70, 175, 30, 'male');
  assert.equal(r.ok, true);
  assert.deepEqual(r.rows?.map(v => v.label), [
    'Illustrative TDEE — Sedentary (×1.2)',
    'Illustrative TDEE — Lightly active (×1.375)',
    'Illustrative TDEE — Moderately active (×1.55)',
    'Illustrative TDEE — Active (×1.725)',
    'Illustrative TDEE — Very active (×1.9)',
  ]);
  assert.deepEqual(r.rows?.map(v => v.value), [
    '1,979 kcal/day', '2,267 kcal/day', '2,556 kcal/day',
    '2,844 kcal/day', '3,133 kcal/day',
  ]);
  assert.equal(r.visual.kind, 'none');
});

test('metric and imperial roundtrip preserve resting estimate using precise inputs', () => {
  for (const [weight, height, age] of [
    [70, 175, 30], [72, 176, 30], [80, 180, 40], [56, 165, 60],
  ]) {
    const inch = cmToFtIn(height, 0.01);
    const backHeight = round(ftInToCm(inch.ft, inch.inch), 2);
    const backWeight = round(lbToKg(round(kgToLb(weight), 3)), 2);
    for (const sex of ['male', 'female'] as const) {
      const metric = compute(weight, height, age, sex);
      const imperial = compute(backWeight, backHeight, age, sex, 'imperial');
      assert.equal(metric.ok, true);
      assert.equal(imperial.ok, true);
      assert.equal(imperial.primaryValue, metric.primaryValue);
      assert.deepEqual(imperial.rows?.map(v => v.value), metric.rows?.map(v => v.value));
      assert.ok(Math.abs(backHeight - height) <= 0.02);
      assert.ok(Math.abs(backWeight - weight) <= 0.01);
    }
  }
});

test('invalid positive/finite checks reject zero, NaN, Infinity and missing values', () => {
  for (const [weight, height, age] of [
    [0, 175, 30], [70, 0, 30], [70, 175, 0],
    [-1, 175, 30], [70, -1, 30], [70, 175, -10],
    [NaN, 175, 30], [70, NaN, 30], [70, 175, NaN],
    [Infinity, 175, 30], [70, Infinity, 30], [70, 175, Infinity],
  ]) {
    const r = compute(weight, height, age);
    assert.equal(r.ok, false, String(weight) + '/' + height + '/' + age);
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.primaryValue, '—');
    assert.equal(r.rows, undefined);
  }
  assert.equal(bmr.compute({ vals: { weight: 70, height: 175 }, sex: 'male', units: 'metric', selects: {} }).ok, false);
});

test('existing physical ranges and adult whole-year 19–100 bounds are enforced', () => {
  assert.deepEqual(bmr.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['weight', 'mass', 25, 300],
    ['height', 'height', 120, 230],
    ['age', 'age', 19, 100],
  ]);
  assert.equal(compute(25, 120, 19).ok, true);
  assert.equal(compute(300, 230, 100).ok, true);
  for (const [weight, height, age] of [
    [24.9, 175, 30], [300.01, 175, 30],
    [70, 119.9, 30], [70, 230.1, 30],
    [70, 175, 18], [70, 175, 100.1], [70, 175, 30.5],
  ]) assert.equal(compute(weight, height, age).ok, false, String(weight) + '/' + height + '/' + age);
  assert.match(bmr.fields[2].help ?? '', /original equation was derived in adults ages 19–78/);
});

test('sex must be an explicit male or female coefficient choice', () => {
  const invalid = bmr.compute({
    vals: { weight: 70, height: 175, age: 30 },
    sex: 'unknown' as ComputeCtx['sex'], units: 'metric', selects: {},
  });
  assert.equal(invalid.ok, false);
});

test('additional input precision applies only to this calculator', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /def.slug === 'bmr-calculator'/);
  assert.match(ui, /preciseHeight\(def\) \? 0.01 : 0.5/);
  assert.match(ui, /preciseWeight\(def\) \? 3 : 1/);
  assert.deepEqual(cmToFtIn(176), { ft: 5, inch: 9.5 });
  assert.deepEqual(cmToFtIn(176, 0.01), { ft: 5, inch: 9.29 });
});

test('this prediction is not a calorie prescription or measured metabolic rate', () => {
  const r = compute(70, 175, 30);
  assert.match(r.note ?? '', /not measured expenditure or calorie prescriptions/);
  assert.match(r.note ?? '', /original study included adults ages 19–78/);
});
