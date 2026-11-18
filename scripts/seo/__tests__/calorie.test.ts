import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const calculator = DEFS['calorie-calculator'];
const estimate = (
  weight: number, height: number, age: number,
  sex: ComputeCtx['sex'] = 'male',
  activity = '1.375',
  units: ComputeCtx['units'] = 'metric',
) => calculator.compute({ vals: { weight, height, age }, selects: { activity }, sex, units });

test('male Mifflin predicted REE feeds activity-selected TDEE (not measured BMR)', () => {
  const r = estimate(70, 175, 30);
  assert.equal(r.ok, true);
  assert.equal(r.primaryLabel, 'Estimated daily expenditure (TDEE)');
  assert.equal(r.primaryValue, '2,267 kcal/day');
  assert.deepEqual(r.rows?.map(x => x.value), [
    '1,649 kcal/day',
    '×1.375 (Lightly active — 1–3 days/week)',
  ]);
  assert.match(r.note ?? '', /not a measured BMR/);
});

test('female constant is -161, not +5, preserving Mifflin original', () => {
  const male = estimate(70, 175, 30);
  const female = estimate(70, 175, 30, 'female');
  assert.equal(male.primaryValue, '2,267 kcal/day');
  assert.equal(female.primaryValue, '2,039 kcal/day');
  assert.equal(female.rows?.[0].value, '1,483 kcal/day');
});

test('all five original activity factors remain correct illustrative multipliers', () => {
  const expected = [
    ['1.2', '1,979 kcal/day'],
    ['1.375', '2,267 kcal/day'],
    ['1.55', '2,556 kcal/day'],
    ['1.725', '2,844 kcal/day'],
    ['1.9', '3,133 kcal/day'],
  ];
  const field = calculator.fields.find(f => f.key === 'activity');
  assert.deepEqual(field?.options?.map(x => x.value), expected.map(x => x[0]));
  for (const [activity, total] of expected) {
    const result = estimate(70, 175, 30, 'male', activity);
    assert.equal(result.ok, true);
    assert.equal(result.primaryValue, total);
    assert.match(result.rows?.[1].value ?? '', new RegExp(activity.replace('.', '\\.')));
  }
});

test('invalid, missing and partial activity factors fail instead of defaulting', () => {
  for (const activity of ['', '1.55garbage', '0', '100', 'Infinity', '1.234', '1.200']) {
    const r = estimate(70, 175, 30, 'male', activity);
    assert.equal(r.ok, false, activity);
    assert.equal(r.cards, undefined);
    assert.equal(r.visual.kind, 'none');
  }
  const absent = calculator.compute({
    vals: { weight: 70, height: 175, age: 30 },
    selects: {}, sex: 'male', units: 'metric',
  });
  assert.equal(absent.ok, false);
  assert.match(absent.error ?? '', /listed activity levels/);
});

test('invalid sex or nonfinite and missing measurements fail closed', () => {
  const combos: Array<[number, number, number]> = [
    [0, 175, 30], [-2, 175, 30], [70, 0, 30], [70, -1, 30],
    [70, 175, 0], [70, 175, -5], [NaN, 175, 30], [70, NaN, 30],
    [70, 175, NaN], [Infinity, 175, 30], [70, Infinity, 30],
    [70, 175, Infinity],
  ];
  for (const [weight, height, age] of combos) {
    const result = estimate(weight, height, age);
    assert.equal(result.ok, false, [weight, height, age].join('/'));
    assert.equal(result.primaryValue, '—');
    assert.equal(result.cards, undefined);
  }
  assert.equal(calculator.compute({
    vals: { weight: 70, height: 175 }, selects: { activity: '1.375' },
    sex: 'male', units: 'metric',
  }).ok, false);
  assert.equal(calculator.compute({
    vals: { weight: 70, height: 175, age: 30 }, selects: { activity: '1.375' },
    sex: 'nonbinary' as ComputeCtx['sex'], units: 'metric',
  }).ok, false);
});

test('age and anthropometric boundaries match original BMR study scope and UI', () => {
  assert.deepEqual(calculator.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['weight', 'mass', 25, 300], ['height', 'height', 120, 230],
    ['age', 'age', 19, 100], ['activity', 'select', 0, 0],
  ]);
  assert.equal(estimate(25, 120, 19).ok, true);
  assert.equal(estimate(300, 230, 100).ok, true);
  for (const [weight, height, age] of [
    [24.99, 175, 30], [300.01, 175, 30],
    [70, 119.99, 30], [70, 230.01, 30],
    [70, 175, 18], [70, 175, 101], [70, 175, 30.5],
  ]) assert.equal(estimate(weight, height, age).ok, false);
  assert.match(calculator.fields[2].help ?? '', /ages 19–78/);
});

test('500-kcal cards retain arithmetic but never claim predicted weekly weight', () => {
  const result = estimate(70, 175, 30, 'male', '1.2');
  assert.equal(result.primaryValue, '1,979 kcal/day');
  assert.deepEqual(result.cards?.map(c => c.label), [
    '500 kcal less (example)',
    'Estimated maintenance expenditure',
    '500 kcal more (example)',
  ]);
  assert.deepEqual(result.cards?.map(c => c.value), [
    '1,479 kcal/day', '1,979 kcal/day', '2,479 kcal/day',
  ]);
  for (const c of result.cards ?? []) {
    assert.doesNotMatch(c.sub ?? '', /week|safe|goal weight/);
    assert.doesNotMatch(c.label, /Lose weight|Gain weight/);
  }
  assert.match(result.callout?.text ?? '', /do not establish safe food-intake goals/);
});

test('no universal female or male calorie floor is used to clamp a deficit', () => {
  // Female: 50 kg, 160 cm, 70y -> REE 989, TDEE 1186.8 sedentary.
  const f = estimate(50, 160, 70, 'female', '1.2');
  assert.equal(f.ok, true);
  assert.equal(f.primaryValue, '1,187 kcal/day');
  assert.equal(f.cards?.[0].value, 'Not shown');
  assert.equal(f.cards?.[1].value, '1,187 kcal/day');
  assert.equal(f.cards?.[2].value, '1,687 kcal/day');
  assert.match(f.callout?.text ?? '', /below 1,000/);
  assert.match(f.callout?.text ?? '', /NOT a universal safe minimum/);
  assert.equal(f.cards?.[0].tone, 'warn');
});

test('very low predicted TDEE withholds illustrative intakes and gives warning', () => {
  const r = estimate(25, 120, 100, 'female', '1.2');
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '407 kcal/day');
  assert.equal(r.cards?.[0].value, 'Not shown');
  assert.equal(r.cards?.[2].value, 'Not shown');
  assert.equal(r.callout?.tone, 'warn');
  assert.match(r.callout?.text ?? '', /do not use this number to plan food intake/);
});

test('metric and imperial input toggles preserve TDEE for ordinary measurements', () => {
  for (const [weight, height, age] of [[70, 175, 30], [72, 176, 30], [80, 180, 40]]) {
    const { ft, inch } = cmToFtIn(height, 0.01);
    const backHeight = round(ftInToCm(ft, inch), 2);
    const backWeight = round(lbToKg(round(kgToLb(weight), 3)), 2);
    for (const sex of ['male', 'female'] as const) {
      const metric = estimate(weight, height, age, sex);
      const imperial = estimate(backWeight, backHeight, age, sex, '1.375', 'imperial');
      assert.equal(metric.ok, true);
      assert.equal(imperial.ok, true);
      assert.equal(imperial.primaryValue, metric.primaryValue);
      assert.ok(Math.abs(backHeight - height) <= 0.02);
      assert.ok(Math.abs(backWeight - weight) <= 0.01);
    }
  }
});

test('new UI precision is scoped to calorie calculator and preserves other units', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /def.slug === 'calorie-calculator'/);
  assert.match(ui, /preciseHeight\(def\) \? 0.01 : 0.5/);
  assert.match(ui, /preciseWeight\(def\) \? 3 : 1/);
  assert.deepEqual(cmToFtIn(176), { ft: 5, inch: 9.5 });
  assert.deepEqual(cmToFtIn(176, 0.01), { ft: 5, inch: 9.29 });
});

test('calorie output avoids fixed-loss guarantees and inappropriate prescriptions', () => {
  const r = estimate(70, 175, 30);
  assert.match(r.note ?? '', /not a calorie prescription/);
  assert.match(r.note ?? '', /fixed 500-kcal difference does not guarantee/);
  assert.doesNotMatch(r.note ?? '', /safe minimum of 1,200|safe minimum of 1,500/);
  assert.equal(r.visual.kind, 'none');
});
