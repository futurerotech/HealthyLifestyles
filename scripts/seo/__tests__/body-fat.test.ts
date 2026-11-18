import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { inToCm } from '../../../src/lib/units.ts';

const calculator = DEFS['body-fat-calculator'];
const estimate = (sex: ComputeCtx['sex'], vals: Record<string, number>) =>
  calculator.compute({ sex, vals, units: 'metric', selects: {} });

function referenceEstimate(sex: ComputeCtx['sex'], height: number, neck: number,
                           waist: number, hip = 0): number {
  const density = sex === 'male'
    ? 1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)
    : 1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height);
  return 495 / density - 450;
}

test('male reference equation uses cm and gives an unmodified realistic estimate', () => {
  const vals = { height: 175, neck: 38, waist: 88 };
  const result = estimate('male', vals);
  assert.equal(result.ok, true);
  assert.equal(result.primaryValue, '19.2%');
  assert.ok(Math.abs(Number.parseFloat(result.primaryValue) -
    referenceEstimate('male', vals.height, vals.neck, vals.waist)) < 0.051);
});

test('female reference equation includes hip and never uses it for the male formula', () => {
  const vals = { height: 165, neck: 32, waist: 76, hip: 100 };
  const female = estimate('female', vals);
  const male = estimate('male', { ...vals, hip: 190 });
  assert.equal(female.ok, true);
  assert.equal(female.primaryValue, '30.4%');
  assert.ok(Math.abs(Number.parseFloat(female.primaryValue) -
    referenceEstimate('female', vals.height, vals.neck, vals.waist, vals.hip)) < 0.051);
  assert.equal(male.primaryValue, estimate('male', vals).primaryValue);
});

test('imperial measurements converted with exactly 2.54 cm/in match metric inputs', () => {
  const inches = { height: 70, neck: 15, waist: 36, hip: 40 };
  const cm = Object.fromEntries(
    Object.entries(inches).map(([key, value]) => [key, inToCm(value)]),
  );
  for (const sex of ['male', 'female'] as const) {
    const result = estimate(sex, cm);
    assert.equal(result.ok, true);
    const expected = referenceEstimate(sex, cm.height, cm.neck, cm.waist, cm.hip);
    assert.ok(Math.abs(Number.parseFloat(result.primaryValue) - expected) <= 0.051);
  }
});

test('invalid, missing, nonfinite and impossible proportions fail closed', () => {
  for (const vals of [
    { height: 175, neck: 38, waist: 38 },
    { height: 175, neck: 38, waist: 20 },
    { height: 0, neck: 38, waist: 88 },
    { height: NaN, neck: 38, waist: 88 },
    { height: Infinity, neck: 38, waist: 88 },
    { height: 175, neck: -20, waist: 88 },
  ]) {
    const result = estimate('male', vals);
    assert.equal(result.ok, false, JSON.stringify(vals));
    assert.equal(result.visual.kind, 'none');
  }
  for (const vals of [
    { height: 165, neck: 32, waist: 76 },
    { height: 165, neck: 32, waist: 76, hip: 0 },
    { height: 165, neck: 32, waist: 20, hip: 10 },
  ]) {
    assert.equal(estimate('female', vals).ok, false, JSON.stringify(vals));
  }
});

test('the former 2% and 60% silent clamps now show actionable errors', () => {
  const belowZero = estimate('male', { height: 175, neck: 38, waist: 40 });
  const overHundred = estimate('female',
    { height: 120, neck: 20, waist: 200, hip: 200 });
  for (const result of [belowZero, overHundred]) {
    assert.equal(result.ok, false);
    assert.match(result.error ?? '', /implausible/);
    assert.equal(result.visual.kind, 'none');
  }
});

function waistForPercent(sex: ComputeCtx['sex'], desired: number,
                         height: number, neck: number, hip = 0): number {
  const density = 495 / (desired + 450);
  const circumference = sex === 'male'
    ? 10 ** ((1.0324 + 0.15456 * Math.log10(height) - density) / 0.19077)
    : 10 ** ((1.29579 + 0.22100 * Math.log10(height) - density) / 0.35004);
  return sex === 'male' ? neck + circumference : neck - hip + circumference;
}

test('general reference band boundaries match one-decimal displayed percentages', () => {
  const maleCases: [number, string][] = [
    [3, 'Essential fat'], [6, 'Athletic'], [14, 'Fitness'],
    [18, 'Average'], [25, 'Higher reference range'],
  ];
  const femaleCases: [number, string][] = [
    [12, 'Essential fat'], [14, 'Athletic'], [21, 'Fitness'],
    [25, 'Average'], [32, 'Higher reference range'],
  ];
  for (const [sex, height, neck, hip, cases] of [
    ['male', 175, 38, 0, maleCases],
    ['female', 165, 32, 100, femaleCases],
  ] as const) {
    for (const [desired, label] of cases) {
      const waist = waistForPercent(sex, desired, height, neck, hip);
      const result = estimate(sex, { height, neck, waist, hip });
      assert.equal(result.ok, true, sex + '/' + desired);
      assert.equal(result.primaryValue, desired.toFixed(0) + '%');
      assert.equal(result.category?.label, label, sex + '/' + desired);
      assert.equal(result.visual.kind, 'gauge');
      if (result.visual.kind === 'gauge') {
        assert.equal(result.visual.max, 100);
        assert.equal(result.visual.value, desired);
      }
    }
  }
});

test('waist tape position is sex-specific and hips are required only for women', () => {
  const waist = calculator.fields.find((f) => f.key === 'waist');
  const hip = calculator.fields.find((f) => f.key === 'hip');
  assert.match(waist?.help ?? '', /Men: measure at the navel/);
  assert.match(waist?.help ?? '', /Women: measure at the narrowest natural waist/);
  assert.equal(hip?.showIf?.({ sex: 'male', vals: {}, units: 'metric', selects: {} }), false);
  assert.equal(hip?.showIf?.({ sex: 'female', vals: {}, units: 'metric', selects: {} }), true);
});
