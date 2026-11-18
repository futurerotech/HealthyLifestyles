import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

// Reuses and expands the independent water-specific acceptance cases of PR #54.
// No pregnancy logic or separate dependencies are copied.
const water = DEFS['water-intake-calculator'];
const calculate = (weight: number, activity = '500', units: ComputeCtx['units'] = 'metric') =>
  water.compute({ vals: { weight }, selects: { activity }, sex: 'male', units });
const row = (r: ReturnType<typeof calculate>, label: string) =>
  r.rows?.find(item => item.label.startsWith(label))?.value;

test('preserves the 35 mL/kg arithmetic and 70-kg +500-mL PR #54 example', () => {
  const r = calculate(70);
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '3 L/day'); // 2.95 L rounded to one decimal
  assert.equal(row(r, 'Formula baseline'), '2.45 L');
  assert.equal(row(r, 'Illustrative activity addition'), '+0.5 L (not measured sweat loss)');
  assert.equal(row(r, 'Total-water equivalent (US fluid ounces)'), '100 US fl oz');
  assert.equal(row(r, 'Total-water equivalent (8-US-fl-oz cups)'), '12 cups');
  assert.equal(row(r, 'If about 80% comes from drinks'), '2.36 L · 80 US fl oz');
  assert.equal(r.callout, undefined);
});

test('preserves all four original activity additions but labels them examples', () => {
  const opts = water.fields.find(f => f.key === 'activity');
  assert.deepEqual(opts?.options?.map(o => o.value), ['0', '500', '1000', '1500']);
  assert.equal(opts?.selectDefault, '500');
  for (const [option, result, addition] of [
    ['0', '2.5 L/day', '+0 L'],
    ['500', '3 L/day', '+0.5 L'],
    ['1000', '3.5 L/day', '+1 L'],
    ['1500', '4 L/day', '+1.5 L'],
  ]) {
    const r = calculate(70, option);
    assert.equal(r.ok, true, option);
    assert.equal(r.primaryValue, result, option);
    assert.ok(row(r, 'Illustrative activity addition')?.startsWith(addition), option);
  }
  assert.match(opts?.help ?? '', /not estimates of your sweat loss/);
});

test('ports PR #54 formula holding above 100 kg without claiming a maximum', () => {
  assert.equal(calculate(100, '0').primaryValue, '3.5 L/day');
  assert.equal(calculate(100, '0').callout, undefined);
  for (const weight of [101, 150, 200, 300]) {
    const r = calculate(weight, '0');
    assert.equal(r.ok, true, String(weight));
    assert.equal(r.primaryValue, '3.5 L/day');
    assert.equal(row(r, 'Formula baseline'), '3.5 L');
    assert.match(r.callout?.text ?? '', /formula display limit, NOT a maximum intake/);
    assert.match(r.callout?.text ?? '', /not a validated clinical cutoff/);
  }
  assert.equal(calculate(300, '1500').primaryValue, '5 L/day');
  assert.equal(calculate(90, '0').primaryValue, '3.2 L/day');
});

test('rejects nonfinite, absent, negative and out-of-range body weights', () => {
  const invalid = [undefined, NaN, Infinity, -Infinity, -3, 0, 24.999, 300.001];
  for (const weight of invalid) {
    const r = water.compute({
      vals: { weight: weight as number }, selects: { activity: '500' },
      sex: 'female', units: 'metric',
    });
    assert.equal(r.ok, false, String(weight));
    assert.equal(r.primaryValue, '—');
    assert.equal(r.rows, undefined);
    assert.equal(r.visual.kind, 'none');
    assert.match(r.error ?? '', /25 and 300 kg/);
  }
  assert.equal(calculate(25, '0').ok, true);
  assert.equal(calculate(300, '0').ok, true);
});

test('rejects missing, partial, unlisted, forged and extreme activity options', () => {
  for (const activity of ['', '500junk', '500.0', '05', '1', '-500', '250', 'Infinity', '100000000']) {
    const r = calculate(70, activity);
    assert.equal(r.ok, false, activity);
    assert.equal(r.rows, undefined);
    assert.equal(r.primaryValue, '—');
    assert.match(r.error ?? '', /listed activity examples/);
  }
  const missing = water.compute({
    vals: { weight: 70 }, selects: {}, sex: 'female', units: 'metric',
  });
  assert.equal(missing.ok, false);
});

test('rejects unsupported display unit system without a result', () => {
  const r = calculate(70, '500', 'stone' as ComputeCtx['units']);
  assert.equal(r.ok, false);
  assert.match(r.error ?? '', /metric or imperial/);
});

test('roundtrip kilograms, pounds and arithmetic preserve results and weight bounds', () => {
  for (const kg of [25, 70, 72, 80, 99.99, 100, 100.01, 150, 300]) {
    const displayedLb = round(kgToLb(kg), 3);
    const convertedKg = round(lbToKg(displayedLb), 2);
    assert.equal(convertedKg, kg, 'kg/lb/round-trip: ' + kg);
    for (const activity of ['0', '500', '1000', '1500']) {
      const metric = calculate(kg, activity);
      const imperial = calculate(convertedKg, activity, 'imperial');
      assert.equal(imperial.ok, true);
      assert.deepEqual([imperial.primaryValue, imperial.rows, imperial.callout],
        [metric.primaryValue, metric.rows, metric.callout], kg + '/' + activity);
    }
  }
});

test('uses US fluid ounce (not mass ounce) and total-water-equivalent conversions', () => {
  const r = calculate(100, '0');
  assert.equal(row(r, 'Total-water equivalent (US fluid ounces)'), '118 US fl oz');
  assert.equal(row(r, 'Total-water equivalent (8-US-fl-oz cups)'), '15 cups');
  assert.match(r.primaryLabel, /total water \(drinks \+ food\)/);
  assert.match(r.note ?? '', /Roughly 80% from drinks is a survey average/);
});

test('interpretation is medically qualified and never uses AI or 100 kg as an upper limit', () => {
  const r = calculate(70, '1000');
  assert.match(r.note ?? '', /adequate-intake references/);
  assert.match(r.note ?? '', /neither targets for everyone nor upper limits/);
  assert.match(r.note ?? '', /heart, kidney or liver disease/);
  assert.match(r.note ?? '', /hyponatremia/);
  assert.match(r.note ?? '', /pregnant or breastfeeding/);
  assert.match(r.note ?? '', /35 mL\/kg rule/);
  assert.equal(row(r, 'U.S. adult adequate-intake references'), '3.7 L men · 2.7 L women (food + drinks)');
});

test('only water precision is added; previous specialized calculators remain intact', () => {
  const src = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  assert.match(src, /def.slug === 'protein-intake-calculator' \|\|\s*def.slug === 'water-intake-calculator'/);
  assert.match(src, /round\(lbToKg\(num\(disp\[f.key\]\)\), 2\)/);
  assert.match(src, /preciseWeight\(def\) \? 3 : 1/);
  assert.ok(DEFS['macro-calculator']);
});

test('tool page accurately describes formula boundary, exercise uncertainty and sources', () => {
  const page = readFileSync(new URL('../../../src/data/nutrition-content.ts', import.meta.url), 'utf8');
  const a = page.indexOf("'water-intake-calculator': {");
  const b = page.indexOf("'calorie-deficit-calculator': {", a);
  assert.ok(a > 0 && b > a);
  const block = page.slice(a, b);
  assert.match(block, /2,450 \+ 500 = 2,950 mL/);
  assert.match(block, /NOT a medically validated body-weight threshold/);
  assert.match(block, /fluids? and food|beverages and food/);
  assert.match(block, /pregnancy, breastfeeding/);
  assert.match(block, /National Academies/);
  assert.match(block, /MedlinePlus/);
  assert.match(block, /https:\/\/www.nationalacademies.org\/read\/10925\/chapter\/2/);
  assert.match(block, /https:\/\/pmc.ncbi.nlm.nih.gov\/articles\/PMC5634236\//);
  assert.doesNotMatch(block, /This calculator personalises that/);
});
