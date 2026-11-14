import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Runs the exact production compute closures with the production unit helpers.
const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const unitsSrc = readFileSync(new URL('../../../src/lib/units.ts', import.meta.url), 'utf8');
const ux = { exports: {}, Number, Math, String };
runInNewContext(
  ts.transpileModule(unitsSrc, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  ux,
);
const { fmt, kgToLb, massUnitLabel } = ux.exports;

const loadCompute = (startMarker, endMarker) => {
  const start = defs.indexOf(startMarker);
  const end = defs.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker} must exist`);
  const block = defs.slice(start, end);
  const cs = block.indexOf('    compute: ');
  const ce = block.lastIndexOf('\n    },');
  assert.ok(cs >= 0 && ce > cs, 'compute function found');
  const code = ts.transpileModule(`const compute = ${block.slice(cs + '    compute: '.length, ce)}\n};`, {
    compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const F = { height: () => ({}) };
  return runInNewContext(`${code}\ncompute;`, { fmt, kgToLb, massUnitLabel, Number, Math, parseFloat, F });
};

const water = loadCompute("  'water-intake-calculator': {", '  // ---- Calorie Deficit ----');
const preg = loadCompute("  'pregnancy-weight-gain-calculator': {", '  // Fitness');
const row = (r, label) => r.rows?.find((x) => x.label.startsWith(label))?.value;
const litres = (r) => parseFloat(r.primaryValue);

test('water: typical adult result is unchanged (70 kg, moderate → 2.45 L + 0.5 L)', () => {
  const r = water({ vals: { weight: 70 }, selects: { activity: '500' } });
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '3 L/day'); // 2.95 → 3.0, trailing zero trimmed
  assert.equal(row(r, 'Baseline (35 ml/kg)'), '2.5 L');
  assert.equal(row(r, 'Of which from drinks'), '2.5 L · 83 oz'); // 0.8 × 2.45 L + 0.5 L activity
  assert.equal(r.callout, undefined);
});

test('water: the formula scales up to 100 kg and is held, not extrapolated, above it', () => {
  const at = (weight, activity = '0') => water({ vals: { weight }, selects: { activity } });
  assert.equal(at(100).primaryValue, '3.5 L/day');
  assert.equal(at(100).callout, undefined);
  for (const weight of [101, 150, 200, 300]) {
    const r = at(weight);
    assert.equal(r.primaryValue, '3.5 L/day', `${weight} kg`);
    assert.equal(row(r, 'Baseline (35 ml/kg, held at 100 kg)'), '3.5 L');
  }
  assert.equal(at(300, '1500').primaryValue, '5 L/day'); // previously 12 L/day
});

test('water: output still responds to inputs below the limit and to activity', () => {
  const a = water({ vals: { weight: 60 }, selects: { activity: '0' } });
  const b = water({ vals: { weight: 90 }, selects: { activity: '0' } });
  const c = water({ vals: { weight: 90 }, selects: { activity: '1000' } });
  assert.ok(litres(a) < litres(b) && litres(b) < litres(c));
});

test('water: the held value is never presented as a maximum or as the 3.7 L reference', () => {
  const r = water({ vals: { weight: 150 }, selects: { activity: '0' } });
  assert.match(r.callout.text, /site choice, not a clinically validated threshold, and not a maximum/);
  assert.match(r.callout.text, /may be higher or lower/);
  assert.doesNotMatch(r.callout.text, /3\.7/);
  assert.doesNotMatch(JSON.stringify(r), /capped at 3\.7/);
});

test('water: reference intakes are shown as total water (drinks + food), not as limits', () => {
  const r = water({ vals: { weight: 70 }, selects: { activity: '0' } });
  assert.equal(row(r, 'U.S. reference intake, total water'), '3.7 L men · 2.7 L women');
  assert.match(r.note, /adequate intakes .* counted from drinks and food together/);
  assert.match(r.note, /not maximums/);
  assert.match(r.note, /can need considerably more/);
  assert.match(r.note, /heart, kidney or liver condition/);
  assert.match(r.note, /very large amounts quickly can be dangerous/);
  assert.equal(r.primaryLabel, 'Estimated total daily fluid (drinks + food)');
});

// [height cm, pre-pregnancy kg, IOM total lb low/high, IOM total kg low/high]
const CATS = [
  [165, 48, 28, 40, 12.5, 18], // underweight
  [165, 60, 25, 35, 11.5, 16], // normal
  [165, 75, 15, 25, 7, 11.5], // overweight
  [165, 90, 11, 20, 5, 9], // obesity
];
const range = (r) => row(r, 'Estimated range by week').split(' ')[0].split('–').map(Number);
const run = (height, weight, week, gainKg, units) => preg({ vals: { height, weight, week, current: weight + gainKg }, units });

test('water: totals and drinks-only share stay internally consistent for every input', () => {
  for (const weight of [40, 70, 100, 150]) {
    for (const activity of ['0', '500', '1000', '1500']) {
      const r = water({ vals: { weight }, selects: { activity } });
      const total = litres(r);
      const base = parseFloat(row(r, 'Baseline'));
      const drinks = parseFloat(row(r, 'Of which from drinks'));
      const extra = Number(activity) / 1000;
      assert.ok(Math.abs(total - (base + extra)) <= 0.1, `total ${weight}/${activity}`);
      assert.ok(Math.abs(drinks - (0.8 * Math.min(weight, 100) * 0.035 + extra)) <= 0.051, `drinks ${weight}/${activity}`);
      assert.ok(drinks < total && drinks >= extra);
    }
  }
});

test('water: the 100 kg cut-off is never described as clinically validated', () => {
  const src = defs.slice(defs.indexOf("  'water-intake-calculator': {"), defs.indexOf('  // ---- Calorie Deficit ----'));
  assert.match(src, /NOT a clinically validated threshold/);
  const content = readFileSync(new URL('../../../src/data/nutrition-content.ts', import.meta.url), 'utf8');
  assert.match(content, /site design choice, not a clinically validated threshold/);
  assert.doesNotMatch(src + content, /not reliable at higher body weights/);
});

test('pregnancy: totals are the published IOM values in both unit systems', () => {
  for (const [h, w, loLb, hiLb, loKg, hiKg] of CATS) {
    assert.equal(run(h, w, 20, 5, 'imperial').primaryValue, `${loLb}–${hiLb} lb`);
    assert.equal(run(h, w, 20, 5, 'metric').primaryValue, `${loKg}–${hiKg} kg`); // was rounded to 11–16 kg etc.
  }
});

test('pregnancy: BMI category boundaries follow the IOM cut-offs', () => {
  const cat = (bmi) => preg({ vals: { height: 100, weight: bmi, week: 20, current: bmi }, units: 'metric' }).category.label;
  assert.equal(cat(18.4), 'Underweight');
  assert.equal(cat(18.5), 'Normal weight');
  assert.equal(cat(24.9), 'Normal weight');
  assert.equal(cat(25), 'Overweight');
  assert.equal(cat(29.9), 'Overweight');
  assert.equal(cat(30), 'Obesity');
});

test('pregnancy: by-week range never exceeds the IOM total at any week, in either unit system', () => {
  for (const [h, w, loLb, hiLb, loKg, hiKg] of CATS) {
    for (let week = 1; week <= 42; week++) {
      const [iLo, iHi] = range(run(h, w, week, 5, 'imperial'));
      const [mLo, mHi] = range(run(h, w, week, 5, 'metric'));
      assert.ok(iLo <= loLb && iHi <= hiLb && iLo <= iHi, `lb week ${week}: ${iLo}-${iHi}`);
      assert.ok(mLo <= loKg && mHi <= hiKg && mLo <= mHi, `kg week ${week}: ${mLo}-${mHi}`);
    }
  }
});

test('pregnancy: the previously overshooting cases are held at the total', () => {
  // Obesity group at week 40 was 11.9–20.6 lb against a 20 lb total; underweight week 42 was 30.1–42.1 against 40.
  assert.deepEqual(range(run(165, 90, 40, 5, 'imperial')), [11, 20]);
  assert.deepEqual(range(run(165, 48, 42, 12, 'imperial')), [28, 40]);
});

test('pregnancy: by-week arithmetic uses the IOM first-trimester assumption and weekly rates', () => {
  assert.deepEqual(range(run(165, 60, 20, 6, 'imperial')), [6.7, 11.4]); // 1.1 + 0.8×7, 4.4 + 1.0×7
  assert.deepEqual(range(run(165, 60, 20, 3, 'metric')), [3, 5.5]); // 0.5 + 0.35×7 = 2.95, 2 + 0.5×7
  assert.deepEqual(range(run(165, 60, 13, 1, 'metric')), [0.5, 2]); // end of first trimester
});

test('pregnancy: weight loss, low and high gain each get the right message', () => {
  assert.match(run(165, 60, 24, -2, 'metric').callout.text, /below your pre-pregnancy weight/);
  assert.match(run(165, 60, 30, 2, 'metric').callout.text, /tracking below/);
  assert.match(run(165, 60, 20, 12, 'metric').callout.text, /tracking above/);
  assert.equal(run(165, 60, 20, 4, 'metric').callout, undefined);
});

test('pregnancy: limitations are stated — singleton only, estimate not target, confirm with OB-GYN', () => {
  const r = run(165, 60, 20, 4, 'metric');
  assert.match(r.note, /single baby/);
  assert.match(r.note, /do not apply to twins or other multiples/);
  assert.match(r.note, /our estimate/);
  assert.match(r.note, /confirm your targets with your OB-GYN/);
});

test('search metadata matches the corrected results (no "target" for water or the by-week range)', () => {
  const nutrition = readFileSync(new URL('../../../src/data/nutrition-content.ts', import.meta.url), 'utf8');
  const womens = readFileSync(new URL('../../../src/data/womens-content.ts', import.meta.url), 'utf8');
  const meta = (src, slug) => {
    const i = src.indexOf(`'${slug}': {`);
    return src.slice(i, src.indexOf('sections:', i)).match(/metaDescription:\s*'([^']*)'/)[1];
  };
  const water = meta(nutrition, 'water-intake-calculator');
  assert.match(water, /total daily fluid/);
  assert.match(water, /not a target or limit/);
  assert.ok(water.length <= 160, water.length);
  const preg = meta(womens, 'pregnancy-weight-gain-calculator');
  assert.match(preg, /estimated range for your current week/);
  assert.match(preg, /single baby/);
  assert.doesNotMatch(preg, /healthy target/);
  assert.ok(preg.length <= 160, preg.length);
});
