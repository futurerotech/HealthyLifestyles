import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { DEFS } = await import('../../../src/islands/calculators/defs.ts');
const { BODY_WEIGHT_CONTENT } = await import('../../../src/data/body-weight-content.ts');
const def = DEFS['bmr-calculator'];
const compute = (weight: number, height: number, age: number, sex: 'male' | 'female') =>
  def.compute({ vals: { weight, height, age }, units: 'metric', sex, selects: {} });

test('Mifflin-St Jeor reference values (Am J Clin Nutr 1990)', () => {
  // 10*72 + 6.25*175 - 5*30 = 1663.75
  assert.equal(compute(72, 175, 30, 'male').primaryValue, '1,669 kcal/day');
  assert.equal(compute(72, 175, 30, 'female').primaryValue, '1,503 kcal/day');
});

test('activity table multiplies BMR by the five standard factors', () => {
  const rows = compute(72, 175, 30, 'male').rows ?? [];
  const bmr = 10 * 72 + 6.25 * 175 - 5 * 30 + 5;
  assert.deepEqual(rows.map(r => r.value),
    [1.2, 1.375, 1.55, 1.725, 1.9].map(f => `${Math.round(bmr * f).toLocaleString('en-US')} kcal/day`));
});

test('editing an input changes the result in the expected direction', () => {
  const kcal = (r: { primaryValue?: string }) => Number(r.primaryValue?.replace(/[^\d]/g, ''));
  const base = kcal(compute(72, 175, 30, 'female'));
  assert.equal(kcal(compute(82, 175, 30, 'female')) - base, 100);
  assert.ok(kcal(compute(72, 175, 50, 'female')) < base);
});

test('the adult-derived equation is limited to adults', () => {
  const age = def.fields.find(f => f.key === 'age');
  assert.ok(age && age.min >= 18, 'BMR age minimum must exclude minors');
  assert.match(compute(72, 175, 30, 'male').note ?? '', /adults/i);
  assert.match(compute(72, 175, 30, 'male').note ?? '', /pregnan/i);
});

test('every Mifflin-St Jeor based tool is limited to adults and states pregnancy scope', () => {
  for (const slug of ['bmr-calculator', 'calorie-calculator', 'macro-calculator', 'keto-calculator', 'metabolic-age-calculator']) {
    const tool = DEFS[slug];
    const age = tool.fields.find(f => f.key === 'age');
    assert.ok(age && age.min >= 18, `${slug} age minimum must exclude minors`);
    assert.equal(age.help, 'For adults 18 and older.');
    if (slug === 'metabolic-age-calculator') continue;
    const result = tool.compute({ vals: { weight: 72, height: 175, age: 30 }, units: 'metric', sex: 'female',
      selects: { activity: '1.375', goal: 'cut' } });
    assert.match(result.note ?? '', /pregnan/i, `${slug} note must exclude pregnancy`);
  }
});

test('page content states the adult scope rather than the general population', () => {
  const text = JSON.stringify(BODY_WEIGHT_CONTENT['bmr-calculator']);
  assert.doesNotMatch(text, /for the general population/);
  assert.match(text, /under 18/i);
});

test('unit switching keeps the exact metric measurement for BMR and the other Mifflin tools', async () => {
  const { lbToKg, kgToLb, ftInToCm } = await import('../../../src/lib/units.ts');
  // A rounded imperial round trip changes the measurement: 176 cm -> 5 ft 9 in -> 175 cm.
  const inches = 176 / 2.54;
  const ft = Math.floor(inches / 12), inch = Math.round(inches - ft * 12);
  const roundTripCm = Math.round(ftInToCm(ft, inch));
  assert.notEqual(roundTripCm, 176);
  const kcal = (r: { primaryValue?: string }) => Number(r.primaryValue?.replace(/[^\d]/g, ''));
  const exact = kcal(compute(72.5, 176, 30, 'male'));
  const drifted = kcal(compute(lbToKg(Math.round(kgToLb(72.5) * 10) / 10), roundTripCm, 30, 'male'));
  assert.notEqual(drifted, exact, 'drift is user-visible, so the island must preserve exact values');
  const island = readFileSync(new URL('../../../src/islands/Calculator.tsx', import.meta.url), 'utf8');
  for (const slug of ['bmr-calculator', 'calorie-calculator', 'macro-calculator', 'keto-calculator', 'metabolic-age-calculator', 'ffmi-calculator']) {
    assert.match(island, new RegExp(`EXACT_METRIC_SLUGS[\\s\\S]*'${slug}'`), slug);
  }
  assert.match(island, /if \(to === 'metric'\) \{[\s\S]*round\(exact\.height, 1\)/);
});
