import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Invoke the REAL calculator's pure compute body without rebuilding the site or
// duplicating its arithmetic in a test-only replacement implementation.
const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const content = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const anchor = "  'one-rep-max-calculator': {";
const start = defs.indexOf(anchor);
assert.notEqual(start, -1, 'real One-Rep Max calculator is present');
const end = defs.indexOf('\n  },', start);
assert.ok(end > start, 'One-Rep Max calculator block is complete');
const block = defs.slice(start, end);
const fStart = block.indexOf('({ vals, units }) => {');
const fEnd = block.lastIndexOf('\n    },');
assert.ok(fStart >= 0 && fEnd > fStart, 'real compute function can be extracted');
const computeSource = block.slice(fStart, fEnd) + '\n}';
const fmtMass = (kg, units, digits = 1) => {
  const display = units === 'metric' ? kg : kg * 2.20462262185;
  // Mirror src/lib/units.ts: the public UI trims trailing zeros.
  const formatted = Number(display.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits });
  return formatted + (units === 'metric' ? ' kg' : ' lb');
};
const compute = runInNewContext('(' + computeSource + ')', { fmtMass, Math });

test('one completed rep records its actual lifted weight, not 103.33% Epley', () => {
  const result = compute({ vals: { weight: 80, reps: 1 }, units: 'metric' });
  assert.equal(result.primaryLabel, 'Weight lifted for one rep');
  assert.equal(result.primaryValue, '80 kg');
  assert.equal(result.rows[0].value, '80 kg');
  assert.equal(result.rows[1].value, '80 kg');
  assert.match(result.rows[1].label, /100% of recorded one-rep load/);
  assert.match(result.note, /not proof of your true maximum/i);
});

test('unchanged Epley and Brzycki estimates for multiple reps, percentages and pounds', () => {
  const five = compute({ vals: { weight: 80, reps: 5 }, units: 'metric' });
  assert.equal(five.primaryValue, '93.3 kg');
  assert.equal(five.rows[0].value, '90 kg');
  assert.equal(five.rows[1].label, '100% of 1RM');
  assert.equal(five.rows[1].value, five.primaryValue);
  const ten = compute({ vals: { weight: 80, reps: 10 }, units: 'metric' });
  assert.equal(ten.primaryValue, '106.7 kg');
  assert.equal(ten.rows[0].value, '106.7 kg');
  const pounds = compute({ vals: { weight: 80, reps: 1 }, units: 'imperial' });
  assert.equal(pounds.primaryValue, '176.4 lb');
  assert.equal(pounds.rows[1].value, '176.4 lb');
});

test('public tool explanation distinguishes single completed lift from multi-rep predictions', () => {
  const start = content.indexOf("'one-rep-max-calculator': {");
  assert.ok(start >= 0);
  const section = content.slice(start, content.indexOf("\n  },", start));
  assert.match(section, /For sets of 2 or more repetitions/);
  assert.match(section, /For exactly one completed repetition/);
  assert.match(section, /not necessarily your true maximum/);
});
