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
  assert.equal(r.callout, undefined);
});

test('water: baseline never exceeds 3.7 L and total never exceeds 5.2 L', () => {
  for (const weight of [25, 60, 105, 106, 150, 200, 300]) {
    for (const activity of ['0', '500', '1000', '1500']) {
      const r = water({ vals: { weight }, selects: { activity } });
      assert.ok(litres(r) <= 5.2, `${weight} kg / ${activity} gave ${r.primaryValue}`);
    }
  }
  const heavy = water({ vals: { weight: 300 }, selects: { activity: '1500' } });
  assert.equal(heavy.primaryValue, '5.2 L/day'); // previously 12 L/day
  assert.equal(row(heavy, 'Baseline (35 ml/kg, capped)'), '3.7 L');
  assert.match(heavy.callout.text, /capped at 3\.7 L\/day/);
});

test('water: output still responds to inputs below the cap and to activity', () => {
  const a = water({ vals: { weight: 60 }, selects: { activity: '0' } });
  const b = water({ vals: { weight: 90 }, selects: { activity: '0' } });
  const c = water({ vals: { weight: 90 }, selects: { activity: '1000' } });
  assert.ok(litres(a) < litres(b) && litres(b) < litres(c));
});

test('water: fluid-restriction and rapid-intake safety language is always shown', () => {
  const r = water({ vals: { weight: 70 }, selects: { activity: '0' } });
  assert.match(r.note, /heart, kidney or liver condition/);
  assert.match(r.note, /very large amounts quickly can be dangerous/);
  assert.equal(r.primaryLabel, 'Estimated daily fluid target');
});

// [height cm, pre-pregnancy kg] → BMI category, IOM total range in lb.
const CATS = [
  [165, 48, 28, 40], // underweight
  [165, 60, 25, 35], // normal
  [165, 75, 15, 25], // overweight
  [165, 90, 11, 20], // obese
];
const range = (r) => row(r, 'Recommended by week').split(' ')[0].split('–').map(Number);

test('pregnancy: by-week target never exceeds the IOM total range at any week', () => {
  for (const [height, weight, lo, hi] of CATS) {
    for (let week = 1; week <= 42; week++) {
      const r = preg({ vals: { height, weight, week, current: weight + 5 }, units: 'imperial' });
      const [byLo, byHi] = range(r);
      assert.ok(byLo <= lo && byHi <= hi, `BMI group ${lo}-${hi} week ${week}: ${byLo}-${byHi}`);
      assert.ok(byLo <= byHi);
    }
  }
});

test('pregnancy: the previously overshooting cases are now capped at the total', () => {
  // Obese group at week 40 was 11.9–20.6 lb against a 20 lb total; underweight week 42 was 30.1–42.1 against 40.
  assert.deepEqual(range(preg({ vals: { height: 165, weight: 90, week: 40, current: 95 }, units: 'imperial' })), [11, 20]);
  assert.deepEqual(range(preg({ vals: { height: 165, weight: 48, week: 42, current: 60 }, units: 'imperial' })), [28, 40]);
});

test('pregnancy: mid-pregnancy targets and IOM totals are unchanged', () => {
  const r = preg({ vals: { height: 165, weight: 60, week: 20, current: 66 }, units: 'imperial' });
  assert.equal(r.primaryValue, '25–35 lb');
  assert.deepEqual(range(r), [6.7, 11.4]); // 1.1 + 0.8×7, 4.4 + 1.0×7
  const m = preg({ vals: { height: 165, weight: 60, week: 20, current: 66 }, units: 'metric' });
  assert.equal(m.primaryValue, '11–16 kg');
});
