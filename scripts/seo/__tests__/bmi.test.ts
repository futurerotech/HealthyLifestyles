import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, cmToIn, ftInToCm, inToCm, kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const bmi = DEFS['bmi-calculator'];
const estimate = (weight: number, height: number, units: ComputeCtx['units'] = 'metric') =>
  bmi.compute({ vals: { weight, height }, units, sex: 'male', selects: {} });

test('BMI follows weight kg divided by squared height meters', () => {
  const result = estimate(70, 175);
  assert.equal(result.ok, true);
  assert.equal(result.primaryValue, '22.9');
  assert.equal(result.category?.label, 'Healthy weight');
  assert.equal(result.primaryLabel, 'Your BMI');
});

test('exact 18.5, 25 and 30 boundary values enter the next CDC adult category', () => {
  const height = 200;
  for (const [cutoff, label] of [
    [18.5, 'Healthy weight'], [25, 'Overweight'], [30, 'Obesity'],
  ] as const) {
    const result = estimate(cutoff * 4, height);
    assert.equal(result.ok, true);
    assert.equal(result.primaryValue, String(cutoff));
    assert.equal(result.category?.label, label, String(cutoff));
  }
});

test('BMI immediately below cutoffs is not assigned to a higher category', () => {
  const cases: [number, string][] = [
    [18.49, 'Underweight'], [24.99, 'Healthy weight'], [29.99, 'Overweight'],
  ];
  for (const [raw, label] of cases) {
    const result = estimate(raw * 4, 200);
    assert.equal(result.ok, true);
    assert.equal(result.category?.label, label);
    assert.equal(result.primaryValue, String(raw));
  }
});

test('near-cutoff rounding does not show 25 for a raw BMI of 24.999', () => {
  const r = estimate(24.999 * 4, 200);
  assert.equal(r.ok, true);
  assert.equal(r.category?.label, 'Healthy weight');
  assert.equal(r.primaryValue, '24.999');
});

test('healthy reference weight starts at BMI 18.5 and ends below BMI 25', () => {
  const r = estimate(70, 175);
  assert.equal(r.ok, true);
  assert.equal(r.rows?.length, 1);
  assert.match(r.rows?.[0].label ?? '', /18.5 to below 25/);
  assert.equal(r.rows?.[0].value, '56.7 kg to under 76.6 kg');
  assert.match(r.note ?? '', /approximate BMI reference, not a personal goal/);
});

test('US customary uses exact kg/lb and cm/in definitions and retains BMI away from cutoffs', () => {
  assert.equal(lbToKg(1), 0.45359237);
  assert.equal(inToCm(1), 2.54);
  const cases = [[70, 175], [82, 180], [100, 176], [65, 164]];
  for (const [w, h] of cases) {
    const metric = estimate(w, h);
    const p = cmToFtIn(h, 0.01);
    const backH = round(ftInToCm(p.ft, p.inch), 2);
    const backW = round(lbToKg(round(kgToLb(w), 3)), 2);
    const imperial = estimate(backW, backH, 'imperial');
    assert.equal(metric.ok, true);
    assert.equal(imperial.ok, true);
    assert.equal(imperial.primaryValue, metric.primaryValue, String(w) + '/' + h);
    assert.equal(imperial.category?.label, metric.category?.label);
    assert.ok(Math.abs(backH - h) <= 0.02);
    assert.ok(Math.abs(backW - w) <= 0.01);
    assert.match(imperial.rows?.[0].value ?? '', /lb/);
  }
});

test('height unit-toggle regression: 176 cm returns near 176 rather than 177', () => {
  const p = cmToFtIn(176, 0.01);
  assert.deepEqual(p, { ft: 5, inch: 9.29 });
  assert.equal(round(ftInToCm(p.ft, p.inch), 2), 176);
  assert.deepEqual(cmToFtIn(176), { ft: 5, inch: 9.5 });
});

test('missing, zero, negative and nonfinite measurements fail closed', () => {
  const cases: [number, number][] = [
    [0, 175], [70, 0], [-1, 175], [70, -1],
    [NaN, 175], [70, NaN], [Infinity, 175], [70, -Infinity],
  ];
  for (const [weight, height] of cases) {
    const r = estimate(weight, height);
    assert.equal(r.ok, false, String(weight) + '/' + height);
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.category, undefined);
    assert.equal(r.primaryValue, '—');
  }
  assert.equal(bmi.compute({ vals: { weight: 70 }, units: 'metric', sex: 'male', selects: {} }).ok, false);
});

test('existing BMI inputs maintain their original domain bounds', () => {
  assert.deepEqual(bmi.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['weight', 'mass', 25, 300], ['height', 'height', 120, 230],
  ]);
  assert.equal(estimate(25, 120).ok, true);
  assert.equal(estimate(300, 230).ok, true);
  for (const [w, h] of [[24.9, 175], [300.1, 175], [70, 119.9], [70, 230.1]]) {
    assert.equal(estimate(w, h).ok, false);
  }
});

test('very high and low supported BMI values stay visible in an expanding gauge', () => {
  const high = estimate(300, 120);
  const low = estimate(25, 230);
  for (const r of [high, low]) {
    assert.equal(r.ok, true);
    assert.equal(r.visual.kind, 'gauge');
    if (r.visual.kind === 'gauge') {
      assert.ok(r.visual.value >= r.visual.min);
      assert.ok(r.visual.value <= r.visual.max);
      assert.equal(r.visual.segments.at(-1)?.upTo, r.visual.max);
    }
  }
  assert.equal(high.category?.label, 'Obesity');
  assert.equal(low.category?.label, 'Underweight');
});

test('BMI tool does not change existing weight-change and WHtR conversion precision', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /def.slug === 'bmi-calculator'/);
  assert.match(ui, /preciseHeight\(def\) \? 0.01 : 0.5/);
  assert.match(ui, /preciseWeight\(def\) \? 3 : 1/);
  assert.match(ui, /preciseWeight\(def\) \? 2 : 1/);
  assert.equal(cmToIn(2.54), 1);
});

test('BMI result is a CDC adult screening category, not an individual diagnosis', () => {
  const r = estimate(70, 175);
  assert.match(r.note ?? '', /adults age 20 and older/);
  assert.match(r.note ?? '', /not a diagnosis/);
  assert.match(r.note ?? '', /not a personal goal/);
  assert.equal(r.visual.kind, 'gauge');
});
