import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Run the exact production FFMI compute closure and production unit helpers.
const defs=readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url),'utf8');
const units=readFileSync(new URL('../../../src/lib/units.ts', import.meta.url),'utf8');
const island=readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url),'utf8');
const content=readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url),'utf8');
const ujs=ts.transpileModule(units,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const ux={exports:{},Number,Math,String};
runInNewContext(ujs,ux);
const {fmt,fmtMass,kgToLb,lbToKg,cmToFtIn,ftInToCm,round}=ux.exports;
const start=defs.indexOf("  'ffmi-calculator': {");
const end=defs.indexOf('  // ---- Recovery Time',start);
assert.ok(start>=0 && end>start,'original FFMI tool must exist');
const block=defs.slice(start,end);
const cs=block.indexOf('    compute: '),ce=block.lastIndexOf('\n    },');
assert.ok(cs>=0 && ce>cs,'original compute function found');
const code=ts.transpileModule('const compute = '+block.slice(cs+'    compute: '.length,ce)+'\n};',{compilerOptions:{module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022}}).outputText;
const compute=runInNewContext(code+'\ncompute;',{fmt,fmtMass,Number,Math});
const run=(weight=72,height=175,bodyfat=15,units='metric')=>compute({vals:{weight,height,bodyfat},units,sex:'male',selects:{}});
const row=(r,label)=>r.rows?.find(x=>x.label===label)?.value;
test('original published 72kg 175cm 15pct example retains raw20 and 6.1-normalized20.3',()=>{
  const r=run();
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'20');
  assert.equal(row(r,'Normalized FFMI (site formula, height-adjusted)'),'20.3');
  assert.equal(row(r,'Estimated fat-free mass (includes water, bone, organs)'),'61.2 kg');
  assert.equal(row(r,'Estimated fat mass'),'10.8 kg');
  assert.ok(Math.abs(61.2/(1.75**2)-19.983673469387755)<1e-10);
});
test('rounded imperial labels change FFMI, so FFMI-only precision preservation matters',()=>{
  const base=run();
  const pounds=round(kgToLb(72),1);
  const ht=cmToFtIn(175);
  const rounded=run(lbToKg(pounds),ftInToCm(ht.ft,ht.inch),15,'imperial');
  assert.notEqual(rounded.primaryValue,base.primaryValue);
  const exact=run(72,175,15,'imperial');
  assert.equal(exact.primaryValue,base.primaryValue);
  assert.equal(row(exact,'Estimated fat-free mass (includes water, bone, organs)'),'134.9 lb');
  assert.equal(row(exact,'Estimated fat mass'),'23.8 lb');
  assert.match(island,/slug === 'ffmi-calculator' && ffmiExact/);
  assert.match(island,/setFfmiExact\(\{ weight: ctx\.vals\.weight, height: ctx\.vals\.height \}\)/);
  assert.match(island,/delete next\[edited\]/);
});
test('no invalid universal grade or clipping outside former 14 to 30 gauge',()=>{
  for(const r of [run(),run(60,165,32),run(25,230,60),run(300,120,2)]){
    assert.equal(r.ok,true);
    assert.equal(r.visual.kind,'none');
    assert.equal(r.category,undefined);
    assert.match(r.callout.text,/reference distributions vary by sex, age/);
  }
  assert.doesNotMatch(block,/label: 'Below average'/);
  assert.match(run().note,/original small male-athlete study used 6.3/);
});
test('existing original input ranges are enforced for direct compute too',()=>{
  for(const [w,h,b] of [[24,175,15],[301,175,15],[72,119,15],[72,231,15],[72,175,1],[72,175,61],[72,0,15],[72,175,NaN],[Infinity,175,15]]){
    const r=run(w,h,b);
    assert.equal(r.ok,false,String(w));
    assert.equal(r.primaryValue,'');
    assert.match(r.error,/calculator input limits, not healthy reference ranges/);
  }
  assert.equal(run(25,120,2).ok,true);
  assert.equal(run(300,230,60).ok,true);
});
test('original tool text matches published Article43 coefficient and cited studies',()=>{
  const start=content.indexOf("  'ffmi-calculator': {");
  const end=content.indexOf("  'recovery-time-calculator': {",start);
  const p=content.slice(start,end);
  assert.match(p,/original small male-athlete study used 6.3/);
  assert.match(p,/medians of 18.9 for younger adult men and 15.4/);
  assert.match(p,/https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/7496846\//);
  assert.match(p,/https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/12080449\//);
  assert.doesNotMatch(p,/For women, subtract roughly 1.5–2 points/);
  assert.doesNotMatch(p,/reference bands are calibrated/);
});
