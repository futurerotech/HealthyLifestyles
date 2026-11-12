/** Phase 2 BMR: actual helper + original calculator formula, no network or publishing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { editBmrCanonical, displayBmrCanonical } = await import('../../../src/islands/calculators/bmr-inputs.ts');
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const original = () => ({ weight: 72, height: 175, age: 30 });

test('BMR unit toggles preserve exact canonical kg and cm despite rounded displays', () => {
  const metric = original();
  let display = { weight: '72', height: '175', age: '30' };
  for (let i = 0; i < 12; i++) {
    display = displayBmrCanonical(display, metric, 'imperial');
    display = displayBmrCanonical(display, metric, 'metric');
  }
  assert.deepEqual(metric, original());
  assert.equal(display.weight, '72');
  assert.equal(display.height, '175');
});

test('BMR height editing in both unit systems leaves weight and age unchanged', () => {
  const baseline = original();
  const changedMetric = editBmrCanonical(baseline, { weight:'72', height:'180', age:'30' }, 'height', 'metric');
  assert.deepEqual(changedMetric, { weight:72, height:180, age:30 });
  const imperial = displayBmrCanonical({ weight:'72', height:'180', age:'30' }, changedMetric, 'imperial');
  const changedInches = editBmrCanonical(changedMetric, { ...imperial, height_ft:'5', height_in:'10' }, 'height_in', 'imperial');
  assert.equal(changedInches.weight,72);
  assert.equal(changedInches.age,30);
  assert.ok(Math.abs(changedInches.height - 177.8) < 1e-8);
});

test('BMR pounds are converted once; unchanged measurements stay in canonical metric', () => {
  const changed = editBmrCanonical(original(), {weight:'155',height_ft:'5',height_in:'9',age:'30'},'weight','imperial');
  assert.ok(Math.abs(changed.weight - 70.30681735) < 1e-8);
  assert.equal(changed.height,175);
  assert.equal(changed.age,30);
});

test('BMR blank, nonfinite and invalid feet/inches fail closed across toggles', () => {
  for (const [key, display] of [
    ['weight',{weight:'',height:'175',age:'30'}],
    ['weight',{weight:'Infinity',height:'175',age:'30'}],
    ['height_ft',{weight:'155',height_ft:'5',height_in:'',age:'30'}],
    ['height_in',{weight:'155',height_ft:'5',height_in:'12',age:'30'}],
    ['height_ft',{weight:'155',height_ft:'5.5',height_in:'10',age:'30'}],
  ] as const) {
    const canonical = editBmrCanonical(original(),display,key,key.startsWith('height_')?'imperial':'metric');
    assert.ok(!Number.isFinite(key==='weight' ? canonical.weight:canonical.height));
    const rendered = displayBmrCanonical(display,canonical,'metric');
    assert.equal(key==='weight' ? rendered.weight : rendered.height,'');
  }
});

test('original BMR formula retains default estimate and all five TDEE rows', () => {
  const def = getDef('bmr-calculator');
  assert.ok(def);
  const result = def.compute({ vals: original(), selects:{}, sex:'male', units:'metric' });
  assert.equal(result.ok,true);
  assert.equal(result.primaryValue,'1,669 kcal/day');
  assert.deepEqual(result.rows?.map((row) => row.value), [
    '2,003 kcal/day','2,295 kcal/day','2,587 kcal/day','2,879 kcal/day','3,171 kcal/day',
  ]);
});

test('direct BMR compute rejects nonfinite, out-of-range or malformed inputs', () => {
  const def = getDef('bmr-calculator');
  assert.ok(def);
  const base = { vals:original(), selects:{}, sex:'male' as const, units:'metric' as const };
  for (const vals of [
    { ...base.vals, height:Number.NaN },
    { ...base.vals, weight:0 },
    { ...base.vals, weight:Infinity },
    { ...base.vals, height:230.1 },
    { ...base.vals, age:14.99 },
    { ...base.vals, age:101 },
  ]) {
    const result=def.compute({ ...base, vals });
    assert.equal(result.ok,false);
    assert.ok(result.error);
  }
  assert.equal(def.compute({...base, sex:'invalid' as never}).ok,false);
});
