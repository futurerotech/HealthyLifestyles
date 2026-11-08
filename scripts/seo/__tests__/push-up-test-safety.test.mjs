import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Run the REAL existing calculator compute body, not a separate test-only reimplementation.
const read = (p) => readFileSync(new URL('../../../' + p, import.meta.url), 'utf8');
const defs = read('src/islands/calculators/defs.ts');
const page = read('src/data/fitness-content.ts');
const ui = read('src/islands/Calculator.tsx');
const toolList = read('src/data/tools.ts');
const anchor = "  'push-up-test-calculator': {";
const start = defs.indexOf(anchor);
assert.notEqual(start, -1);
const end = defs.indexOf('\n  },', start);
assert.ok(end > start);
const block = defs.slice(start, end);
const fnStart = block.indexOf('    compute: ');
const fnEnd = block.lastIndexOf('\n    },');
assert.ok(fnStart >= 0 && fnEnd > fnStart, 'real production compute exists');
const arrow = block.slice(fnStart + '    compute: '.length, fnEnd) + '\n}';
const compiled = ts.transpileModule('const compute = ' + arrow + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const C = { blue:'#3b82f6', green:'#16a34a', teal:'#14b8a6', amber:'#f59e0b', red:'#ef4444', slate:'#64748b' };
const bandFor = (value, segments) => segments.find(s => value <= s.upTo) ?? segments[segments.length - 1];
const fmt = (value, digits) => Number(value.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits:digits});
const compute = runInNewContext(compiled + '\ncompute;', {C, Number, Math, fmt, bandFor});
const run = (age, sex, pushups, plank=0) => compute({vals:{age,pushups,plank},sex,selects:{},units:'metric'});
const pStart = page.indexOf(anchor);
const pEnd = page.indexOf("  'flexibility-mobility-score': {", pStart);
assert.ok(pStart >= 0 && pEnd > pStart);
const section = page.slice(pStart,pEnd);

test('ACSM 10th ed. Table 4.11 male adult boundary values match real implementation', () => {
  const expected = [[0,'Poor'],[11,'Poor'],[12,'Fair'],[16,'Fair'],[17,'Good'],[20,'Good'],[21,'Good'],[22,'Very good'],[29,'Very good'],[30,'Excellent'],[200,'Excellent']];
  for(const [reps,category] of expected){
    const r=run(30,'male',reps);
    assert.equal(r.ok,true,'male age30 reps'+reps);
    assert.equal(r.category.label,category,'male age30 reps'+reps);
    assert.equal(r.rows[1].value,category);
  }
  assert.equal(run(29,'male',36).category.label,'Excellent');
  assert.equal(run(39,'male',30).category.label,'Excellent');
  assert.equal(run(40,'male',25).category.label,'Excellent');
  assert.equal(run(50,'male',21).category.label,'Excellent');
  assert.equal(run(69,'male',18).category.label,'Excellent');
});

test('ACSM female modified-knee reference is distinct; correct age and boundary values', () => {
  assert.equal(run(30,'female',20).category.label,'Very good');
  assert.equal(run(30,'female',19).category.label,'Good');
  assert.equal(run(30,'female',27).category.label,'Excellent');
  assert.equal(run(20,'female',30).category.label,'Excellent');
  assert.equal(run(40,'female',24).category.label,'Excellent');
  assert.equal(run(50,'female',21).category.label,'Excellent');
  assert.equal(run(60,'female',11).category.label,'Good');
  assert.equal(run(69,'female',17).category.label,'Excellent');
  assert.match(run(30,'female',20).rows[0].value,/modified push-ups \(knees\)/i);
  assert.match(run(30,'male',20).rows[0].value,/standard push-ups \(toes\)/i);
});

test('outside ACSM 20-69 ages are counted without inventing a fitness norm', () => {
  for (const age of [15,19,70,100]) {
    const r=run(age,'male',20);
    assert.equal(r.ok,true);
    assert.equal(r.primaryValue,'20 reps');
    assert.equal(r.category.label,'Not graded for this age');
    assert.equal(r.visual.kind,'none');
    assert.match(r.rows[1].value,/outside 20–69/);
    assert.match(r.note,/No category or percentile/);
  }
  assert.equal(run(20,'male',20).category.label,'Fair');
  assert.equal(run(69,'male',20).category.label,'Excellent');
});

test('only whole reps and valid inputs are accepted, zero and cap are preserved', () => {
  for (const reps of [20.5,-1,201,NaN,Infinity]) {
    const r=run(30,'male',reps);
    assert.equal(r.ok,false);
    assert.equal(r.visual.kind,'none');
    assert.match(r.error,/whole number.*0 to 200/i);
  }
  for(const age of [14,101,29.5,NaN])assert.equal(run(age,'male',20).ok,false);
  for(const plank of [-1,600.5,601])assert.equal(run(30,'male',20,plank).ok,false);
  assert.equal(run(30,'male',0).ok,true);
  assert.equal(run(30,'male',200).visual.segments.at(-1).upTo,205);
  assert.equal(run(30,'male',20,600).rows.at(-1).value,'600 sec');
});

test('optional plank remains ungraded and symptoms remain prominent', () => {
  const r=run(30,'female',20,60);
  assert.match(r.rows.at(-1).label,/not graded/i);
  assert.equal(r.rows.at(-1).value,'60 sec');
  assert.equal(r.callout.tone,'warn');
  assert.match(r.callout.text,/Call emergency services/);
  assert.match(r.callout.text,/shoulder\/wrist pain/);
  assert.doesNotMatch(r.rows.at(-1).value,/Excellent|Good|Average/);
});

test('existing article embed protocol and tool copy are accurate without CMS writes', () => {
  assert.match(block,/ACSM Guidelines for Exercise Testing and Prescription, 10th ed., Table 4.11/);
  assert.match(block,/step: 1/);
  assert.match(ui,/slug === 'push-up-test-calculator' \? 'For the ACSM comparison:/);
  assert.match(section,/ages 20–69/);
  assert.match(section,/modified knee-supported push-ups/);
  assert.match(section,/not exact percentiles/);
  assert.match(section,/Full and modified repetitions are not interchangeable/);
  assert.doesNotMatch(section,/norms here use the standard .*both men and women|Reading your percentile band/);
  assert.match(toolList,/Compare your push-up count with ACSM adult age- and protocol-specific categories/);
});
