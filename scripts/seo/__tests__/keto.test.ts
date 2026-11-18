import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFS, type ComputeCtx } from '../../../src/islands/calculators/defs.ts';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, round } from '../../../src/lib/units.ts';

const keto = DEFS['keto-calculator'];
const calculate = (
  weight: number, height: number, age: number,
  sex: ComputeCtx['sex'] = 'male', activity = '1.375',
  units: ComputeCtx['units'] = 'metric',
) => keto.compute({ vals: { weight, height, age }, sex, selects: { activity }, units });
const row = (r: ReturnType<typeof calculate>, label: string) =>
  r.rows?.find(item => item.label.startsWith(label))?.value;

test('keto accepts original measurements but adult age starts at 19; no new diet-plan inputs', () => {
  assert.equal(keto.hasSex, true);
  assert.deepEqual(keto.fields.map(f => [f.key, f.type, f.min, f.max]), [
    ['weight', 'mass', 25, 300], ['height', 'height', 120, 230],
    ['age', 'age', 19, 100], ['activity', 'select', 0, 0],
  ]);
  assert.match(keto.fields[2].help ?? '', /19–78/);
});

test('preserves simplified Mifflin male/female REE and distinct assumed TDEE', () => {
  const male = calculate(70, 175, 30);
  const female = calculate(70, 175, 30, 'female');
  assert.equal(male.ok, true);
  assert.equal(female.ok, true);
  assert.equal(row(male, 'Predicted resting'), '1,649 kcal/day');
  assert.equal(row(female, 'Predicted resting'), '1,483 kcal/day');
  assert.equal(male.primaryValue, '2,267 kcal/day (estimate)');
  assert.equal(female.primaryValue, '2,039 kcal/day (estimate)');
  assert.match(male.note ?? '', /not measured BMR/);
});

test('all five original activity multipliers give correct REE-scaled TDEE', () => {
  const opts = keto.fields.find(f => f.key === 'activity');
  const expected = [
    ['1.2', '1,979 kcal/day (estimate)'],
    ['1.375', '2,267 kcal/day (estimate)'],
    ['1.55', '2,556 kcal/day (estimate)'],
    ['1.725', '2,844 kcal/day (estimate)'],
    ['1.9', '3,133 kcal/day (estimate)'],
  ];
  assert.deepEqual(opts?.options?.map(o => o.value), expected.map(x => x[0]));
  assert.equal(opts?.selectDefault, '1.375');
  for (const [activity, result] of expected) {
    const r = calculate(70, 175, 30, 'male', activity);
    assert.equal(r.ok, true, activity);
    assert.equal(r.primaryValue, result);
    assert.match(row(r, 'Assumed activity factor') ?? '', new RegExp(activity.replace('.', '\\.')));
  }
});

test('70/25/5 energy reconciles at 9/4/4 kcal per gram before rounding', () => {
  const r = calculate(70, 175, 30);
  assert.equal(r.ok, true);
  assert.equal(r.primaryLabel, 'Illustrative 70/25/5 energy split');
  assert.equal(row(r, 'Fat'), '176 g · 1,587 kcal');
  assert.equal(row(r, 'Protein'), '142 g · 567 kcal');
  assert.equal(row(r, 'TOTAL carbohydrate'), '28.34 g · 113 kcal');
  assert.equal(row(r, 'Illustrative activity-adjusted'), '2,267 kcal/day');
  assert.equal(r.visual.kind, 'donut');
  if (r.visual.kind === 'donut') {
    assert.equal(r.visual.centerValue, '2,267');
    assert.deepEqual(r.visual.slices.map(s => s.label), ['Protein', 'Carbs', 'Fat']);
    for (const [index, percent] of [[0,25], [1,5], [2,70]]) {
      assert.ok(Math.abs(r.visual.slices[index].pct - percent) < 1e-8);
    }
    assert.ok(Math.abs(r.visual.slices.reduce((sum, s) => sum + s.pct, 0) - 100) < 1e-8);
  }
  assert.match(r.note ?? '', /displayed grams are rounded/);
});

test('total carbohydrate grams and unmeasured net carbs are not conflated', () => {
  const r = calculate(70, 175, 30);
  assert.equal(r.ok, true);
  assert.match(r.rows?.[2].label ?? '', /TOTAL carbohydrate/);
  assert.match(r.rows?.[2].label ?? '', /not net/);
  assert.equal(row(r, 'Net carbohydrate allowance'), 'Not calculable without individual fiber/sugar-alcohol data');
  assert.match(r.callout?.text ?? '', /not net carbohydrate/);
  assert.match(r.note ?? '', /ADA does not recognize/);
  assert.doesNotMatch(JSON.stringify(r), /Net carb cap|To reach and stay in ketosis/);
});

test('above common 50g TOTAL carb description warns rather than promising ketosis', () => {
  const r = calculate(170, 200, 35, 'male', '1.9');
  assert.equal(r.ok, true);
  assert.equal(r.callout?.tone, 'warn');
  assert.match(r.callout?.text ?? '', /UNDER-50-g\/day/);
  assert.match(r.callout?.text ?? '', /does NOT guarantee ketosis/);
  const carbs = parseFloat(row(r, 'TOTAL carbohydrate') ?? '0');
  assert.ok(carbs > 50, String(carbs));
});

test('missing, partial, extra or invalid activity selections fail closed', () => {
  for (const activity of ['', '1.375junk', '1.200', '1.55 extra', '0', '-1', '1.234', '100', 'Infinity']) {
    const r = calculate(70, 175, 30, 'male', activity);
    assert.equal(r.ok, false, activity);
    assert.equal(r.primaryValue, '—');
    assert.equal(r.rows, undefined);
    assert.equal(r.visual.kind, 'none');
    assert.match(r.error ?? '', /listed activity levels/);
  }
  const r = keto.compute({ vals: { weight: 70, height: 175, age: 30 }, selects: {}, sex: 'male', units: 'metric' });
  assert.equal(r.ok, false);
});

test('sex and unit selections reject unknown entries and do not show macros', () => {
  const invalidSex = calculate(70, 175, 30, 'other' as ComputeCtx['sex']);
  const invalidUnits = calculate(70, 175, 30, 'male', '1.375', 'stone' as ComputeCtx['units']);
  for (const r of [invalidSex, invalidUnits]) {
    assert.equal(r.ok, false);
    assert.equal(r.rows, undefined);
    assert.equal(r.visual.kind, 'none');
  }
});

test('missing, nonfinite, zero, negative and out-of-form-range numeric inputs fail', () => {
  const bad: [number,number,number][] = [
    [NaN,175,30],[70,NaN,30],[70,175,NaN],[Infinity,175,30],
    [70,-Infinity,30],[70,175,Infinity],[0,175,30],[-1,175,30],
    [70,0,30],[70,175,0],[24.999,175,30],[300.001,175,30],
    [70,119.99,30],[70,230.01,30],[70,175,18],[70,175,100.5],[70,175,101],
  ];
  for (const [w,h,a] of bad) {
    const r = calculate(w,h,a);
    assert.equal(r.ok, false, [w,h,a].join('/'));
    assert.equal(r.primaryValue, '—');
    assert.equal(r.rows, undefined);
  }
  assert.equal(keto.compute({ vals: { weight:70, height:175 }, sex:'male', units:'metric', selects:{activity:'1.375'} }).ok,false);
});

test('original endpoints remain computationally valid when modeled energy is adequate', () => {
  assert.equal(calculate(25,120,19,'male','1.9').ok,true);
  assert.equal(calculate(300,230,100,'male','1.9').ok,true);
  assert.match(calculate(70,175,79).callout?.text ?? '', /19–78/);
  assert.doesNotMatch(calculate(70,175,78).callout?.text ?? '', /age extrapolates/);
});

test('extremely low model energy does not become an automatic keto diet plan', () => {
  const r = calculate(25,120,100,'female','1.2');
  assert.equal(r.ok,false);
  assert.equal(r.primaryValue,'—');
  assert.equal(r.rows,undefined);
  assert.equal(r.visual.kind,'none');
  assert.match(r.error ?? '', /under 1,000 kcal\/day/);
  assert.match(r.error ?? '', /NOT a universal safe-calorie minimum/);
});

test('precision-conserving kg/lb and cm/ft-in toggles work even at 25kg/120cm boundaries', () => {
  for (const [w,h,a] of [[25,120,19],[70,175,30],[72,176,30],[80,180,40],[300,230,100]]) {
    const pounds = round(kgToLb(w),3);
    const backWeight = round(lbToKg(pounds),2);
    const {ft,inch} = cmToFtIn(h,0.001);
    const backHeight = round(ftInToCm(ft,inch),2);
    assert.equal(backWeight,w, String(w));
    assert.ok(Math.abs(backHeight-h)<=0.01, String(h));
    const metric = calculate(w,h,a,'male','1.9','metric');
    const imperial = calculate(backWeight,backHeight,a,'male','1.9','imperial');
    assert.equal(metric.ok,true);
    assert.equal(imperial.ok,true);
    assert.equal(metric.primaryValue,imperial.primaryValue);
    assert.equal(row(metric,'TOTAL carbohydrate'),row(imperial,'TOTAL carbohydrate'));
  }
});

test('specialized UI conversion adds keto while retaining ideal-weight and other precision', () => {
  const ui = readFileSync(new URL('../../../src/islands/Calculator.tsx',import.meta.url),'utf8');
  assert.match(ui,/def.slug === 'macro-calculator' \|\| def.slug === 'keto-calculator'/);
  assert.match(ui,/def.slug === 'keto-calculator' \? 0.001 : def.slug === 'ideal-weight-calculator'/);
  assert.match(ui,/def.slug === 'keto-calculator'[\s\S]*?round\(ftInToCm/);
  assert.match(ui,/def.slug === 'keto-calculator' \|\| def.slug === 'protein-intake-calculator'/);
  assert.match(ui,/preciseWeight\(def\) \? 3 : 1/);
  assert.ok(DEFS['calorie-calculator'].compute);
  assert.ok(DEFS['macro-calculator'].compute);
});

test('page and catalog clearly qualify 70/25/5, net carbs and high-risk medical groups', () => {
  const src=readFileSync(new URL('../../../src/data/nutrition-content.ts',import.meta.url),'utf8');
  const a=src.indexOf("'keto-calculator': {"),b=src.indexOf("'vitamin-d-sun-calculator': {",a);
  assert.ok(a>0 && b>a);
  const section=src.slice(a,b);
  assert.match(section,/1,648.75 kcal\/day/);
  assert.match(section,/28.34 g TOTAL carbohydrate/);
  assert.match(section,/there is no single required ketogenic macro ratio/i);
  assert.match(section,/SGLT2 inhibitors/);
  assert.match(section,/pregnancy or breastfeeding/i);
  assert.match(section,/FDA-defined/);
  assert.match(section,/https:\/\/pubmed.ncbi.nlm.nih.gov\/2305711\//);
  assert.match(section,/https:\/\/pmc.ncbi.nlm.nih.gov\/articles\/PMC12690188\//);
  assert.doesNotMatch(section,/most people stay in ketosis by keeping net carbs/);
  const catalog=readFileSync(new URL('../../../src/data/tools.ts',import.meta.url),'utf8');
  assert.match(catalog,/70\/25\/5 macro example using estimated energy, total carbohydrates/);
});
