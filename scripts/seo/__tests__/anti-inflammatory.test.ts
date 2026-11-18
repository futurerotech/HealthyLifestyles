import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';

const def=DEFS['anti-inflammatory-score'];
const more=['vegetables','fruit','wholeGrains','fattyFish','oliveOil','nuts','legumes'];
const less=['redMeat','refinedCarbs','sugaryDrinks','friedFood'];
const base: Record<string,string> = {
  vegetables:'3-5',fruit:'3-5',wholeGrains:'3-5',fattyFish:'1-2',
  oliveOil:'3-5',nuts:'1-2',legumes:'1-2',
  redMeat:'1-2',refinedCarbs:'1-2',sugaryDrinks:'1-2',friedFood:'1-2',
};
const calculate=(answers:Record<string,string>={},units:ComputeCtx['units']='metric') =>
  def.compute({vals:{},selects:{...base,...answers},sex:'female',units});
const points=(r:ReturnType<typeof calculate>, label:string) =>
  r.rows?.find(x=>x.label.startsWith(label))?.value;
const selectAll=(a:string,b:string) =>
  Object.fromEntries([...more.map(k=>[k,a]),...less.map(k=>[k,b])]);

test('retains original eleven four-choice selects, defaults, seven vs four groups',()=>{
  assert.equal(def.hasSex,false);
  assert.deepEqual(def.fields.map(f=>f.key),[...more,...less]);
  for(const f of def.fields) {
    assert.equal(f.type,'select');
    assert.deepEqual(f.options?.map(x=>x.value),['rarely','1-2','3-5','daily']);
    assert.equal(f.selectDefault,base[f.key]);
  }
});

test('default group directions produce 19/33 = 58/100, with 21 and 12 possible',()=>{
  const r=calculate();
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'58/100');
  assert.equal(r.primaryLabel,'Food-pattern checklist (unvalidated)');
  assert.equal(points(r,'Illustrative point total'),'19/33');
  assert.equal(points(r,'More-frequent listed foods'),'11/21');
  assert.equal(points(r,'Reverse-coded listed foods'),'8/12');
  assert.match(r.category?.label ?? '',/site-defined/);
});

test('correct extreme polarity gives 0/33 and 33/33, not a medical grade',()=>{
  const worst=calculate(selectAll('rarely','daily'));
  assert.equal(worst.ok,true);
  assert.equal(worst.primaryValue,'0/100');
  assert.equal(points(worst,'Illustrative point total'),'0/33');
  const best=calculate(selectAll('daily','rarely'));
  assert.equal(best.ok,true);
  assert.equal(best.primaryValue,'100/100');
  assert.equal(points(best,'Illustrative point total'),'33/33');
  assert.equal(points(best,'More-frequent listed foods'),'21/21');
  assert.equal(points(best,'Reverse-coded listed foods'),'12/12');
  assert.doesNotMatch(best.category?.label ?? '',/Strongly anti-inflammatory|Good|clinical/i);
});

test('all-rarely and all-daily show intrinsic reverse-coding, no clinical prediction',()=>{
  assert.equal(calculate(selectAll('rarely','rarely')).primaryValue,'36/100');
  assert.equal(calculate(selectAll('daily','daily')).primaryValue,'64/100');
});

test('every more-frequent group is monotonically 0,1,2,3 points',()=>{
  const worst=selectAll('rarely','daily');
  for(const key of more){
    for(const [value,expected] of [['rarely',0],['1-2',1],['3-5',2],['daily',3]] as const){
      const r=calculate({...worst,[key]:value});
      assert.equal(r.ok,true,key+'/'+value);
      assert.equal(points(r,'Illustrative point total'),expected+'/33');
      assert.equal(r.visual.kind,'zones');
      if(r.visual.kind==='zones') {
        const zone=r.visual.items.find(z=>z.label.toLowerCase().replace(/ /g,'')===
          (def.fields.find(f=>f.key===key)?.label??'').toLowerCase().replace(/ /g,''));
        assert.equal(zone?.detail.endsWith(expected+'/3 points'),true,key);
      }
    }
  }
});

test('every reverse-coded group is monotonically 3,2,1,0 points',()=>{
  const worst=selectAll('rarely','daily');
  for(const key of less){
    for(const [value,expected] of [['rarely',3],['1-2',2],['3-5',1],['daily',0]] as const){
      const r=calculate({...worst,[key]:value});
      assert.equal(r.ok,true,key+'/'+value);
      assert.equal(points(r,'Illustrative point total'),expected+'/33',key+'/'+value);
    }
  }
});

test('each of eleven unknown, missing, partial or inherited-prototype responses fails closed',()=>{
  for(const key of [...more,...less]){
    for(const value of ['','foo','1-2junk','3-5.0','0','__proto__','toString']){
      const r=calculate({[key]:value});
      assert.equal(r.ok,false,key+'/'+value);
      assert.equal(r.primaryValue,'—');
      assert.equal(r.rows,undefined);
      assert.equal(r.category,undefined);
      assert.equal(r.visual.kind,'none');
      assert.match(r.error??'',new RegExp(key));
    }
    const missing=Object.fromEntries(Object.entries(base).filter(([k])=>k!==key));
    const r=def.compute({vals:{},selects:missing,sex:'male',units:'metric'});
    assert.equal(r.ok,false,'missing '+key);
    assert.match(r.error??'',new RegExp(key));
  }
});

test('unsupported unit names fail closed; metric and imperial produce identical checklist',()=>{
  assert.deepEqual(calculate({},'metric'),calculate({},'imperial'));
  const invalid=calculate({},'stone' as ComputeCtx['units']);
  assert.equal(invalid.ok,false);
  assert.match(invalid.error??'',/supported unit system/);
});

test('site-defined score stays 0..100 for all isolated options',()=>{
  const worst=selectAll('rarely','daily');
  for(const key of [...more,...less]){
    for(const value of ['rarely','1-2','3-5','daily']){
      const r=calculate({...worst,[key]:value});
      const n=Number(r.primaryValue?.split('/')[0]);
      assert.ok(r.ok && n>=0 && n<=100,key+'/'+value);
    }
  }
});

test('per-food zones total eleven and show transparent inverse points',()=>{
  const r=calculate();
  assert.equal(r.visual.kind,'zones');
  if(r.visual.kind==='zones'){
    assert.equal(r.visual.items.length,11);
    assert.equal(r.visual.items[0].detail,'3–5/week · 2/3 points');
    assert.equal(r.visual.items[7].detail,'1–2/week · 2/3 points');
  }
});

test('suggestions are nonprescriptive and no answer claims biomarker improvement',()=>{
  const r=calculate(selectAll('rarely','daily'));
  assert.match(r.note??'',/May|Consider|Try|Explore/i);
  assert.match(r.note??'',/NOT been clinically validated/);
  assert.match(r.callout?.text??'',/NOT a validated dietary inflammatory index/);
  assert.match(r.callout?.text??'',/does NOT confirm low body inflammation/);
  assert.doesNotMatch(JSON.stringify(r),/gives similar anti-inflammatory benefits|powerfully anti-inflammatory/);
});

test('even highest choices cannot certify absence of inflammation',()=>{
  const r=calculate(selectAll('daily','rarely'));
  assert.equal(r.ok,true);
  assert.match(r.callout?.text??'',/does NOT confirm low body inflammation/);
  assert.match(r.note??'',/does not measure inflammation, predict CRP, IL-6/);
  assert.match(r.category?.label??'',/site-defined/);
});

test('editorial states 7x3+4x3=33, default 19/33, observational and clinical limits',()=>{
  const s=readFileSync(new URL('../../../src/data/nutrition-content.ts',import.meta.url),'utf8');
  const a=s.indexOf("'anti-inflammatory-score': {");
  const b=s.indexOf("'food-symptom-diary': {",a);
  assert.ok(a>=0 && b>a);
  const page=s.slice(a,b);
  assert.match(page,/Seven × 3 = 21/);
  assert.match(page,/19\/33, displayed as 58\/100/);
  assert.match(page,/not clinically derived biomarker weights/);
  assert.match(page,/MedlinePlus|National Library of Medicine/);
  assert.match(page,/Dietary Inflammatory Index/);
  assert.match(page,/https:\/\/pmc.ncbi.nlm.nih.gov\/articles\/PMC3925198\//);
  assert.match(page,/https:\/\/pubmed.ncbi.nlm.nih.gov\/41211687\//);
  assert.match(page,/https:\/\/medlineplus.gov\/lab-tests\/c-reactive-protein-crp-test\//);
  assert.doesNotMatch(page,/Strongly anti-inflammatory" \(86–100\)|\bscore measures inflammation\b/);
});

test('catalog accurately frames food checklist without biomarker or lab promises',()=>{
  const c=readFileSync(new URL('../../../src/data/tools.ts',import.meta.url),'utf8');
  assert.match(c,/Explore 11 food-frequency groups with illustrative reverse-coded points/);
  assert.ok(DEFS['gut-health-score']);
  assert.ok(DEFS['food-symptom-diary']);
});
