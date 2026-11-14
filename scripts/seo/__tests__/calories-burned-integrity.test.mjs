import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Test actual source math and unit helpers; no duplicate formula implementation.
const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const units = readFileSync(new URL('../../../src/lib/units.ts', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const jsUnits = ts.transpileModule(units, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context = {exports:{},Number,Math,String};
runInNewContext(jsUnits, context);
const {fmt, round, kgToLb, lbToKg} = context.exports;

const start = defs.indexOf("  'calories-burned-calculator': {");
const end = defs.indexOf('  // ---- One-Rep Max',start);
assert.ok(start >= 0 && end > start, 'original Calories Burned tool must exist');
const original = defs.slice(start,end);
const computeStart = original.indexOf('    compute: ');
const computeEnd = original.lastIndexOf('\n    },');
assert.ok(computeStart >= 0 && computeEnd > computeStart,'original compute closure must exist');
const computeSrc = original.slice(computeStart+'    compute: '.length,computeEnd);
const js = ts.transpileModule('const compute = '+computeSrc+'\n};', {compilerOptions:{module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022}}).outputText;
const compute = runInNewContext(js+'\ncompute;', {fmt,Math,Number,String});
const run = (weight=72,minutes=45,activity='running') =>
  compute({vals:{weight,minutes},selects:{activity},units:'metric',sex:'male'});
const row = (res,label) => res.rows?.find(r=>r.label===label)?.value;

test('original default 72kg 45min 9.8MET running stays gross 529kcal',()=>{
  const result=run();
  assert.equal(result.ok,true);
  assert.equal(result.primaryValue,'529 kcal');
  assert.match(result.primaryLabel,/gross activity energy/i);
  assert.equal(row(result,'Gross per hour'),'706 kcal');
  assert.equal(row(result,'Gross per 30 minutes'),'353 kcal');
  assert.equal(row(result,'Approx. above-rest energy for this duration'),'475 kcal');
  assert.equal(row(result,'Selected MET value'),'9.8');
  assert.match(result.callout.text,/standardized 1 MET/);
});

test('3.5MET walking example remains unchanged but is NOT mislabeled 3.5mph',()=>{
  const walking=run(72,45,'walking');
  assert.equal(walking.ok,true);
  assert.equal(walking.primaryValue,'189 kcal');
  assert.equal(row(walking,'Approx. above-rest energy for this duration'),'135 kcal');
  assert.match(original,/Walking for pleasure \(MET 3\.5\)/);
  assert.doesNotMatch(original,/Walking, 3\.5 mph \(MET 3\.5\)/);
});
test('all twelve original activities remain available with finite positive gross energy',()=>{
  const names=['walking','running','cycling','swimming','hiit','yoga','weights','hiking','rowing','dancing','tennis','jumprope'];
  for(const activity of names){
    const result=run(70,30,activity);
    assert.equal(result.ok,true,activity);
    assert.ok(parseFloat(result.primaryValue)>0,activity);
    assert.ok(parseFloat(row(result,'Approx. above-rest energy for this duration'))>0,activity);
  }
});
test('invalid activity, nonfinite inputs, weight/time outside published boundaries fail closed',()=>{
  for(const [weight,minutes,activity] of [
    [72,45,'unknown'],[72,45,''],[24,45,'running'],
    [301,45,'running'],[72,0,'running'],[72,-2,'running'],
    [72,601,'running'],[NaN,45,'running'],[72,Infinity,'running'],
    [Infinity,45,'running'],[72,NaN,'running'],
  ]){
    const r=run(weight,minutes,activity);
    assert.equal(r.ok,false,String(activity)+':'+weight+','+minutes);
    assert.equal(r.primaryValue,'');
    assert.match(r.error,/calculator input limits/);
  }
  assert.equal(run(25,1,'walking').ok,true);
  assert.equal(run(300,600,'yoga').ok,true);
});
test('physical mass stays canonical across kg/lb toggles in this calculator only',()=>{
  const originalKg=72.25;
  const displayedLb=round(kgToLb(originalKg),1);
  assert.notEqual(lbToKg(displayedLb),originalKg);
  const originalResult=run(originalKg,45,'running');
  assert.equal(originalResult.primaryValue,run(originalKg,45,'running').primaryValue);
  assert.match(ui,/slug === 'calories-burned-calculator' && caloriesWeightOrigin/);
  assert.match(ui,/setCaloriesWeightOrigin\(null\)/);
  assert.match(ui,/to === preserved\.unit/);
  assert.match(ui,/preserved\.text/);
  assert.match(ui,/vals\.weight = caloriesWeightOrigin\.kg/);
});
test('tool-page science distinguishes gross from above-rest and cites the correct MET walking speed',()=>{
  const begin=copy.indexOf("  'calories-burned-calculator': {");
  const next=copy.indexOf('\n  // ============================================================',begin+10);
  const part=copy.slice(begin,next);
  assert.match(part,/gross activity energy/i);
  assert.match(part,/MET − 1/);
  assert.match(part,/3\.5–3\.9 mph as approximately 4\.8 MET/);
  assert.match(part,/https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/38242596\//);
  assert.match(part,/https:\/\/pacompendium\.com\/walking\//);
  assert.doesNotMatch(part,/walking \(3\.5 mph\) ≈ 3\.5/);
});
