import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Compile and execute the REAL Karvonen calculator's compute function. Never
// replace its production arithmetic with a duplicate test-only implementation.
const source = (path) => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');
const defs = source('src/islands/calculators/defs.ts');
const content = source('src/data/heart-content.ts');
const ui = source('src/islands/Calculator.tsx');
const anchor = "  'target-heart-rate-calculator': {";
const start = defs.indexOf(anchor);
assert.ok(start >= 0, 'Karvonen calculator exists');
const end = defs.indexOf('\n  },', start);
assert.ok(end > start, 'definition is complete');
const block = defs.slice(start, end);
const begin = block.indexOf('    compute: ');
const finish = block.lastIndexOf('\n    },');
assert.ok(begin >= 0 && finish > begin, 'real compute function found');
const arrow = block.slice(begin + '    compute: '.length, finish) + '\n}';
const js = ts.transpileModule('const compute = ' + arrow + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const compute = runInNewContext(js + '\ncompute;', { Math, Number, fmt: (n, dp) => Number(n.toFixed(dp)).toLocaleString('en-US') });
const run = (age, rest, formula = '220') => compute({ vals: { age, rest }, selects: { formula } });
const zone = (result, index) => result.visual.items[index].detail;

test('Karvonen default 220 minus age remains numerically exact at 30/65', () => {
  const result = run(30, 65);
  assert.equal(result.ok, true);
  assert.equal(result.primaryLabel, 'Estimated maximum heart rate');
  assert.equal(result.primaryValue, '190 bpm');
  assert.equal(result.rows[1].value, '125 bpm');
  assert.equal(zone(result, 0), '50–60% · 128–140 bpm');
  assert.equal(zone(result, 4), '90–100% · 178–190 bpm');
  assert.match(result.note, /not measured physiological thresholds/i);
  assert.match(result.note, /call emergency services immediately/i);
});

test('Tanaka alternative gives 187 bpm maximum and intended five ranges', () => {
  const result = run(30, 65, 'tanaka');
  assert.equal(result.ok, true);
  assert.equal(result.primaryValue, '187 bpm');
  assert.equal(result.rows[1].value, '122 bpm');
  assert.equal(zone(result, 0), '50–60% · 126–138 bpm');
  assert.equal(zone(result, 4), '90–100% · 175–187 bpm');
  assert.equal(result.rows[2].value, 'Tanaka (208 − 0.7 × age)');
});

test('zero or sub-10 bpm reserve is explicitly rejected rather than fabricating five identical zones', () => {
  const zero = run(100, 120);
  assert.equal(zero.ok, false);
  assert.equal(zero.visual.kind, 'none');
  assert.match(zero.error, /resting pulse must be lower than the estimated maximum/i);
  assert.ok(zero.error.indexOf('call emergency services immediately') < zero.error.indexOf('resting pulse must be lower'));
  const narrow = run(100, 119);
  assert.equal(narrow.ok, false);
  assert.match(narrow.error, /under 10 bpm/i);
  const valid = run(90, 120); // predicted max 130; 10 bpm reserve supports distinct whole-bpm bands
  assert.equal(valid.ok, true);
  assert.equal(valid.rows[1].value, '10 bpm');
});

test('abnormally slow or high resting readings show serious symptoms before training-range advice', () => {
  const slow = run(30, 30);
  assert.equal(slow.ok, true);
  assert.equal(slow.callout.tone, 'danger');
  assert.match(slow.callout.text, /below 40 bpm/i);
  assert.match(slow.callout.text, /call emergency services immediately/i);
  assert.equal(zone(slow, 0), '50–60% · 110–126 bpm');
  const high = run(30, 120);
  assert.equal(high.ok, true);
  assert.equal(high.callout.tone, 'warn');
  assert.match(high.callout.text, /above 100 bpm/i);
  assert.match(high.callout.text, /not use this estimate as clearance/i);
  assert.equal(zone(high, 0), '50–60% · 155–162 bpm');
  assert.equal(run(30, 59).callout.tone, 'info');
  assert.equal(run(30, 65).callout, undefined);
});

test('article-facing warning and embedded calculator UI prioritize real clinical reference, not an exercise clearance', () => {
  const a = content.indexOf(anchor), b = content.indexOf('\n  },', a);
  const section = content.slice(a, b);
  assert.match(block, /min: 18/);
  assert.doesNotMatch(section, /fastest your heart can safely beat/);
  assert.match(section, /not a medically established safe upper limit/);
  assert.match(section, /AHA_TARGET_HR/);
  assert.match(section, /call emergency services immediately/i);
  assert.match(ui, /slug === 'target-heart-rate-calculator' && result.callout/);
  assert.match(ui, /slug !== 'target-heart-rate-calculator' && result.callout/);
});
