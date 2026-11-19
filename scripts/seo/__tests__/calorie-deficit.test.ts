import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const def = DEFS['calorie-deficit-calculator'];
const evaluate = (maintenance: number, amount: number, weeks: number,
  units: ComputeCtx['units'] = 'metric', sex: ComputeCtx['sex'] = 'male') =>
  def.compute({ vals: { maintenance, amount, weeks }, units, sex, selects: {} });

test('retains the original maintenance, change and week domains but removes irrelevant sex choice', () => {
  assert.deepEqual(def.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['maintenance', 'number', 1000, 6000],
    ['amount', 'mass', 0.5, 100],
    ['weeks', 'number', 1, 104],
  ]);
  assert.equal(def.hasSex, false);
  const a = evaluate(2200, 5, 10, 'metric', 'male');
  const b = evaluate(2200, 5, 10, 'metric', 'female');
  assert.deepEqual(a, b);
});

test('preserves exact historical 3500 kcal/lb arithmetic for a 5kg/10week example', () => {
  const r = evaluate(2200, 5, 10);
  const energy = kgToLb(5) * 3500;
  assert.equal(r.ok, true);
  assert.equal(r.primaryLabel, 'Static daily energy-gap illustration');
  assert.equal(r.primaryValue, '551 kcal/day (not a target)');
  assert.equal(r.rows?.[0].value, '38,581 kcal total');
  assert.equal(r.rows?.[1].value, '2,200 kcal/day');
  assert.equal(r.rows?.[2].value, '1,649 kcal/day');
  assert.equal(r.rows?.[3].value, '10 weeks (70 days)');
  assert.equal(Math.round(energy / 70), 551);
  assert.equal(r.visual.kind, 'none');
  assert.match(r.callout?.text ?? '', /not a predicted rate of weight loss/);
});

test('exact ten pounds divided over ten weeks is 500 kcal/day STATIC example', () => {
  const tenPoundsKg = lbToKg(10);
  const r = evaluate(2200, tenPoundsKg, 10);
  assert.equal(kgToLb(tenPoundsKg), 10);
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '500 kcal/day (not a target)');
  assert.equal(r.rows?.[0].value, '35,000 kcal total');
  assert.equal(r.rows?.[2].value, '1,700 kcal/day');
});

test('missing and nonfinite maintenance never produce numeric calorie guidance', () => {
  for (const maintenance of [undefined, NaN, Infinity, -Infinity, -1, 0, 999, 6001, 2200.5]) {
    const r = evaluate(maintenance as number, 5, 10);
    assert.equal(r.ok, false, String(maintenance));
    assert.equal(r.primaryValue, '—');
    assert.equal(r.rows, undefined);
    assert.equal(r.visual.kind, 'none');
  }
  assert.equal(evaluate(1000, 0.5, 104).ok, false); // low-energy guard, not a validity error
  assert.equal(evaluate(6000, 0.5, 104).ok, true);
});

test('hypothetical mass rejects missing, zero, negative, nonfinite and out-of-range', () => {
  for (const amount of [undefined, NaN, Infinity, -Infinity, -1, 0, 0.49, 100.01]) {
    const r = evaluate(2200, amount as number, 10);
    assert.equal(r.ok, false, String(amount));
    assert.match(r.error ?? '', /between 0.5 and 100 kg/);
    assert.equal(r.rows, undefined);
  }
  assert.equal(evaluate(2200, 0.5, 10).ok, true);
  assert.equal(evaluate(6000, 100, 104).ok, true);
});

test('week input requires whole 1–104, finite weeks', () => {
  for (const weeks of [undefined, NaN, Infinity, -Infinity, -1, 0, 0.9, 1.5, 104.1, 105]) {
    const r = evaluate(2200, 5, weeks as number);
    assert.equal(r.ok, false, String(weeks));
    assert.match(r.error ?? '', /whole-number example timeframe of 1–104 weeks/);
  }
  assert.equal(evaluate(2200, 0.5, 1).ok, true);
  assert.equal(evaluate(2200, 0.5, 104).ok, true);
});

test('unsupported units fail closed even though all computations use kg', () => {
  const r = evaluate(2200, 5, 10, 'stone' as ComputeCtx['units']);
  assert.equal(r.ok, false);
  assert.match(r.error ?? '', /metric or imperial/);
});

test('model remainder under 1000 or negative never becomes a false 0-kcal food goal', () => {
  for (const [maintenance,amount,weeks] of [
    [1000,0.5,104], [1200,5,10], [1000,100,1], [2200,100,1],
    [1499,lbToKg(2),2],
  ]) {
    const r = evaluate(maintenance,amount,weeks);
    assert.equal(r.ok, false, maintenance + '/' + amount + '/' + weeks);
    assert.equal(r.primaryValue, '—');
    assert.equal(r.rows, undefined);
    assert.equal(r.callout, undefined);
    assert.match(r.error ?? '', /No intake or deficit number is shown/);
    assert.match(r.error ?? '', /NOT a universally safe intake/);
  }
});

test('exact 1000 display boundary is not a universal safe intake assertion', () => {
  const r = evaluate(1500, lbToKg(2), 2);
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '500 kcal/day (not a target)');
  assert.equal(r.rows?.[2].value, '1,000 kcal/day');
  assert.match(r.note ?? '', /NOT an assurance that values above it are appropriate/);
  assert.equal(evaluate(1499, lbToKg(2), 2).ok, false);
  assert.equal(evaluate(1600, lbToKg(2), 2).ok, true);
});

test('high hypothetical static gap warns without promising a pace or safety', () => {
  const r = evaluate(6000, 20, 5);
  assert.equal(r.ok, true);
  assert.equal(r.callout?.tone, 'warn');
  assert.match(r.callout?.text ?? '', /cannot predict weight loss/);
  assert.doesNotMatch(r.callout?.text ?? '', /safe pace is/);
  assert.match(r.primaryValue, /not a target/);
  assert.match(r.note ?? '', /does not determine the daily deficit needed/);
});

test('all eligible kg/lb toggles preserve examples including 0.5kg and 100kg bounds', () => {
  for (const weight of [0.5, 1, 4.54, 5, 10, 25, 99.99, 100]) {
    const lb = round(kgToLb(weight), 3);
    const kg = round(lbToKg(lb), 2);
    assert.equal(kg, weight, 'roundtrip ' + weight);
    const m = evaluate(6000,weight,104,'metric');
    const i = evaluate(6000,kg,104,'imperial');
    assert.equal(m.ok, true);
    assert.equal(i.ok, true);
    assert.deepEqual(i, m);
  }
});

test('precision change is isolated and prior calculator precision conditions survive', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(ui, /def.slug === 'water-intake-calculator' \|\| def.slug === 'calorie-deficit-calculator'/);
  assert.match(ui, /def.slug === 'calorie-deficit-calculator'\)\s*\/\/ These calculators/);
  assert.match(ui, /preciseWeight\(def\) \? 3 : 1/);
  assert.ok(DEFS['water-intake-calculator']);
  assert.ok(DEFS['calorie-calculator']);
  assert.ok(DEFS['macro-calculator']);
});

test('medical copy and catalog reject universal 1200/1500 floors and predicted timelines', () => {
  const src = readFileSync(new URL('../../../src/data/nutrition-content.ts', import.meta.url), 'utf8');
  const a = src.indexOf("'calorie-deficit-calculator': {");
  const b = src.indexOf("'keto-calculator': {", a);
  assert.ok(a>0 && b>a);
  const content = src.slice(a,b);
  assert.match(content,/historical 3,500-kcal-per-pound/);
  assert.match(content,/NOT one-size-fits-all safe minimums/);
  assert.match(content,/pregnancy, breastfeeding/i);
  assert.match(content,/NIDDK Body Weight Planner/);
  assert.match(content,/https:\/\/pmc.ncbi.nlm.nih.gov\/articles\/PMC3859816\//);
  assert.match(content,/https:\/\/pmc.ncbi.nlm.nih.gov\/articles\/PMC5819889\//);
  assert.doesNotMatch(content,/your timeframe is too short/);
  const catalog = readFileSync(new URL('../../../src/data/tools.ts', import.meta.url), 'utf8');
  assert.match(catalog,/Explore the static 3,500-kcal\/lb energy-equivalent example/);
});
