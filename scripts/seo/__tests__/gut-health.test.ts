import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';

const def = DEFS['gut-health-score'];
const answers = {
  redFlags: 'none', fiber: 'some', fermented: '1-2', plantDiversity: '10-20',
  water: '1-2', processed: 'several', sleep: 'fair', stress: 'moderate',
  activity: 'light', regularity: 'variable',
};
const compute = (extra: Record<string,string> = {},
  units: ComputeCtx['units'] = 'metric') => def.compute({
    vals: {}, selects: { ...answers, ...extra }, sex: 'female', units,
  });
const row = (r: ReturnType<typeof compute>, label: string) =>
  r.rows?.find(z => z.label.startsWith(label))?.value;

test('original nine habit selects and one safety red-flag select are retained', () => {
  assert.deepEqual(def.fields.map(f=>[f.key,f.type]), [
    ['redFlags','select'], ['fiber','select'], ['fermented','select'],
    ['plantDiversity','select'], ['water','select'], ['processed','select'],
    ['sleep','select'], ['stress','select'], ['activity','select'],
    ['regularity','select'],
  ]);
  assert.equal(def.hasSex,false);
  assert.deepEqual(def.fields[0].options?.map(o=>o.value),
    ['none','blood','weight','pain']);
});

test('default nine one-point habits remain 9/30 scaled to 30/100', () => {
  const r=compute();
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'30/100');
  assert.equal(row(r,'Illustrative point total'),'9/30');
  assert.equal(r.visual.kind,'zones');
  if(r.visual.kind==='zones') {
    assert.equal(r.visual.items.length,9);
    assert.deepEqual(r.visual.items.slice(0,3).map(i=>i.detail),['1/4 points','1/4 points','1/4 points']);
  }
  assert.match(r.primaryLabel,/unvalidated/);
  assert.match(r.category?.label ?? '',/site-defined/);
});

test('all nine original minima remain 0 and maxima remain 30 points', () => {
  const low=compute({
    fiber:'low', plantDiversity:'0-10', fermented:'rarely',
    water:'under-1', processed:'daily', sleep:'poor',
    stress:'high', activity:'sedentary', regularity:'irregular',
  });
  assert.equal(low.ok,true);
  assert.equal(low.primaryValue,'0/100');
  assert.equal(row(low,'Illustrative point total'),'0/30');
  const high=compute({
    fiber:'high',plantDiversity:'30+',fermented:'daily',
    water:'3+',processed:'rarely',sleep:'excellent',
    stress:'minimal',activity:'active',regularity:'regular',
  });
  assert.equal(high.ok,true);
  assert.equal(high.primaryValue,'100/100');
  assert.equal(row(high,'Illustrative point total'),'30/30');
  assert.equal(high.visual.kind,'zones');
  assert.doesNotMatch(high.category?.label ?? '',/Excellent|Healthy|optimal|clinical/i);
});

test('each factor has ordered mapping, maintaining original weights except hydration safety tie', () => {
  const expectations: Record<string, [string,number][]> = {
    fiber:[['low',0],['some',1],['good',2],['high',4]],
    plantDiversity:[['0-10',0],['10-20',1],['20-30',2],['30+',4]],
    fermented:[['rarely',0],['1-2',1],['3-5',2],['daily',4]],
    water:[['under-1',0],['1-2',1],['2-3',3],['3+',3]],
    processed:[['daily',0],['several',1],['occasionally',2],['rarely',3]],
    sleep:[['poor',0],['fair',1],['good',2],['excellent',3]],
    stress:[['high',0],['moderate',1],['low',2],['minimal',3]],
    activity:[['sedentary',0],['light',1],['moderate',2],['active',3]],
    regularity:[['irregular',0],['variable',1],['fairly',2],['regular',3]],
  };
  const start: Record<string,string> = {
    fiber:'low',plantDiversity:'0-10',fermented:'rarely',
    water:'under-1',processed:'daily',sleep:'poor',stress:'high',
    activity:'sedentary',regularity:'irregular',
  };
  for(const [field,values] of Object.entries(expectations)) {
    for(const [option,points] of values) {
      const r=compute({...start,[field]:option});
      assert.equal(r.ok,true,field+'/'+option);
      assert.equal(row(r,'Illustrative point total'),String(points)+'/30',field+'/'+option);
    }
  }
});

test('3+ liters never scores above 2-3 liters and is not prescribed', () => {
  const a=compute({water:'2-3'});
  const b=compute({water:'3+'});
  assert.equal(a.primaryValue,b.primaryValue);
  assert.equal(row(a,'Illustrative point total'),row(b,'Illustrative point total'));
  assert.doesNotMatch(a.note ?? '',/Drink 2–3L water\/day/);
  assert.match(a.note ?? '',/More water is not automatically better/);
  const f=def.fields.find(f=>f.key==='water');
  assert.match(f?.help ?? '',/not universally better/);
});

test('all red flags withhold 0-100 score, bars, tiers and improvements', () => {
  for(const redFlags of ['blood','weight','pain']) {
    const r=compute({redFlags});
    assert.equal(r.ok,true,redFlags);
    assert.equal(r.primaryValue,'Medical evaluation recommended');
    assert.equal(r.visual.kind,'none');
    assert.equal(r.category,undefined);
    assert.equal(r.callout?.tone,'danger');
    assert.equal(r.rows?.length,1);
    assert.match(r.note ?? '',/withheld/);
    assert.doesNotMatch(JSON.stringify(r),/\b\d{1,3}\/100\b|Top factor|Highest-rated listed factor/);
  }
});

test('red-flag override also works if all nine habits are maximized or missing', () => {
  const max=compute({
    redFlags:'blood',fiber:'high',fermented:'daily',
    plantDiversity:'30+',water:'3+',processed:'rarely',
    sleep:'excellent',stress:'minimal',activity:'active',regularity:'regular',
  });
  assert.equal(max.visual.kind,'none');
  assert.equal(max.primaryValue,'Medical evaluation recommended');
  assert.match(max.callout?.text ?? '',/black tarry stool/);
  const r=def.compute({vals:{},selects:{redFlags:'weight'},sex:'female',units:'metric'});
  assert.equal(r.ok,true);
  assert.equal(r.visual.kind,'none');
  assert.match(r.callout?.text ?? '',/Unexplained weight loss/);
});

test('missing and tampered red flag never silently becomes none', () => {
  for(const redFlags of ['', 'bloodjunk', '0', '__proto__', 'toString', 'unexpected']) {
    const r=compute({redFlags});
    assert.equal(r.ok,false,redFlags);
    assert.equal(r.primaryValue,'—');
    assert.equal(r.visual.kind,'none');
    assert.match(r.error ?? '',/listed digestive red-flag/);
  }
  const { redFlags, ...without }=answers;
  const r=def.compute({vals:{},selects:without,sex:'female',units:'metric'});
  assert.equal(r.ok,false);
});

test('every one of the nine factor selects fails closed on missing or forged values', () => {
  for(const key of ['fiber','plantDiversity','fermented','water','processed','sleep','stress','activity','regularity']) {
    for(const val of ['', '___', '__proto__','toString','someJunk','1.0']) {
      const r=compute({[key]:val});
      assert.equal(r.ok,false,key+'/'+val);
      assert.equal(r.rows,undefined);
      assert.equal(r.category,undefined);
      assert.equal(r.visual.kind,'none');
      assert.match(r.error ?? '',new RegExp(key));
    }
    const without=Object.fromEntries(Object.entries(answers).filter(([k])=>k!==key));
    const r=def.compute({vals:{},selects:without,sex:'male',units:'metric'});
    assert.equal(r.ok,false,key+' missing');
    assert.match(r.error ?? '',new RegExp(key));
  }
});

test('units only standard and unaffected by toggling (all inputs are select)', () => {
  assert.deepEqual(compute({},'metric'),compute({},'imperial'));
  const r=compute({},'stone' as ComputeCtx['units']);
  assert.equal(r.ok,false);
  assert.match(r.error ?? '',/supported unit/);
});

test('no clinical-grade tiers and no inference of microbiome diversity from the 0-100 number', () => {
  const r=compute({fiber:'good',plantDiversity:'20-30',fermented:'3-5'});
  assert.equal(r.ok,true);
  assert.match(r.note ?? '',/have not been clinically validated/);
  assert.match(r.callout?.text ?? '',/NOT a gut-health grade/);
  assert.doesNotMatch(r.category?.label ?? '',/Excellent|Very good|Healthy/);
  assert.match(r.note ?? '',/not laboratory measurements or diagnosis/);
});

test('editorial page, catalog and citations qualify observational thresholds and clinical red flags', () => {
  const s=readFileSync(new URL('../../../src/data/nutrition-content.ts',import.meta.url),'utf8');
  const a=s.indexOf("'gut-health-score': {"),b=s.indexOf("'anti-inflammatory-score': {",a);
  assert.ok(a>0&&b>a);
  const page=s.slice(a,b);
  assert.match(page,/3 × 4 \+ 6 × 3 = 30/);
  assert.match(page,/site-defined/i);
  assert.match(page,/30 different types of plants/);
  assert.match(page,/No. It is the maximum/);
  assert.match(page,/Medical assessment|clinical assessment/i);
  assert.match(page,/PMC12343204/);
  assert.match(page,/niddk.nih.gov\/health-information\/digestive-diseases\/constipation\/eating-diet-nutrition/);
  assert.match(page,/Probiotics-HealthProfessional/);
  assert.doesNotMatch(page,/24–48 hours of changing|microbiome responds to dietary changes surprisingly fast/);
  const tools=readFileSync(new URL('../../../src/data/tools.ts',import.meta.url),'utf8');
  assert.match(tools,/Explore nine self-reported habits with illustrative points/);
});

test('other calculators remain present and original macro and red-flag structures survive', () => {
  assert.ok(DEFS['vitamin-d-sun-calculator']);
  assert.ok(DEFS['keto-calculator']);
  assert.ok(DEFS['anti-inflammatory-score']);
  assert.equal(def.fields.find(f=>f.key==='redFlags')?.selectDefault,'none');
});
