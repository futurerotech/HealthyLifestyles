import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, ftInToCm, cmToIn, inToCm, kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const calculator = DEFS['lean-body-mass-calculator'];
const estimate = (sex: ComputeCtx['sex'], weight: number, height: number,
                  units: ComputeCtx['units'] = 'metric') =>
  calculator.compute({ sex, units, vals: { weight, height }, selects: {} });

test('Boer male example uses original kg/cm coefficients without silent corrections', () => {
  const result = estimate('male', 75, 175);
  assert.equal(result.ok, true);
  assert.equal(result.primaryValue, '58.1 kg');
  assert.equal(result.primaryLabel, 'Estimated lean body mass');
  assert.deepEqual(result.rows?.map(r => r.value), ['17 kg', '77.4%']);
  assert.equal(result.visual.kind, 'split');
  if (result.visual.kind === 'split') {
    assert.equal(result.visual.aValue, 58.1);
    assert.equal(result.visual.bValue, 17);
    assert.equal(result.visual.unit, 'kg');
  }
});

test('Boer female example independently retains the correct published coefficients', () => {
  const result = estimate('female', 65, 165);
  assert.equal(result.ok, true);
  assert.equal(result.primaryValue, '46.1 kg');
  assert.deepEqual(result.rows?.map(r => r.value), ['18.9 kg', '71%']);
});

test('metric and imperial paths use exact weight and height definitions', () => {
  assert.equal(lbToKg(1), 0.45359237);
  assert.equal(inToCm(1), 2.54);
  for (const sex of ['male', 'female'] as const) {
    const weight = 80, height = 178;
    const metric = estimate(sex, weight, height);
    const imperial = estimate(sex, lbToKg(kgToLb(weight)), inToCm(cmToIn(height)), 'imperial');
    assert.equal(metric.ok, true);
    assert.equal(imperial.ok, true);
    const lbm = sex === 'male' ? 0.407 * weight + 0.267 * height - 19.2
      : 0.252 * weight + 0.473 * height - 48.3;
    assert.equal(imperial.primaryValue, round(kgToLb(lbm), 1).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    }) + ' lb');
    assert.equal(imperial.visual.kind, 'split');
    if (imperial.visual.kind === 'split') {
      assert.equal(imperial.visual.unit, 'lb');
      assert.ok(Math.abs(imperial.visual.aValue + imperial.visual.bValue - kgToLb(weight)) < 0.11);
    }
  }
});

test('implausible lean mass exceeding total weight never becomes zero fat', () => {
  for (const sex of ['male', 'female'] as const) {
    const bad = estimate(sex, 25, 230);
    assert.equal(bad.ok, false);
    assert.match(bad.error ?? '', /impossible lean\/fat mass split/);
    assert.equal(bad.visual.kind, 'none');
    assert.equal(bad.rows, undefined);
  }
  assert.equal(estimate('male', 75, 175).ok, true);
});

test('nonfinite and missing/negative measurements fail without bogus percentages', () => {
  const cases: Array<[number, number]> = [
    [0, 175], [-1, 175], [75, 0], [75, -12],
    [NaN, 175], [75, NaN], [Infinity, 175], [75, -Infinity],
  ];
  for (const [weight, height] of cases) {
    const result = estimate('male', weight, height);
    assert.equal(result.ok, false, String(weight) + '/' + height);
    assert.equal(result.visual.kind, 'none');
    assert.equal(result.primaryValue, '—');
  }
});

test('precise height unit toggle avoids the prior centimeter round-trip drift', () => {
  assert.deepEqual(cmToFtIn(176), { ft: 5, inch: 9.5 });
  const p = cmToFtIn(176, 0.01);
  assert.deepEqual(p, { ft: 5, inch: 9.29 });
  assert.equal(round(ftInToCm(p.ft, p.inch), 2), 176);
  for (const cm of [120, 150, 169.3, 175, 176, 177, 196, 230]) {
    const { ft, inch } = cmToFtIn(cm, 0.01);
    assert.ok(inch >= 0 && inch < 12);
    assert.ok(Math.abs(ftInToCm(ft, inch) - cm) <= 0.013, String(cm));
  }
});

test('unchanged configured calculator field bounds and medically cautious output', () => {
  assert.deepEqual(calculator.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['weight', 'mass', 25, 300], ['height', 'height', 120, 230],
  ]);
  const result = estimate('female', 75, 165);
  assert.equal(result.ok, true);
  assert.match(result.note ?? '', /not measure muscle or fat/);
  assert.match(result.note ?? '', /medication doses/);
  assert.equal(result.category, undefined);
});

test('higher yet mathematically consistent weights give no invented diagnoses', () => {
  const result = estimate('male', 150, 185);
  assert.equal(result.ok, true);
  assert.equal(result.category, undefined);
  assert.equal(result.visual.kind, 'split');
  if (result.visual.kind === 'split') {
    assert.ok(result.visual.aValue > 0 && result.visual.bValue > 0);
  }
});
