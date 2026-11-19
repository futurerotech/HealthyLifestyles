import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, cmToIn, ftInToCm, inToCm, round } from '../../../src/lib/units.ts';
import { readFileSync } from 'node:fs';

const def = DEFS['waist-to-height-ratio-calculator'];
const estimate = (waist: number, height: number, units: ComputeCtx['units'] = 'metric') =>
  def.compute({ vals: { waist, height }, sex: 'male', units, selects: {} });

test('same-unit ratio follows NICE worked example, not percent or BMI', () => {
  const r = estimate(96.5, 170);
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '0.57');
  assert.equal(r.category?.label, 'Increased central adiposity');
  assert.equal(r.visual.kind, 'gauge');
  if (r.visual.kind === 'gauge') assert.equal(r.visual.value, 0.57);
});

test('exact 0.40, 0.50, 0.60 boundaries enter the proper NICE bands', () => {
  for (const [ratio, label] of [
    [0.4, 'Within reference range'],
    [0.5, 'Increased central adiposity'],
    [0.6, 'High central adiposity'],
  ] as const) {
    const r = estimate(170 * ratio, 170);
    assert.equal(r.ok, true);
    assert.equal(r.primaryValue, ratio.toFixed(2).replace(/0$/, ''));
    assert.equal(r.category?.label, label, String(ratio));
  }
});

test('below 0.40 is not mislabeled slim, healthy, or underweight', () => {
  const r = estimate(44, 120);
  assert.equal(r.ok, true);
  assert.equal(r.category?.label, 'Below reference range');
  assert.doesNotMatch(r.note ?? '', /underweight/);
});

test('displayed rounding and band are consistent on either side of cutoffs', () => {
  const cases: Array<[number, string, string]> = [
    [0.494, '0.49', 'Within reference range'],
    [0.496, '0.5', 'Increased central adiposity'],
    [0.594, '0.59', 'Increased central adiposity'],
    [0.596, '0.6', 'High central adiposity'],
  ];
  for (const [ratio, shown, label] of cases) {
    const r = estimate(ratio * 200, 200);
    assert.equal(r.ok, true);
    assert.equal(r.primaryValue, shown, String(ratio));
    assert.equal(r.category?.label, label, String(ratio));
    if (r.visual.kind === 'gauge') assert.equal(r.visual.value, Number(shown));
  }
});

test('valid extreme waist ratio never gets hidden at the former 0.7 gauge limit', () => {
  const r = estimate(200, 120);
  assert.equal(r.ok, true);
  assert.equal(r.category?.label, 'High central adiposity');
  assert.equal(r.primaryValue, '1.67');
  assert.equal(r.visual.kind, 'gauge');
  if (r.visual.kind === 'gauge') {
    assert.ok(r.visual.max >= r.visual.value);
    assert.ok(r.visual.max > 0.7);
    assert.equal(r.visual.segments.at(-1)?.upTo, r.visual.max);
  }
});

test('missing, nonpositive and nonfinite inputs fail without a misleading band', () => {
  for (const [waist, height] of [
    [0, 170], [-2, 170], [85, 0], [85, -1],
    [NaN, 170], [85, NaN], [Infinity, 170], [85, Infinity],
  ]) {
    const r = estimate(waist, height);
    assert.equal(r.ok, false, String(waist) + '/' + String(height));
    assert.equal(r.category, undefined);
    assert.equal(r.visual.kind, 'none');
  }
  const missing = def.compute({ vals: { waist: 85 }, sex: 'female', units: 'metric', selects: {} });
  assert.equal(missing.ok, false);
});

test('imperial and metric give matching ratios using precise reversible conversions', () => {
  for (const [waist, height] of [[85, 170], [91.3, 176], [96.5, 170], [110, 183]]) {
    const p = cmToFtIn(height, 0.01);
    const backHeight = round(ftInToCm(p.ft, p.inch), 2);
    const inches = round(cmToIn(waist), 2);
    const backWaist = round(inToCm(inches), 2);
    const m = estimate(waist, height), imperial = estimate(backWaist, backHeight, 'imperial');
    assert.equal(m.ok, true);
    assert.equal(imperial.ok, true);
    assert.equal(imperial.primaryValue, m.primaryValue);
    assert.equal(imperial.category?.label, m.category?.label);
    assert.ok(Math.abs(backHeight - height) <= 0.02);
    assert.ok(Math.abs(backWaist - waist) <= 0.02);
  }
});

test('WHtR retains existing allowed inputs, applies mid-waist guidance and no sex choice', () => {
  assert.equal(def.hasSex, false);
  assert.deepEqual(def.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['waist', 'length', 40, 200], ['height', 'height', 120, 230],
  ]);
  assert.match(def.fields[0].help ?? '', /halfway between your lowest rib and the top of your hip bone/);
  assert.match(estimate(85, 175).note ?? '', /BMI below 35/);
});

test('WHtR-only form precision is explicit and retains the earlier Boer case', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /const preciseHeight = .*?CalcDef/);
  assert.match(ui, /def.slug === 'lean-body-mass-calculator' \|\| def.slug === 'waist-to-height-ratio-calculator'/);
  assert.match(ui, /def.slug === 'waist-to-height-ratio-calculator' \? 2 : 1/);
  assert.deepEqual(cmToFtIn(176, 0.01), { ft: 5, inch: 9.29 });
  assert.deepEqual(cmToFtIn(176), { ft: 5, inch: 9.5 });
});
