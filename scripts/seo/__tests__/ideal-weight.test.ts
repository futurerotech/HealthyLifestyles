import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const calculator = DEFS['ideal-weight-calculator'];
const estimate = (height: number, sex: ComputeCtx['sex'] = 'male',
                  units: ComputeCtx['units'] = 'metric') =>
  calculator.compute({ vals: { height }, sex, units, selects: {} });

test('adult BMI reference weight uses 18.5 through EXCLUSIVE 25 at 175cm', () => {
  const result = estimate(175);
  assert.equal(result.ok, true);
  assert.equal(result.primaryLabel, 'Adult BMI reference weight interval');
  assert.equal(result.primaryValue, '56.7 kg to under 76.6 kg');
  assert.equal(result.visual.kind, 'range');
  if (result.visual.kind === 'range') {
    assert.equal(result.visual.low, 56.7);
    assert.equal(result.visual.high, 76.6);
    assert.equal(result.visual.upperExclusive, true);
    assert.equal(result.visual.label, 'BMI reference (not a goal)');
  }
  assert.match(result.note ?? '', /not a personal weight goal/);
});

test('original Devine male and female coefficients give 73 and 68.5kg at 70in', () => {
  const height = 70 * 2.54;
  assert.equal(estimate(height, 'male').rows?.[0].value, '73 kg');
  assert.equal(estimate(height, 'female').rows?.[0].value, '68.5 kg');
});

test('female 5ft 6in matches documented 59.3 kg Devine example', () => {
  const result = estimate(66 * 2.54, 'female');
  assert.equal(result.ok, true);
  assert.equal(result.rows?.[0].value, '59.3 kg');
  assert.match(result.rows?.[0].label ?? '', /historical dosing-weight reference/);
});

test('at exactly 60 inches Devine gives the original base weights', () => {
  assert.equal(estimate(152.4, 'male').rows?.[0].value, '50 kg');
  assert.equal(estimate(152.4, 'female').rows?.[0].value, '45.5 kg');
  assert.equal(estimate(152.4).ok, true);
});

test('under 5 feet BMI still works but no fictitious fixed Devine weight is shown', () => {
  for (const height of [120, 145, 150, 152.39]) {
    for (const sex of ['male', 'female'] as const) {
      const result = estimate(height, sex);
      assert.equal(result.ok, true);
      assert.equal(result.rows?.[0].value, 'Not provided below 5 ft (152.4 cm)');
      assert.match(result.note ?? '', /Devine value is provided for shorter heights/);
      assert.equal(result.visual.kind, 'range');
      assert.match(result.primaryValue, /kg to under .* kg/);
    }
  }
  assert.equal(estimate(120).primaryValue, '26.6 kg to under 36 kg');
});

test('invalid, missing, negative, nonfinite or unsupported inputs fail closed', () => {
  for (const height of [0, -1, 119.99, 230.01, NaN, Infinity, -Infinity]) {
    const r = estimate(height);
    assert.equal(r.ok, false, String(height));
    assert.equal(r.primaryValue, '—');
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.rows, undefined);
  }
  assert.equal(calculator.compute({ vals: {}, sex: 'female', units: 'metric', selects: {} }).ok, false);
  assert.equal(calculator.compute({
    vals: { height: 175 }, sex: 'unspecified' as ComputeCtx['sex'],
    units: 'metric', selects: {},
  }).ok, false);
});

test('configured 120–230cm height domain and no new inputs were introduced', () => {
  assert.equal(calculator.hasSex, true);
  assert.deepEqual(calculator.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['height', 'height', 120, 230],
  ]);
  assert.equal(estimate(120).ok, true);
  assert.equal(estimate(230).ok, true);
});

test('metric/imperial height conversion preserves reference and Devine when displayed', () => {
  for (const height of [120, 150, 152.4, 160, 167.64, 175, 177.8, 200, 230]) {
    const { ft, inch } = cmToFtIn(height, 0.001);
    const cmBack = round(ftInToCm(ft, inch), 2);
    assert.ok(Math.abs(cmBack - height) <= 0.02, String(height));
    for (const sex of ['male', 'female'] as const) {
      const m = estimate(height, sex, 'metric'), i = estimate(cmBack, sex, 'imperial');
      assert.equal(m.ok, true);
      assert.equal(i.ok, true);
      assert.equal(m.rows?.[0].value === 'Not provided below 5 ft (152.4 cm)',
        i.rows?.[0].value === 'Not provided below 5 ft (152.4 cm)',
        String(height) + '/' + sex);
      assert.equal(i.visual.kind, 'range');
      if (i.visual.kind === 'range') {
        const lowLb = 18.5 * (cmBack / 100) ** 2;
        assert.equal(i.visual.low, round(kgToLb(lowLb), 1));
        assert.equal(i.visual.high, round(kgToLb(25 * (cmBack / 100) ** 2), 1));
        assert.equal(i.visual.upperExclusive, true);
      }
      assert.match(i.primaryValue, /lb to under .* lb/);
      assert.ok(Math.abs(lbToKg(kgToLb(50)) - 50) < 1e-10);
    }
  }
});

test('precision change only touches ideal-weight height, preserving other tools', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /def.slug === 'ideal-weight-calculator'/);
  assert.match(ui, /def.slug === 'ideal-weight-calculator' \? 0.001 : preciseHeight\(def\) \? 0.01 : 0.5/);
  assert.match(ui, /slug === 'ideal-weight-calculator' \? '0.001' : preciseHeight\(def\) \? '0.01' : '0.5'/);
  assert.deepEqual(cmToFtIn(176), { ft: 5, inch: 9.5 });
  assert.deepEqual(cmToFtIn(176, 0.01), { ft: 5, inch: 9.29 });
  assert.deepEqual(cmToFtIn(176, 0.001), { ft: 5, inch: 9.291 });
  assert.deepEqual(cmToFtIn(152.39, 0.001), { ft: 4, inch: 11.996 });
  assert.deepEqual(cmToFtIn(152.4, 0.001), { ft: 5, inch: 0 });
  assert.equal(round(ftInToCm(4, 11.996), 2), 152.39);
});

test('the range renderer labels this result as reference with upper excluded', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /v.label \?\? 'Healthy'/);
  assert.match(ui, /v.upperExclusive \? 'under ' : ''/);
  const r = estimate(175);
  assert.equal(r.visual.kind, 'range');
  if (r.visual.kind === 'range') {
    assert.equal(r.visual.upperExclusive, true);
    assert.ok(r.visual.low >= r.visual.min);
    assert.ok(r.visual.high <= r.visual.max);
  }
});

test('Devine is not a medication dose or individual fitness recommendation', () => {
  for (const r of [estimate(175), estimate(145)]) {
    assert.equal(r.ok, true);
    assert.match(r.note ?? '', /do not|cannot/i);
    assert.doesNotMatch(r.primaryLabel, /target|ideal/i);
  }
});
