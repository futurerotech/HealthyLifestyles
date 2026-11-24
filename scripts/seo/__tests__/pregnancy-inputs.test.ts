import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { readPregnancyMeasurements, pregnancyDisplay, forgetPregnancyMeasurement } = await import('../../../src/lib/pregnancy-inputs.ts');
const { DEFS } = await import('../../../src/islands/calculators/defs.ts');
const { lbToKg } = await import('../../../src/lib/units.ts');
const def = DEFS['pregnancy-weight-gain-calculator'];
const input = (weight = '68.1') => ({ weight, height: '165', current: '65.1', week: '20' });
const compute = (vals: ReturnType<typeof readPregnancyMeasurements>, units: 'metric' | 'imperial' = 'metric') => def.compute({ vals, units, sex: 'female', selects: { pregnancyType: 'singleton' } });
for (const [weight, category, range] of [['50.4','Normal weight','25–35 lb'], ['68.1','Overweight','15–25 lb'], ['81.7','Obesity','11–20 lb']]) test(`BMI boundary ${weight} kg remains ${category} across unit switches`, () => {
  const metric = readPregnancyMeasurements(input(weight), 'metric');
  const imperialDisplay = pregnancyDisplay(metric, 'imperial', '20');
  const imperial = { ...readPregnancyMeasurements(imperialDisplay, 'imperial'), ...metric };
  assert.deepEqual(imperial, metric);
  const result = compute(imperial, 'imperial');
  assert.equal(result.ok, true);
  assert.equal(result.primaryValue, range);
  assert.match(result.rows?.[0].value ?? '', new RegExp(`\\(${category}\\)$`));
  assert.deepEqual(pregnancyDisplay(imperial, 'metric', '20'), input(weight));
});
test('repeated unit switches never change any entered measurement', () => {
  const original = readPregnancyMeasurements(input(), 'metric');
  let values = original;
  for (let i = 0; i < 20; i++) {
    const units = i % 2 ? 'metric' : 'imperial';
    values = { ...readPregnancyMeasurements(pregnancyDisplay(values, units, '20'), units), ...values };
  }
  assert.deepEqual(values, original);
  assert.equal(compute(values).rows?.find(r => r.label === 'Measured weight change')?.value, '-3 kg');
});
test('editing imperial weight invalidates only the corresponding retained measurement', () => {
  const initial = readPregnancyMeasurements(input(), 'metric');
  const d = pregnancyDisplay(initial, 'imperial', '20');
  d.weight = '145';
  const values = { ...readPregnancyMeasurements(d, 'imperial'), ...forgetPregnancyMeasurement(initial, 'weight') };
  assert.equal(values.weight, lbToKg(145));
  assert.equal(values.height, initial.height);
  assert.equal(values.current, initial.current);
  assert.match(compute(values).rows?.[0].value ?? '', /Normal weight/);
});
test('editing either imperial height part supersedes the retained height only', () => {
  const initial = readPregnancyMeasurements(input(), 'metric');
  for (const key of ['height_ft', 'height_in']) {
    const retained = forgetPregnancyMeasurement(initial, key);
    assert.equal(retained.height, undefined);
    assert.equal(retained.weight, initial.weight);
    assert.equal(retained.current, initial.current);
  }
});
for (const [feet,inches] of [['5',''],['','5'],['5','12'],['5','-1'],['5.5','5'],['5','Infinity']]) test(`invalid imperial height ${feet}/${inches} does not produce a result`, () => {
  const v = readPregnancyMeasurements({ weight: '150', current: '151', week: '20', height_ft: feet, height_in: inches }, 'imperial');
  assert.ok(Number.isNaN(v.height));
  assert.equal(compute(v, 'imperial').ok, false);
  const d = pregnancyDisplay(v, 'metric', '20');
  assert.equal(d.height, '');
});
test('blank metric mass remains invalid across a toggle; zero inches is valid', () => {
  const v = readPregnancyMeasurements({...input(),weight:''}, 'metric');
  assert.ok(Number.isNaN(v.weight));
  assert.equal(pregnancyDisplay(v, 'imperial', '20').weight, '');
  const good = readPregnancyMeasurements({weight:'150',current:'150',week:'20',height_ft:'5',height_in:'0'}, 'imperial');
  assert.equal(good.height, 152.4);
  assert.equal(compute(good, 'imperial').ok, true);
});
test('rounded inch carry remains a valid display', () => {
  const v = { weight: 65, current: 68, week: 20, height: 71.999 * 2.54 };
  const d = pregnancyDisplay(v, 'imperial', '20');
  assert.equal(d.height_ft, '6');
  assert.equal(d.height_in, '0');
});
