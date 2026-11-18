import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';

const def = DEFS['vitamin-d-sun-calculator'];
const defaults = {
  skinType: 'iii', uvIndex: '3-5', skinExposed: 'arms-face',
  sunscreen: 'spf30', diet: 'occasional',
};
const compute = (timeOutdoors: number, overrides: Record<string,string> = {},
  units: ComputeCtx['units'] = 'metric') => def.compute({
  vals: { timeOutdoors },
  selects: { ...defaults, ...overrides },
  sex: 'female', units,
});
const row = (r: ReturnType<typeof compute>, label: string) =>
  r.rows?.find(x => x.label.startsWith(label))?.value;

test('PR #5–7 previously merged non-scoring behavior is restored (no age or gauge)', () => {
  assert.equal(def.slug, 'vitamin-d-sun-calculator');
  assert.equal(def.hasSex, false);
  assert.deepEqual(def.fields.map(f=>[f.key,f.type]), [
    ['skinType','select'], ['uvIndex','select'], ['timeOutdoors','number'],
    ['skinExposed','select'], ['sunscreen','select'], ['diet','select'],
  ]);
  for (const n of [0, 1, 15, 600]) {
    const r = compute(n);
    assert.equal(r.ok, true);
    assert.equal(r.primaryValue, 'No safe UV target');
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.category, undefined);
    assert.doesNotMatch(JSON.stringify(r), /Sun synthesis potential|Good synthesis|gaugeVal/);
  }
});

test('UV Index categories remain EPA ranges, NOT vitamin D likelihood', () => {
  assert.deepEqual(def.fields.find(f=>f.key==='uvIndex')?.options?.map(o=>o.value),
    ['0-2','3-5','6-7','8-10','11+']);
  for (const [key,category] of [
    ['0-2','Low'],['3-5','Moderate'],['6-7','High'],
    ['8-10','Very high'],['11+','Extreme'],
  ]) {
    const r = compute(15,{uvIndex:key});
    assert.equal(r.primaryValue,'No safe UV target');
    assert.equal(row(r,'Reported UV Index'),key+' · '+category);
    assert.match(r.note ?? '',/forecast category|forecast/i);
  }
});

test('zero minutes never yields a low/moderate/good vitamin D grade', () => {
  const r = compute(0,{uvIndex:'11+',skinType:'i',skinExposed:'most-body',sunscreen:'none'});
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'No safe UV target');
  assert.equal(row(r,'Time already outdoors'),'0 min (none reported)');
  assert.equal(r.visual.kind,'none');
  assert.equal(r.category,undefined);
  assert.match(r.note ?? '',/0-minute entry is NOT a vitamin D score/);
});

test('duration accepts 0 and 600 but rejects missing, decimal, nonfinite and other invalid times', () => {
  assert.equal(compute(0).ok,true);
  assert.equal(compute(600).ok,true);
  for(const n of [undefined,-1,600.01,601,1.5,NaN,Infinity,-Infinity]) {
    const r=compute(n as number);
    assert.equal(r.ok,false,String(n));
    assert.equal(r.primaryValue,'—');
    assert.equal(r.rows,undefined);
    assert.equal(r.visual.kind,'none');
    assert.match(r.error ?? '',/whole number from 0 to 600/);
  }
});

test('all original selection sets still exist but dangerous sunscreen default is corrected', () => {
  const fields=Object.fromEntries(def.fields.map(f=>[f.key,f]));
  assert.deepEqual(fields.skinType.options?.map(o=>o.value),['i','ii','iii','iv','v','vi']);
  assert.deepEqual(fields.skinExposed.options?.map(o=>o.value),
    ['face-hands','arms-face','arms-legs','most-body']);
  assert.deepEqual(fields.sunscreen.options?.map(o=>o.value),['none','after','spf30']);
  assert.deepEqual(fields.diet.options?.map(o=>o.value),
    ['rarely','occasional','regular','frequent','supplement']);
  assert.equal(fields.sunscreen.selectDefault,'spf30');
  assert.match(fields.sunscreen.options?.[1].label ?? '',/not recommended/);
  assert.match(fields.sunscreen.help ?? '',/Do not delay/);
});

test('missing, invalid, extra, partial and prototype-sounding values reject per-field', () => {
  for(const field of ['skinType','uvIndex','skinExposed','sunscreen','diet']) {
    for(const value of ['', 'unknown', '__proto__', 'toString', '3-5extra']) {
      const r=compute(15,{[field]:value});
      assert.equal(r.ok,false,field+' '+value);
      assert.equal(r.rows,undefined);
      assert.equal(r.visual.kind,'none');
      assert.match(r.error ?? '',new RegExp(field));
    }
    const omitted=Object.fromEntries(Object.entries(defaults).filter(([k])=>k!==field));
    const r=def.compute({vals:{timeOutdoors:15},selects:omitted,sex:'male',units:'metric'});
    assert.equal(r.ok,false,field+' missing');
  }
});

test('non-default skin types and coverage are context, not higher vitamin D recommendations', () => {
  for(const skinType of ['i','ii','iii','iv','v','vi']) {
    for(const skinExposed of ['face-hands','arms-face','arms-legs','most-body']) {
      const r=compute(60,{skinType,skinExposed,uvIndex:'8-10'});
      assert.equal(r.ok,true,skinType+'/'+skinExposed);
      assert.equal(r.visual.kind,'none');
      assert.equal(r.primaryValue,'No safe UV target');
      assert.match(r.callout?.text ?? '',/skin cancer/);
    }
  }
  const field=def.fields.find(f=>f.key==='skinType');
  assert.doesNotMatch(field?.options?.at(-1)?.label ?? '',/never burns/);
});

test('unprotected/delayed sunscreen warns; SPF30 is not penalized in a score', () => {
  for(const sunscreen of ['none','after']) {
    const r=compute(25,{sunscreen});
    assert.equal(r.ok,true);
    assert.match(r.callout?.text ?? '',/Do NOT delay sun protection/);
    assert.equal(r.primaryValue,'No safe UV target');
    assert.equal(r.visual.kind,'none');
  }
  const protectedR=compute(25,{sunscreen:'spf30'});
  assert.equal(protectedR.ok,true);
  assert.doesNotMatch(protectedR.callout?.text ?? '',/You reported no sunscreen/);
  assert.equal(protectedR.primaryValue,'No safe UV target');
  assert.match(protectedR.note ?? '',/not estimate vitamin D synthesis/);
});

test('higher UV categories prompt extra protection, low UV does not become UV safe-for-D label', () => {
  for(const uvIndex of ['6-7','8-10','11+']) {
    const r=compute(30,{uvIndex});
    assert.match(r.callout?.text ?? '',/extra care/);
    assert.equal(r.visual.kind,'none');
  }
  const lower=compute(30,{uvIndex:'0-2'});
  assert.doesNotMatch(lower.callout?.text ?? '',/high or greater/);
  assert.match(lower.callout?.text ?? '',/no established safe unprotected UV time/i);
});

test('diet frequency or supplement alone is not inferred to meet vitamin D IU targets', () => {
  for(const diet of ['rarely','occasional','regular','frequent','supplement']) {
    const r=compute(15,{diet});
    assert.equal(r.ok,true);
    assert.match(row(r,'Dietary sources/supplements') ?? '',/unknown/);
    assert.doesNotMatch(JSON.stringify(r), /Meets target|Above target|Well below target/);
  }
  assert.match(row(compute(15,{diet:'supplement'}),'Dietary sources/supplements') ?? '',/dose and IU unknown/);
  assert.match(compute(15).note ?? '',/Food frequency and supplement use without dose cannot establish actual intake/);
});

test('unsupported units fail closed, while metric and imperial summary are identical', () => {
  const m=compute(15,{},'metric');
  const i=compute(15,{},'imperial');
  assert.deepEqual(m,i);
  const r=compute(15,{},'stone' as ComputeCtx['units']);
  assert.equal(r.ok,false);
  assert.match(r.error ?? '',/supported unit/);
});

test('medical safety, screening restraint and previously removed unsafe copy are documented', () => {
  const source=readFileSync(new URL('../../../src/data/nutrition-content.ts',import.meta.url),'utf8');
  const a=source.indexOf("'vitamin-d-sun-calculator': {");
  const b=source.indexOf("'gut-health-score': {",a);
  assert.ok(a>0 && b>a);
  const section=source.slice(a,b);
  assert.match(section,/earlier version of this site assigned/);
  assert.match(section,/does not predict vitamin D synthesis/);
  assert.match(section,/2024 Endocrine Society/);
  assert.match(section,/against routine/i);
  assert.match(section,/600 IU/);
  assert.match(section,/800 IU/);
  assert.match(section,/4,000 IU\/day/);
  assert.match(section,/sunscreen/i);
  assert.match(section,/skin-cancer/);
  assert.match(section,/https:\/\/www.aad.org\/media\/stats-vitamin-d/);
  assert.match(section,/https:\/\/www.epa.gov\/sunsafety\/uv-index-scale-0/);
  assert.match(section,/https:\/\/www.endocrine.org\/clinical-practice-guidelines\/vitamin-d-for-prevention-of-disease/);
  assert.doesNotMatch(section,/10–30 minutes of midday sun|short period of unprotected exposure \(10–15 minutes\)|daily supplement of 1,000–2,000 IU is reasonable/);
});

test('scope guards previous calculator revisions and catalog safely', () => {
  assert.equal(DEFS['keto-calculator'].hasSex,true);
  assert.equal(DEFS['water-intake-calculator'].hasSex,false);
  const tool=readFileSync(new URL('../../../src/data/tools.ts',import.meta.url),'utf8');
  assert.match(tool,/Review UV Index and reported exposure with skin-cancer prevention guidance/);
  assert.doesNotMatch(tool.slice(tool.indexOf("slug: 'vitamin-d-sun-calculator'"),
    tool.indexOf("slug: 'gut-health-score'")),/Estimate your vitamin D synthesis potential/);
});
