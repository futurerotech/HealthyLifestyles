import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the REAL Max Heart Rate compute body, not a test-only reimplementation.
const read = (p) => readFileSync(new URL('../../../' + p, import.meta.url), 'utf8');
const defs = read('src/islands/calculators/defs.ts');
const page = read('src/data/heart-content.ts');
const marker = "  'max-heart-rate-calculator': {";
const start = defs.indexOf(marker);
assert.ok(start >= 0, 'existing calculator found');
const end = defs.indexOf('\n  },', start);
assert.ok(end > start, 'calculator block complete');
const block = defs.slice(start, end);
const fStart = block.indexOf('    compute: ');
const fEnd = block.lastIndexOf('\n    },');
assert.ok(fStart >= 0 && fEnd > fStart, 'real function extracted');
const arrow = block.slice(fStart + '    compute: '.length, fEnd) + '\n}';
const transpiled = ts.transpileModule('const compute = ' + arrow + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const fmt = (n, digits) => Number(n.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits: digits});
const compute = runInNewContext(transpiled + '\ncompute;', { fmt, Math });
const evaluate = (age, formula = '220') => compute({ vals: { age }, selects: { formula } });
const section = page.slice(page.indexOf(marker), page.indexOf('\n  },', page.indexOf(marker)));

test('existing 220-minus-age and Tanaka formula values remain exact for 30 and 50', () => {
  const thirty = evaluate(30);
  assert.equal(thirty.primaryValue, '190 bpm');
  assert.equal(thirty.rows[0].value, '190 bpm');
  assert.equal(thirty.rows[1].value, '187 bpm');
  const selected = evaluate(30, 'tanaka');
  assert.equal(selected.primaryValue, '187 bpm');
  assert.equal(selected.rows[0].strong, false);
  assert.equal(selected.rows[1].strong, true);
  const fifty = evaluate(50);
  assert.equal(fifty.primaryValue, '170 bpm');
  assert.equal(fifty.rows[1].value, '173 bpm');
});

test('older-adult edge case remains mathematically visible but not framed as a safe ceiling', () => {
  const hundred = evaluate(100);
  assert.equal(hundred.primaryValue, '120 bpm');
  assert.equal(hundred.rows[1].value, '138 bpm');
  assert.match(hundred.note, /errors vary and may exceed 10–12 bpm/);
  assert.match(hundred.note, /not measured maximums/);
  assert.match(hundred.callout.text, /not a personal safe upper limit/i);
});

test('urgent exercise symptoms and medication caveats appear IN calculator result for both methods', () => {
  for (const formula of ['220','tanaka']) {
    const result = evaluate(30, formula);
    assert.equal(result.ok, true);
    assert.equal(result.callout.tone, 'warn');
    assert.match(result.callout.text, /stop and call emergency services immediately/i);
    assert.match(result.callout.text, /chest pain or pressure/i);
    assert.match(result.callout.text, /severe difficulty breathing/i);
    assert.match(result.callout.text, /fainting/i);
    assert.match(result.callout.text, /beta-blockers/i);
    assert.match(result.callout.text, /not a personal safe upper limit/i);
  }
});

test('adult-only UI age bounds and its article-facing references remain consistent', () => {
  assert.match(block, /\.\.\.F\.age\(30\), min: 18/);
  assert.match(section, /For adults 18\+/);
  assert.match(section, /not an exercise clearance or a safe heart-rate ceiling/);
  assert.match(section, /Tanaka equation.*healthy adults/);
  assert.match(section, /AHA_TARGET_HR/);
  assert.doesNotMatch(section, /perfectly adequate|highest your heart can beat during all-out effort/);
});
