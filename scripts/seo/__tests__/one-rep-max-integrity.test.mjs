import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Execute the actual original one-rep compute closure, not reimplemented math.
const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const units = readFileSync(new URL('../../../src/lib/units.ts', import.meta.url), 'utf8');
const island = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
const content = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const ujs = ts.transpileModule(units, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const ux={exports:{},Number,Math,String};
runInNewContext(ujs,ux);
const {fmt,fmtMass,kgToLb,lbToKg,round}=ux.exports;
const a=defs.indexOf("  'one-rep-max-calculator': {"), b=defs.indexOf('  // ---- FFMI',a);
assert.ok(a>=0&&b>a,'original one-rep calc block exists');
const block=defs.slice(a,b);
const start=block.indexOf('    compute: '),end=block.lastIndexOf('\n    },');
assert.ok(start>=0&&end>start,'actual compute closure exists');
const js=ts.transpileModule('const compute = '+block.slice(start+'    compute: '.length,end)+'\n};',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const compute=runInNewContext(js+'\ncompute;',{fmt,fmtMass,Math,Number});
const run=(weight=80,reps=5,unit='metric')=>compute({vals:{weight,reps},units:unit,sex:'male',selects:{}});
const row=(r,label)=>r.rows.find(x=>x.label===label)?.value;

test('published default 80kg by 5 remains 93.3 Epley, 90 Brzycki and 74.7 at 80 percent',()=>{
  const r=run();
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'93.3 kg');
  assert.equal(r.primaryLabel,'Estimated 1-rep max (Epley)');
  assert.equal(row(r,'Brzycki estimate'),'90 kg');
  assert.equal(row(r,'80% of estimated 1RM'),'74.7 kg');
  assert.equal(r.rows.length,12);
  assert.equal(r.visual.kind,'none');
});

test('a single completed repetition is a recorded load, never extrapolated +3.33 percent',()=>{
  const r=run(80,1);
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'80 kg');
  assert.match(r.primaryLabel,/Completed single-rep load/);
  assert.equal(row(r,'Recorded one-rep load (Brzycki boundary)'),'80 kg');
  assert.equal(row(r,'100% of completed single-rep load'),'80 kg');
  assert.match(r.callout.text,/not a verified maximum/i);
  assert.match(r.note,/would otherwise overstate that load by 3.33%/);
});

test('2, 10 and 11-15 repetitions keep original equations with transparent uncertainty',()=>{
  const two=run(80,2), ten=run(80,10), eleven=run(80,11), fifteen=run(80,15);
  assert.equal(two.ok,true);
  assert.equal(ten.primaryValue,'106.7 kg');
  assert.equal(row(ten,'Brzycki estimate'),'106.7 kg');
  assert.equal(ten.callout,undefined);
  assert.equal(fifteen.primaryValue,'120 kg');
  assert.equal(row(fifteen,'Brzycki estimate'),'130.9 kg');
  assert.equal(eleven.callout.tone,'warn');
  assert.equal(fifteen.callout.tone,'warn');
  assert.match(eleven.callout.text,/lower-rep range/);
  assert.equal(fifteen.rows.length,12);
});

test('invalid, fractional, zero, negative and over-limit inputs fail closed rather than clamp',()=>{
  for(const [w,r] of [[0,5],[-5,5],[501,5],[80,0],[80,16],[80,-1],[80,1.5],[80,4.1],[80,NaN],[NaN,5],[Infinity,5],[80,Infinity]]){
    const out=run(w,r);
    assert.equal(out.ok,false,String(w)+','+String(r));
    assert.equal(out.primaryValue,'');
    assert.match(out.error,/whole-number rep count from 1 to 15/);
  }
  assert.equal(run(1,1).ok,true);
  assert.equal(run(500,15).ok,true);
  assert.match(block,/Number.isInteger\(reps\)/);
  assert.doesNotMatch(block,/Math.max\(1, Math.min\(15, vals.reps\)\)/);
});

test('imperial output uses same kilograms, and original input survives kg-lb-kg roundtrips',()=>{
  const kg=lbToKg(225);
  const metric=run(kg,5,'metric');
  const imperial=run(kg,5,'imperial');
  assert.equal(imperial.ok,true);
  assert.equal(imperial.primaryValue,'262.5 lb');
  assert.equal(row(imperial,'Brzycki estimate'),'253.1 lb');
  assert.ok(metric.ok);
  assert.ok(Math.abs(kgToLb(kg)-225)<1e-9);
  // Generic source display converter loses the entered value after roundtripping.
  const genericReturned=round(kgToLb(round(kg,1)),1);
  assert.notEqual(genericReturned,225);
  assert.match(island,/slug === 'one-rep-max-calculator' && oneRepLoad/);
  assert.match(island,/to === load.enteredUnit/);
  assert.match(island,/load.enteredText/);
  assert.match(island,/setOneRepLoad\(val.trim\(\) !== ''/);
});

test('existing tool copy states real rep assumptions and source-backed limitations',()=>{
  const s=content.slice(content.indexOf("  'one-rep-max-calculator': {"),content.indexOf("  'ffmi-calculator': {"));
  assert.match(s,/For one completed repetition, no extrapolation is made/);
  assert.match(s,/calculator still allows 11–15 whole reps/);
  assert.match(s,/https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/16937972\//);
  assert.doesNotMatch(s,/Epley tends to read slightly higher at higher reps/);
});
