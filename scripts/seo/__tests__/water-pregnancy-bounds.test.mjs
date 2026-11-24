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

// Pregnancy weight-gain cases were superseded by the accepted ID37 rework;
// see pregnancy-weight-gain-safety.test.ts and pregnancy-inputs.test.ts.
