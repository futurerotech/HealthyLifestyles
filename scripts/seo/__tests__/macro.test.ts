import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const macro = DEFS['macro-calculator'];
const calculate = (
  weight: number, height: number, age: number,
  sex: ComputeCtx['sex'] = 'male', activity = '1.375',
  goal = 'maintain', units: ComputeCtx['units'] = 'metric',
) => macro.compute({ vals: { weight, height, age }, sex, selects: { activity, goal }, units });

test('published simplified Mifflin male and female REE coefficients are retained', () => {
  const male = calculate(70, 175, 30);
  const female = calculate(70, 175, 30, 'female');
  assert.equal(male.ok, true);
  assert.equal(female.ok, true);
  assert.equal(male.rows?.[3].value, '1,649 kcal/day');
  assert.equal(female.rows?.[3].value, '1,483 kcal/day');
  assert.equal(male.primaryValue, '2,267 kcal/day');
  assert.equal(female.primaryValue, '2,039 kcal/day');
});

test('all five selectable activity multipliers preserve original TDEE arithmetic', () => {
  const expected = [
    ['1.2', '1,979 kcal/day'],
    ['1.375', '2,267 kcal/day'],
    ['1.55', '2,556 kcal/day'],
    ['1.725', '2,844 kcal/day'],
    ['1.9', '3,133 kcal/day'],
  ];
  const options = macro.fields.find(f => f.key === 'activity')?.options;
  assert.deepEqual(options?.map(o => o.value), expected.map(x => x[0]));
  for (const [activity, kcal] of expected) {
    const r = calculate(70, 175, 30, 'male', activity);
    assert.equal(r.ok, true, activity);
    assert.equal(r.primaryValue, kcal, activity);
    assert.match(r.rows?.[4].value ?? '', new RegExp(activity.replace('.', '\\.')));
  }
});

test('three original cut, maintain and bulk shifts remain illustrations, not clinical targets', () => {
  for (const [goal, value, protein, fat] of [
    ['cut', '1,767 kcal/day', '154 g', '56 g'],
    ['maintain', '2,267 kcal/day', '126 g', '63 g'],
    ['bulk', '2,567 kcal/day', '112 g', '70 g'],
  ]) {
    const r = calculate(70, 175, 30, 'male', '1.375', goal);
    assert.equal(r.ok, true, goal);
    assert.equal(r.primaryValue, value, goal);
    assert.ok(r.rows?.[0].value.startsWith(protein), goal);
    assert.ok(r.rows?.[2].value.startsWith(fat), goal);
    assert.match(r.primaryLabel, /Illustrative macro energy/);
    assert.match(r.callout?.text ?? '', /not a safe calorie target/);
  }
});

test('macro 4/4/9 energy and donut reconcile exactly before display rounding', () => {
  const male = calculate(70, 175, 30);
  const visual = male.visual;
  assert.equal(visual.kind, 'donut');
  if (visual.kind === 'donut') {
    assert.equal(visual.centerValue, '2,267');
    assert.equal(visual.slices.length, 3);
    assert.ok(Math.abs(visual.slices.reduce((sum,s) => sum + s.pct, 0) - 100) < 1e-8);
    assert.ok(visual.slices.every(s => s.pct >= 0));
  }
  assert.equal(male.rows?.[0].value, '126 g · 504 kcal');
  assert.equal(male.rows?.[2].value, '63 g · 567 kcal');
  assert.equal(male.rows?.[1].value, '299 g · 1,196 kcal');
});

test('impossible heavy-weight cut no longer silently clamps negative carbs to zero', () => {
  const r = calculate(300, 120, 100, 'female', '1.2', 'cut');
  assert.equal(r.ok, false);
  assert.equal(r.primaryValue, '—');
  assert.equal(r.visual.kind, 'none');
  assert.equal(r.rows, undefined);
  assert.equal(r.cta, undefined);
  assert.match(r.error ?? '', /exceed the estimated energy budget/);
  assert.match(r.error ?? '', /No inaccurate split is shown/);
});

test('very low modeled TDEE or lower-energy scenario never becomes a sex-based safe floor', () => {
  const veryLow = calculate(25, 120, 100, 'female', '1.2', 'maintain');
  assert.equal(veryLow.ok, false);
  assert.match(veryLow.error ?? '', /under 1,000 kcal\/day/);
  assert.equal(veryLow.cta, undefined);
  const below = calculate(50, 160, 70, 'female', '1.2', 'cut');
  assert.equal(below.ok, false);
  assert.match(below.error ?? '', /not a universal safe-calorie threshold/);
  assert.equal(below.visual.kind, 'none');
});

test('activity selection rejects missing, partial, invalid and extreme factors', () => {
  for (const activity of ['', '1.55junk', '0', 'Infinity', '1.200', '100', '1.234']) {
    const r = calculate(70, 175, 30, 'male', activity);
    assert.equal(r.ok, false, activity);
    assert.match(r.error ?? '', /listed activity levels/);
  }
  const r = macro.compute({ vals: { weight: 70, height: 175, age: 30 },
    sex: 'female', selects: { goal: 'maintain' }, units: 'metric' });
  assert.equal(r.ok, false);
});

test('goal selection rejects missing, partial and unknown scenarios', () => {
  for (const goal of ['', 'loose', 'cut-fast', 'bulk extra', 'maintain1']) {
    const r = calculate(70, 175, 30, 'male', '1.375', goal);
    assert.equal(r.ok, false, goal);
    assert.match(r.error ?? '', /listed macro scenarios/);
  }
  const missing = macro.compute({ vals: { weight: 70, height: 175, age: 30 },
    sex: 'female', selects: { activity: '1.375' }, units: 'metric' });
  assert.equal(missing.ok, false);
});

test('zero, negative, NaN, Infinity, missing and unsupported sex never return macro numbers', () => {
  const cases: Array<[number, number, number]> = [
    [0, 175, 30], [-1, 175, 30], [70, 0, 30], [70, -1, 30],
    [70, 175, 0], [70, 175, -1], [NaN, 175, 30], [70, NaN, 30],
    [70, 175, NaN], [Infinity, 175, 30], [70, Infinity, 30],
    [70, 175, Infinity],
  ];
  for (const [weight, height, age] of cases) {
    const r = calculate(weight, height, age);
    assert.equal(r.ok, false, [weight, height, age].join('/'));
    assert.equal(r.primaryValue, '—');
    assert.equal(r.visual.kind, 'none');
  }
  assert.equal(macro.compute({ vals: { weight: 70, height: 175 },
    sex: 'male', units: 'metric', selects: { activity: '1.375', goal: 'maintain' } }).ok, false);
  assert.equal(macro.compute({ vals: { weight: 70, height: 175, age: 30 },
    sex: 'invalid' as ComputeCtx['sex'], units: 'metric', selects: { activity: '1.375', goal: 'maintain' } }).ok, false);
});

test('original weight/height domain and adult whole years 19 to 100 are enforced', () => {
  assert.deepEqual(macro.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['weight', 'mass', 25, 300], ['height', 'height', 120, 230],
    ['age', 'age', 19, 100], ['activity', 'select', 0, 0], ['goal', 'select', 0, 0],
  ]);
  assert.equal(calculate(25, 120, 19, 'male', '1.9', 'bulk').ok, true);
  assert.equal(calculate(300, 230, 100, 'male', '1.9', 'bulk').ok, true);
  for (const [weight, height, age] of [
    [24.9, 175, 30], [300.01, 175, 30], [70, 119.9, 30],
    [70, 230.1, 30], [70, 175, 18], [70, 175, 101], [70, 175, 30.5],
  ]) assert.equal(calculate(weight, height, age).ok, false);
});

test('precision-preserving metric/imperial roundtrip leaves ordinary macro results intact', () => {
  for (const [w,h,age] of [[70,175,30],[72,176,30],[80,180,40]]) {
    const { ft, inch } = cmToFtIn(h, 0.01);
    const backHeight = round(ftInToCm(ft,inch), 2);
    const backWeight = round(lbToKg(round(kgToLb(w), 3)), 2);
    for (const sex of ['male','female'] as const) {
      const m = calculate(w,h,age,sex);
      const imp = calculate(backWeight,backHeight,age,sex,'1.375','maintain','imperial');
      assert.equal(m.ok, true);
      assert.equal(imp.ok, true);
      assert.equal(imp.primaryValue,m.primaryValue);
      assert.equal(imp.rows?.[0].value,m.rows?.[0].value);
      assert.equal(imp.rows?.[1].value,m.rows?.[1].value);
    }
  }
});

test('valid split preserves existing meal planner link without promising suitability', () => {
  const r = calculate(70,175,30);
  assert.equal(r.ok, true);
  assert.match(r.cta?.href ?? '', /^\/tools\/meal-plan-generator\?calories=/);
  assert.match(r.cta?.label ?? '', /Preview these estimates/);
  assert.match(r.note ?? '', /No fixed calorie floor or macro ratio is universally safe/);
  assert.doesNotMatch(r.callout?.text ?? '', /guarantee|safe minimum of/);
});

test('precision change stays limited to macro calculator and other tools remain unchanged', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /def.slug === 'macro-calculator'/);
  assert.match(ui, /preciseHeight\(def\) \? 0.01 : 0.5/);
  assert.match(ui, /preciseWeight\(def\) \? 3 : 1/);
  assert.deepEqual(cmToFtIn(176), { ft: 5, inch: 9.5 });
  assert.deepEqual(cmToFtIn(176,0.01), { ft: 5, inch: 9.29 });
});
