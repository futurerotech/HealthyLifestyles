import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { kgToLb, lbToKg, round } from '../../../src/lib/units.ts';
import { readFileSync } from 'node:fs';

const def = DEFS['weight-loss-percentage-calculator'];
const estimate = (start: number, current: number, units: ComputeCtx['units'] = 'metric') =>
  def.compute({ vals: { start, current }, sex: 'female', units, selects: {} });

test('the denominator is starting weight: 90 to 82 is 8.9% loss', () => {
  const result = estimate(90, 82);
  assert.equal(result.ok, true);
  assert.equal(result.primaryLabel, 'Weight lost');
  assert.equal(result.primaryValue, '8.9%');
  assert.equal(result.rows?.[0].value, '8 kg');
  assert.equal(result.category?.label, '5%+ decrease (reference milestone)');
});

test('weight gain uses starting denominator and is never reported as loss', () => {
  const result = estimate(80, 88);
  assert.equal(result.ok, true);
  assert.equal(result.primaryLabel, 'Weight gained');
  assert.equal(result.primaryValue, '10%');
  assert.equal(result.rows?.[0].label, 'Total gained');
  assert.equal(result.rows?.[0].value, '8 kg');
  assert.equal(result.category?.label, 'Weight increased');
  assert.doesNotMatch(result.note ?? '', /5–10% weight loss may improve/);
});

test('identical starting and current weights are labelled unchanged, not lost', () => {
  const r = estimate(90, 90);
  assert.equal(r.ok, true);
  assert.equal(r.primaryLabel, 'Weight unchanged');
  assert.equal(r.primaryValue, '0%');
  assert.equal(r.rows?.[0].label, 'Absolute change');
  assert.equal(r.rows?.[0].value, '0 kg');
  assert.equal(r.category?.label, 'No weight change');
});

test('5% and 10% exact baseline loss boundaries are reference milestones', () => {
  assert.equal(estimate(100, 95).category?.label, '5%+ decrease (reference milestone)');
  assert.equal(estimate(100, 90).category?.label, '10%+ decrease (reference milestone)');
  assert.equal(estimate(100, 95).primaryValue, '5%');
  assert.equal(estimate(100, 90).primaryValue, '10%');
});

test('just below 5% and 10% never falsely qualifies by rounded display', () => {
  const underFive = estimate(100, 95.04);
  const underTen = estimate(100, 90.04);
  assert.equal(underFive.category?.label, 'Weight decreased');
  assert.equal(underTen.category?.label, '5%+ decrease (reference milestone)');
  assert.equal(underFive.primaryValue, '4.96%');
  assert.equal(underTen.primaryValue, '9.96%');
});

test('zero, negative, NaN, infinities and missing input never generate percentages', () => {
  const pairs: [number, number][] = [
    [0, 100], [100, 0], [-10, 100], [100, -20],
    [NaN, 90], [90, NaN], [Infinity, 90], [90, Infinity],
    [-Infinity, 90], [90, -Infinity],
  ];
  for (const [start, current] of pairs) {
    const r = estimate(start, current);
    assert.equal(r.ok, false, String(start) + '/' + String(current));
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.category, undefined);
    assert.equal(r.primaryValue, '—');
  }
  assert.equal(def.compute({ vals: { start: 90 }, sex: 'male', units: 'metric', selects: {} }).ok, false);
});

test('configured 25–350 kg input domain accepted at edges and rejected outside', () => {
  assert.deepEqual(def.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['start', 'mass', 25, 350],
    ['current', 'mass', 25, 350],
  ]);
  assert.equal(estimate(25, 25).ok, true);
  assert.equal(estimate(350, 350).ok, true);
  for (const [start, current] of [[24.9, 100], [100, 24.9], [350.01, 300], [300, 350.01]]) {
    assert.equal(estimate(start, current).ok, false);
  }
});

test('large weight gain remains arithmetic, not a weight-loss milestone', () => {
  const r = estimate(25, 350);
  assert.equal(r.ok, true);
  assert.equal(r.primaryLabel, 'Weight gained');
  assert.equal(r.primaryValue, '1,300%');
  assert.equal(r.category?.label, 'Weight increased');
});

test('exact kg/lb conversions preserve loss and gain categories after unit toggle', () => {
  for (const [start, current] of [
    [90, 82], [100, 95], [100, 90], [100, 95.04], [100, 90.04], [80, 88], [90, 90],
  ]) {
    const sLb = round(kgToLb(start), 3), cLb = round(kgToLb(current), 3);
    const backStart = round(lbToKg(sLb), 2), backCurrent = round(lbToKg(cLb), 2);
    assert.ok(Math.abs(backStart - start) <= 0.01, String(start));
    assert.ok(Math.abs(backCurrent - current) <= 0.01, String(current));
    const expected = estimate(start, current);
    const imperial = estimate(backStart, backCurrent, 'imperial');
    assert.equal(expected.ok, true);
    assert.equal(imperial.ok, true);
    assert.equal(expected.primaryValue, imperial.primaryValue);
    assert.equal(expected.category?.label, imperial.category?.label);
    assert.ok(imperial.rows?.[0].value.endsWith(' lb'));
  }
});

test('the weight precision fix affects only this calculator island', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /const preciseWeight = \(def: CalcDef\): boolean =>/);
  assert.match(ui, /def.slug === 'weight-loss-percentage-calculator'/);
  assert.match(ui, /preciseWeight\(def\) \? 3 : 1/);
  assert.match(ui, /preciseWeight\(def\) \? 2 : 1/);
  assert.match(ui, /f.type === 'mass' && preciseWeight\(def\)/);
  assert.match(ui, /units === 'imperial' \? '0.001' : '0.01'/);
});

test('weight changes alone cannot establish medical benefits, body fat or rate', () => {
  const r = estimate(90, 82);
  assert.match(r.note ?? '', /benefits are not automatic/);
  assert.match(r.note ?? '', /does not measure fat loss, rate of change or health outcomes/);
  assert.equal(r.visual.kind, 'none');
});
