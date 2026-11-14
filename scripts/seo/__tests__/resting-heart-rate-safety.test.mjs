import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Compile the REAL RHR compute body with the project's TypeScript compiler,
// rather than implementing a second formula that could pass while production fails.
const source = (path) => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');
const defs = source('src/islands/calculators/defs.ts');
const page = source('src/data/heart-content.ts');
const ui = source('src/islands/Calculator.tsx');
const anchor = "  'resting-heart-rate-checker': {";
const start = defs.indexOf(anchor);
assert.notEqual(start, -1, 'RHR definition must exist');
const end = defs.indexOf('\n  },', start);
assert.ok(end > start, 'RHR definition block must be complete');
const block = defs.slice(start, end);
const fnStart = block.indexOf('    compute: ');
const fnEnd = block.lastIndexOf('\n    },');
assert.ok(fnStart >= 0 && fnEnd > fnStart, 'real compute method must exist');
const arrow = block.slice(fnStart + '    compute: '.length, fnEnd) + '\n}';
const transpiled = ts.transpileModule('const compute = ' + arrow + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const C = { blue:'#3b82f6', green:'#16a34a', teal:'#14b8a6', amber:'#f59e0b', red:'#ef4444', slate:'#64748b' };
const compute = runInNewContext(transpiled + '\ncompute;', { C, Math, fmt: (v, d) => Number(v.toFixed(d)).toLocaleString('en-US') });
const run = (rhr, age=30, sex='male', fitness='unknown') => compute({
  vals: { rhr, age }, sex, selects: { fitness }
});
const label = (r) => String(r.category?.label ?? '');
const section = page.slice(page.indexOf(anchor), page.indexOf('\n  },', page.indexOf(anchor)));

test('age and sex shifts remain ILLUSTRATIVE, not clinical, across boundary cases', () => {
  const male = run(64,30,'male');
  const female = run(64,30,'female');
  assert.equal(label(male), 'Good (illustrative)');
  assert.equal(label(female), 'Excellent (illustrative)');
  assert.equal(label(run(60,65,'female')), 'Athlete (illustrative)');
  for (const r of [male,female,run(60,65,'female')]) {
    assert.equal(r.rows[0].value, '60–100 bpm');
    assert.match(r.note, /unvalidated illustrations/i);
    assert.doesNotMatch(r.note, /typical of well-trained endurance athletes|expected and healthy|better than the average adult/i);
  }
  assert.match(block, /min: 18/, 'the adult-only scope cannot accept 15-year-olds');
});

test('80 and 100 bpm stay clinically within adult reference despite the illustrative below-average label', () => {
  for (const value of [80,100]) {
    const r = run(value);
    assert.equal(label(r), 'Below average (illustrative)');
    assert.equal(r.category.color, C.slate, 'normal-range result must not use an alarming red score');
    assert.equal(r.rows[1].value, 'Within the usual adult range');
    assert.match(r.note, /does not diagnose poor health or fitness/i);
    assert.equal(r.visual.max, 130);
  }
});

test('markedly slow pulse never falsely reassures even with Athlete selected', () => {
  const low = run(35,30,'male','athlete');
  assert.equal(low.primaryValue, '35 bpm');
  assert.equal(low.callout.tone, 'danger');
  assert.equal(low.category.color, C.red);
  assert.match(label(low), /illustrative/i);
  assert.match(low.callout.text, /call emergency services immediately/i);
  assert.match(low.callout.text, /under 40 bpm is markedly slow/i);
  assert.ok(low.callout.text.indexOf('call emergency services immediately') < low.callout.text.indexOf('under 40 bpm'));
  assert.doesNotMatch(low.note, /expected and healthy|very efficient heart/i);
  assert.match(low.note, /does not guarantee that a low reading is safe/);
  assert.equal(low.visual.min, 30);
  assert.equal(low.visual.value, 35);
});

test('below-60, 60, and above-100 adult boundaries preserve appropriate follow-up and emergency context', () => {
  const low = run(59);
  assert.equal(low.rows[1].value, 'Below the usual adult range');
  assert.equal(low.callout.tone,'info');
  assert.match(low.callout.text, /not automatically healthy/i);
  const sixty = run(60);
  assert.equal(sixty.rows[1].value, 'Within the usual adult range');
  const high = run(101);
  assert.equal(high.rows[1].value, 'Above the usual adult range');
  assert.equal(high.callout.tone, 'warn');
  assert.equal(high.category.color, C.red);
  assert.match(high.callout.text, /call emergency services immediately/i);
  assert.equal(run(130).visual.value,130);
});

test('tool page, shared input help, published article semantics and clinical sources remain aligned', () => {
  assert.match(ui, /slug === 'resting-heart-rate-checker'/);
  assert.match(section, /internal offsets of 4 bpm.*1–2 bpm/);
  assert.match(section, /not validated clinical or fitness thresholds/);
  assert.match(section, /An 80-bpm result can display Below average/);
  assert.match(section, /emergency services immediately/);
  assert.match(section, /AHA_HR_URGENT/);
  assert.match(page, /const AHA_HR_URGENT: Source/);
});
