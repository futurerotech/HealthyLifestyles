import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToIn, inToCm, round } from '../../../src/lib/units.ts';
import { readFileSync } from 'node:fs';

const whr = DEFS['waist-to-hip-ratio-calculator'];
const estimate = (sex: ComputeCtx['sex'], waist: number, hip: number,
                  units: ComputeCtx['units'] = 'metric') =>
  whr.compute({ vals: { waist, hip }, sex, units, selects: {} });

test('the original waist/hip equation is dimensionless for both sexes', () => {
  const male = estimate('male', 82, 100);
  const female = estimate('female', 75, 100);
  assert.equal(male.ok, true);
  assert.equal(male.primaryValue, '0.82');
  assert.equal(female.ok, true);
  assert.equal(female.primaryValue, '0.75');
  assert.equal(male.primaryLabel, 'Waist-to-hip ratio');
});

test('male WHO-referenced Annex A cutoff includes exactly 0.90', () => {
  const below = estimate('male', 89.9, 100);
  const equal = estimate('male', 90, 100);
  const above = estimate('male', 90.1, 100);
  assert.equal(below.category?.label, 'Below reference cutoff');
  assert.equal(equal.category?.label, 'At/above reference cutoff');
  assert.equal(above.category?.label, 'At/above reference cutoff');
  assert.equal(equal.rows?.[0].value, '≥0.90');
});

test('female WHO-referenced Annex A cutoff includes exactly 0.85', () => {
  const below = estimate('female', 84.9, 100);
  const equal = estimate('female', 85, 100);
  const above = estimate('female', 85.1, 100);
  assert.equal(below.category?.label, 'Below reference cutoff');
  assert.equal(equal.category?.label, 'At/above reference cutoff');
  assert.equal(above.category?.label, 'At/above reference cutoff');
  assert.equal(equal.rows?.[0].value, '≥0.85');
});

test('raw numeric classification does not promote values rounded up to cutoff', () => {
  const nearMale = estimate('male', 89.96, 100);
  assert.equal(nearMale.ok, true);
  assert.equal(nearMale.primaryValue, '0.8996');
  assert.equal(nearMale.category?.label, 'Below reference cutoff');
  const nearFemale = estimate('female', 84.96, 100);
  assert.equal(nearFemale.primaryValue, '0.8496');
  assert.equal(nearFemale.category?.label, 'Below reference cutoff');
  assert.match(nearMale.note ?? '', /unrounded ratio/);
});

test('the WHO consultation is not misrepresented as a three-tier clinical score', () => {
  for (const sex of ['male', 'female'] as const) {
    for (const waist of [60, 89, 95, 120, 180]) {
      const result = estimate(sex, waist, 100);
      assert.equal(result.ok, true);
      assert.ok(['Below reference cutoff', 'At/above reference cutoff'].includes(result.category?.label ?? ''));
      assert.equal(result.visual.kind, 'gauge');
      if (result.visual.kind === 'gauge') assert.equal(result.visual.segments.length, 2);
    }
  }
});

test('high and low within-field inputs remain visible rather than clipped at 1.1', () => {
  const above = estimate('male', 200, 50);
  assert.equal(above.ok, true);
  assert.equal(above.primaryValue, '4');
  assert.equal(above.visual.kind, 'gauge');
  if (above.visual.kind === 'gauge') {
    assert.ok(above.visual.max >= above.visual.value);
    assert.equal(above.visual.segments.at(-1)?.upTo, above.visual.max);
  }
  const below = estimate('female', 40, 200);
  assert.equal(below.ok, true);
  assert.equal(below.primaryValue, '0.2');
  assert.equal(below.visual.kind, 'gauge');
  if (below.visual.kind === 'gauge') {
    assert.ok(below.visual.value >= below.visual.min);
    assert.equal(below.visual.min, 0);
  }
});

test('missing, zero, negative and nonfinite dimensions fail without category', () => {
  const cases: Array<[number, number]> = [
    [0, 100], [-1, 100], [85, 0], [85, -1],
    [NaN, 100], [100, NaN], [Infinity, 100], [90, -Infinity],
  ];
  for (const [waist, hip] of cases) {
    const result = estimate('male', waist, hip);
    assert.equal(result.ok, false, String(waist) + '/' + String(hip));
    assert.equal(result.visual.kind, 'none');
    assert.equal(result.category, undefined);
    assert.equal(result.primaryValue, '—');
  }
  assert.equal(whr.compute({ vals: { waist: 90 }, units: 'metric', sex: 'female', selects: {} }).ok, false);
});

test('three-decimal imperial units preserve WHO threshold after cm conversion', () => {
  for (const [sex, waistCm, hipCm] of [
    ['male', 89.6, 100],
    ['male', 90, 100],
    ['female', 84.6, 100],
    ['female', 85, 100],
    ['female', 97.5, 107.2],
  ] as const) {
    const metric = estimate(sex, waistCm, hipCm);
    const waistBack = round(inToCm(round(cmToIn(waistCm), 3)), 2);
    const hipBack = round(inToCm(round(cmToIn(hipCm), 3)), 2);
    const imperial = estimate(sex, waistBack, hipBack, 'imperial');
    assert.equal(imperial.ok, true);
    assert.equal(metric.category?.label, imperial.category?.label, sex + '/' + waistCm);
    assert.ok(Math.abs(waistBack - waistCm) <= 0.02);
    assert.ok(Math.abs(hipBack - hipCm) <= 0.02);
  }
});

test('WHR measurement instructions follow midpoint rib/hip and widest buttocks', () => {
  assert.equal(whr.hasSex, true);
  assert.deepEqual(whr.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['waist', 'length', 40, 200], ['hip', 'length', 50, 200],
  ]);
  assert.match(whr.fields[0].help ?? '', /halfway between the bottom of the last palpable rib and the top of the hip bone/);
  assert.match(whr.fields[1].help ?? '', /widest part of the buttocks/);
});

test('WHR-only two-decimal inputs preserve earlier WHtR and Boer precision', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /def.slug === 'waist-to-hip-ratio-calculator' \? 3 : def.slug === 'waist-to-height-ratio-calculator' \? 2 : 1/);
  assert.match(ui, /def.slug === 'waist-to-hip-ratio-calculator' \? 2 : def.slug === 'waist-to-height-ratio-calculator' \? 2 : 1/);
  assert.match(ui, /units === 'imperial'\s*\? '0.001'/);
  assert.match(ui, /slug === 'waist-to-hip-ratio-calculator'/);
  assert.match(ui, /const preciseHeight/);
});
