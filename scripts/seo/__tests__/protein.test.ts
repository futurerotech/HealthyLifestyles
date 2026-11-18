import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const protein = DEFS['protein-intake-calculator'];
const calculate = (weight: number, goal = '1.6', units: ComputeCtx['units'] = 'metric') =>
  protein.compute({ vals: { weight }, selects: { goal }, sex: 'female', units });

test('original five g/kg coefficients are preserved with accurately labeled options', () => {
  const goal = protein.fields.find(field => field.key === 'goal');
  assert.deepEqual(goal?.options?.map(option => option.value), ['0.8', '1.2', '1.6', '2.0', '2.2']);
  assert.equal(goal?.selectDefault, '1.6');
  assert.doesNotMatch(goal?.options?.at(-1)?.label ?? '', /^Maximum/i);
  assert.match(goal?.options?.at(-1)?.label ?? '', /not a maximum/);
  assert.equal(protein.hasSex, false);
});

test('all five original coefficients produce correct daily protein, four-way split and energy', () => {
  for (const [goal, grams, meal, kcal] of [
    ['0.8', '56', '14', '224'], ['1.2', '84', '21', '336'],
    ['1.6', '112', '28', '448'], ['2.0', '140', '35', '560'],
    ['2.2', '154', '39', '616'],
  ]) {
    const r = calculate(70, goal);
    assert.equal(r.ok, true, goal);
    assert.equal(r.primaryValue, grams + ' g/day', goal);
    assert.equal(r.rows?.[0].value, Number(goal).toFixed(1) + ' g per kg body weight', goal);
    assert.equal(r.rows?.[1].value, meal + ' g/meal (example)', goal);
    assert.equal(r.rows?.[2].value, kcal + ' kcal/day (4 kcal/g)', goal);
  }
});

test('default 72-kg example uses raw 115.2 g before round-off in energy and meals', () => {
  const r = calculate(72);
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '115 g/day');
  assert.equal(r.rows?.[1].value, '29 g/meal (example)');
  assert.equal(r.rows?.[2].value, '461 kcal/day (4 kcal/g)');
  assert.equal(r.visual.kind, 'none');
});

test('invalid, missing, partial and unsupported goal strings fail closed instead of using 1.6', () => {
  for (const goal of ['', '1.6junk', '1.60', '2.2 extra', '0', '3.0', 'Infinity', 'NaN']) {
    const r = calculate(70, goal);
    assert.equal(r.ok, false, goal);
    assert.equal(r.primaryValue, '—');
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.rows, undefined);
    assert.match(r.error ?? '', /listed protein examples/);
  }
  const r = protein.compute({ vals: { weight: 70 }, selects: {}, sex: 'female', units: 'metric' });
  assert.equal(r.ok, false);
});

test('weight missing, nonfinite, nonpositive and outside original 25–300 kg bounds fails', () => {
  for (const weight of [undefined, NaN, Infinity, -Infinity, -1, 0, 24.999, 300.001]) {
    const r = protein.compute({ vals: { weight: weight as number }, selects: { goal: '1.6' },
      sex: 'male', units: 'metric' });
    assert.equal(r.ok, false, String(weight));
    assert.equal(r.primaryValue, '—');
    assert.equal(r.rows, undefined);
    assert.match(r.error ?? '', /25 and 300 kg/);
  }
  assert.equal(calculate(25, '0.8').primaryValue, '20 g/day');
  assert.equal(calculate(300, '2.2').primaryValue, '660 g/day');
});

test('calculator rejects unsupported unit systems without showing advice', () => {
  const r = calculate(70, '1.6', 'stone' as ComputeCtx['units']);
  assert.equal(r.ok, false);
  assert.match(r.error ?? '', /supported unit/);
});

test('kilogram to pound display uses the project exact conversion constant', () => {
  assert.equal(lbToKg(kgToLb(70)), 70);
  for (const kg of [25, 70, 72, 80, 150, 300]) {
    const poundsDisplayed = round(kgToLb(kg), 3);
    const metricForProteinCompute = round(lbToKg(poundsDisplayed), 2);
    assert.equal(metricForProteinCompute, kg, 'roundtrip ' + kg);
    for (const goal of ['0.8', '1.6', '2.2']) {
      const before = calculate(kg, goal);
      const after = calculate(metricForProteinCompute, goal, 'imperial');
      assert.deepEqual([after.ok, after.primaryValue, after.rows?.[2].value],
        [before.ok, before.primaryValue, before.rows?.[2].value], String(kg) + '/' + goal);
    }
  }
});

test('weight precision and kg normalization are scoped to protein, other tools unaffected', () => {
  const island = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(island, /const preciseWeight =[\s\S]*?def.slug === 'protein-intake-calculator';/);
  assert.match(island, /def.slug === 'protein-intake-calculator'[\s\S]*?round\(lbToKg\(num\(disp\[f.key\]\)\), 2\)/);
  assert.match(island, /preciseWeight\(def\) \? 3 : 1/);
  assert.ok(DEFS['macro-calculator'].compute);
});

test('medical interpretation distinguishes RDA, guidelines, training and kidney exceptions', () => {
  const r = calculate(70, '2.2');
  assert.equal(r.ok, true);
  assert.match(r.note ?? '', /2025–2030 Dietary Guidelines/);
  assert.match(r.note ?? '', /not a maximum or a guarantee/);
  assert.match(r.callout?.text ?? '', /Kidney disease/);
  assert.match(r.rows?.[1].label ?? '', /If divided evenly/);
  const content = readFileSync(new URL('../../../src/data/nutrition-content.ts', import.meta.url), 'utf8');
  const start = content.indexOf("'protein-intake-calculator': {");
  const end = content.indexOf("'water-intake-calculator': {", start);
  assert.ok(start > 0 && end > start);
  const section = content.slice(start, end);
  assert.match(section, /KDIGO 2024/);
  assert.match(section, /1.2–1.6 g\/kg\/day/);
  assert.match(section, /not a defined tolerable upper limit/);
  assert.match(section, /pregnant or breastfeeding/);
  assert.match(section, /0.45359237/);
  assert.doesNotMatch(section, /maximises muscle protein synthesis/);
  assert.match(section, /https:\/\/pmc.ncbi.nlm.nih.gov\/articles\/PMC5477153\//);
});
