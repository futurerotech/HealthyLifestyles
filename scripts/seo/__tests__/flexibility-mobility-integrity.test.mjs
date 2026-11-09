import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Compile and execute the actual production calculator, not a test reimplementation.
const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const start = defs.indexOf("  'flexibility-mobility-score': {");
const end = defs.indexOf('  // ---- Vitamin D & Sun Exposure', start);
assert.ok(start >= 0 && end > start, 'original calculator block must exist');
const block = defs.slice(start, end);
const computeStart = block.indexOf('    compute: ');
const computeEnd = block.lastIndexOf('\n    },');
assert.ok(computeStart >= 0 && computeEnd > computeStart, 'original compute closure must exist');
const expr = block.slice(computeStart + '    compute: '.length, computeEnd) + '\n}';
const compiled = ts.transpileModule('const compute = ' + expr + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const C = { red: '#dc2626', amber: '#d97706', teal: '#0d9488', green: '#16a34a', blue: '#2563eb' };
const fmt = (value, decimals = 0) => String(Number(Number(value).toFixed(decimals)));
const bandFor = (value, segments) => segments.find(s => value <= s.upTo) ?? segments.at(-1);
const compute = runInNewContext(compiled + '\ncompute;', { C, fmt, bandFor, Math });
const allMax = { sitReach:'palms', shoulder:'pass', ankle:'good', hip:'pass' };
const allMin = { sitReach:'short', shoulder:'fail', ankle:'fail', hip:'fail' };
const defaults = { sitReach:'fingertips', shoulder:'partial', ankle:'pass', hip:'pass' };
const run = (age, selects=defaults) => compute({ vals: { age }, selects, units: 'metric' });

test('published four-test raw maximum is 9, adjusted maximum is 10, never an impossible fraction', () => {
  const ages = [[30,'9/10','None'],[39,'9/10','None'],[40,'9.5/10','+0.5'],[49,'9.5/10','+0.5'],[50,'10/10','+1'],[100,'10/10','+1']];
  for(const [age, score, adjustment] of ages) {
    const r = run(age,allMax);
    assert.equal(r.ok,true);
    assert.equal(r.primaryValue,score,'age '+age);
    assert.equal(r.rows[0].value,'9/9','raw tally at age '+age);
    assert.match(r.rows[1].value,adjustment === 'None'? /^None$/ : new RegExp('^\\'+adjustment.replace('.','\\.').replace('+','+')+'\\b'));
    const [n,d] = r.primaryValue.split('/').map(Number);
    assert.ok(n<=d,'adjusted score cannot exceed denominator');
  }
});
test('minimum movement scores remain separate from illustrative age adjustment', () => {
  assert.equal(run(30,allMin).primaryValue,'0/10');
  assert.equal(run(30,allMin).rows[0].value,'0/9');
  assert.equal(run(50,allMin).primaryValue,'1/10');
  assert.equal(run(50,allMin).rows[0].value,'0/9');
  assert.match(run(50,allMin).note,/not validated age- or sex-based population norms/);
});
test('changing each observed movement changes the score and the per-area details', () => {
  const baseline = run(30,allMin);
  for(const [key,value] of Object.entries(allMax)) {
    const r=run(30,{...allMin,[key]:value});
    assert.notEqual(r.primaryValue,baseline.primaryValue);
    assert.equal(r.visual.kind,'zones');
    assert.equal(r.visual.items.length,4);
    assert.ok(r.visual.items.some(z=>z.detail.includes('/') && !z.detail.endsWith('0/2')));
  }
});
test('the original page exposes no irrelevant sex selector or false population norms', () => {
  assert.match(block,/hasSex: false/);
  assert.match(block,/compute: \(\{ vals, selects \}\)/);
  assert.doesNotMatch(block,/compute: \(\{ vals, sex/);
  const p = page.slice(page.indexOf("  'flexibility-mobility-score': {"),page.indexOf("  'steps-to-calories-calculator': {"));
  assert.match(p,/up to 9 raw points/);
  assert.match(p,/adjusted index out of 10/);
  assert.match(p,/not validated age- or sex-specific population norms/);
  assert.doesNotMatch(p,/This is a general self-assessment, not a clinical measurement/);
});
