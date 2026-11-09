import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Compile and execute the original production calculator function, not a clone.
const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const content = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const start = defs.indexOf("  'steps-to-calories-calculator': {");
const end = defs.indexOf('  // ---- VO2 Max Estimator', start);
assert.ok(start >= 0 && end > start, 'original calculator found');
const block = defs.slice(start, end);
const cs = block.indexOf('    compute: ');
const ce = block.lastIndexOf('\n    },');
assert.ok(cs >= 0 && ce > cs, 'original compute closure found');
const expression = block.slice(cs + '    compute: '.length, ce) + '\n}';
const js = ts.transpileModule('const compute = ' + expression + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const C = { red:'#ef4444', amber:'#f59e0b', teal:'#14b8a6', green:'#16a34a', blue:'#3b82f6' };
// Match the production src/lib/units.ts round()/fmt() semantics.
const round = (n,dp=1) => Math.round((n + Number.EPSILON) * (10 ** dp)) / (10 ** dp);
const fmt = (n,dp=1) => round(n,dp).toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:dp});
const bandFor = (v,segs) => segs.find(s=>v<=s.upTo) ?? segs.at(-1);
const compute = runInNewContext(js + '\ncompute;', { C, fmt, bandFor, Number, Math });
const run = (steps=8000, sex='male', units='metric', height=170, weight=72) =>
  compute({ vals:{steps,height,weight}, sex, units, selects:{} });
const row = (r,label) => r.rows.find(x=>x.label===label).value;

test('the published default remains 8,000 steps, 5.64 km and 296 gross kcal',()=>{
  const r=run();
  assert.equal(r.ok,true);
  assert.equal(r.primaryLabel,'Estimated gross walking calories');
  assert.equal(r.primaryValue,'296 kcal');
  assert.equal(row(r,'Distance walked'),'5.64 km');
  assert.equal(row(r,'Estimated step length'),'71 cm');
  assert.equal(row(r,'Assumed walking time'),'71 min');
  assert.equal(row(r,'Approx. above-rest walking energy'),'212 kcal');
  assert.match(r.note,/not measured active calories or extra calories to eat/);
});

test('10,000 steps preserve the actual male/female and metric/imperial logic',()=>{
  const m=run(10000), imperial=run(10000,'male','imperial'), f=run(10000,'female');
  assert.equal(m.primaryValue,'370 kcal');
  assert.equal(row(m,'Distance walked'),'7.06 km');
  assert.equal(row(m,'Approx. above-rest walking energy'),'265 kcal');
  assert.equal(imperial.primaryValue,m.primaryValue);
  assert.equal(row(imperial,'Distance walked'),'4.38 mi');
  assert.equal(row(imperial,'Estimated step length'),'27.8 in');
  assert.equal(row(f,'Estimated step length'),'70 cm');
  assert.notEqual(f.primaryValue,m.primaryValue);
});

test('zero and 1 step work; fractional, negative, nonfinite or over-limit steps fail closed',()=>{
  for(const n of [0,1,100,60000]){
    const r=run(n);
    assert.equal(r.ok,true,'valid: '+n);
    assert.equal(r.visual.value,n);
    assert.ok(r.visual.max>=n);
  }
  assert.equal(run(0).primaryValue,'0 kcal');
  assert.equal(row(run(0),'Distance walked'),'0 km');
  for(const n of [-1,0.5,999.9,60001,Infinity,NaN]){
    const r=run(n);
    assert.equal(r.ok,false,'invalid: '+String(n));
    assert.equal(r.primaryValue,'');
    assert.match(r.error,/whole-number step count from 0 to 60,000/);
  }
  assert.match(block,/min: 0, max: 60000, allowZero: true/);
});

test('adult full-day bands use evidence-based exact transitions at 5000, 7500, 10000, 12500',()=>{
  const cases=[[0,'Sedentary'],[4999,'Sedentary'],[5000,'Low active'],
    [7499,'Low active'],[7500,'Somewhat active'],[9999,'Somewhat active'],
    [10000,'Active'],[12499,'Active'],[12500,'Highly active'],[60000,'Highly active']];
  for(const [n,label] of cases){
    const r=run(n);
    assert.equal(r.category.label,'If full-day total: '+label,'steps '+n);
    assert.equal(r.visual.kind,'gauge');
    assert.equal(r.visual.segments.length,5);
    assert.ok(r.visual.max>=n);
    assert.equal(r.visual.segments.at(-1).upTo,r.visual.max);
  }
});

test('original site copy discloses gross, above-rest, and daily-only classification',()=>{
  const p=content.slice(content.indexOf("  'steps-to-calories-calculator': {"),
    content.indexOf('  // ============================================================',content.indexOf("  'steps-to-calories-calculator': {")));
  assert.match(p,/Gross kcal = 3.5/);
  assert.match(p,/not measured active calories/);
  assert.match(p,/original adult pedometer categories/);
  assert.match(p,/https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/14715035\//);
  assert.match(p,/https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC10818145\//);
});
