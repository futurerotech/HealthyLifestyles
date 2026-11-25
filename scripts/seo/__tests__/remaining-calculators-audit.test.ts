// Phase 2 audit of the calculators that had no dedicated test: alcohol units,
// smoking cost, anti-inflammatory score, blue-light hygiene, weight-loss %
// and calorie deficit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');

// Explicit narrowing (independent of assert's type signature).
const zonesOf = (v: { kind: string }) => {
  if (v.kind !== 'zones') throw new Error('expected zones visual, got ' + v.kind);
  return (v as { kind: 'zones'; items: { label: string; detail: string; color: string; active?: boolean }[] }).items;
};
const run = (slug: string, vals: Record<string, number>, selects: Record<string, string> = {}, sex: 'male' | 'female' = 'male') =>
  getDef(slug)!.compute({ vals, selects, sex, units: 'metric' });

test('alcohol units: UK unit values and the 14-unit guideline boundary', () => {
  const r = run('alcohol-units-calculator', { beer: 4, wine: 3, spirits: 2 });
  assert.equal(r.primaryValue, '17.5 units'); // 9.2 + 6.3 + 2
  const at14 = run('alcohol-units-calculator', { beer: 0, wine: 0, spirits: 14 });
  assert.equal(at14.category?.label, 'Within the low-risk guideline');
  assert.equal(at14.callout, undefined);
  const over = run('alcohol-units-calculator', { beer: 0, wine: 0, spirits: 14.5 });
  assert.equal(over.category?.label, 'Above the low-risk guideline');
  assert.equal(over.callout?.tone, 'warn');
});

test('alcohol units: no unsourced, sex-blind "high risk" tier; zones are explained', () => {
  for (const u of [20, 36, 60, 100]) {
    const r = run('alcohol-units-calculator', { beer: 0, wine: 0, spirits: u });
    assert.equal(r.category?.label, 'Above the low-risk guideline', String(u));
  }
  const items = zonesOf(run('alcohol-units-calculator', { beer: 0, wine: 0, spirits: 0 }).visual);
  assert.equal(items.length, 2);
  for (const z of items) assert.ok(z.detail.length > 10, z.label);
  assert.match(items[0].detail, /not zero risk/);
});

test('smoking cost: arithmetic, and the packs stepper aligned with its minimum', () => {
  const r = run('smoking-cost-calculator', { packs: 1, price: 10, years: 10 });
  assert.equal(r.primaryValue.replace(/,/g, ''), '36500');
  assert.equal(r.rows?.find((x) => x.label === 'Per week')?.value, '70');
  const f = getDef('smoking-cost-calculator')!.fields.find((x) => x.key === 'packs')!;
  // HTML number inputs step from min: default 1 must be a valid step.
  const steps = (f.metricDefault - f.min) / (f.step ?? 1);
  assert.ok(Math.abs(steps - Math.round(steps)) < 1e-9, `default ${f.metricDefault} is off-step`);
  for (const v of [0.5, 1.5, 2]) { const k = (v - f.min) / f.step!; assert.ok(Math.abs(k - Math.round(k)) < 1e-9, String(v)); }
  assert.doesNotMatch(r.callout?.text ?? '', /normalise/);
});

const ANTI_KEYS = ['vegetables', 'fruit', 'wholeGrains', 'fattyFish', 'oliveOil', 'nuts', 'legumes'];
const PRO_KEYS = ['redMeat', 'refinedCarbs', 'sugaryDrinks', 'friedFood'];
const diet = (anti: string, pro: string) =>
  run('anti-inflammatory-score', {}, Object.fromEntries([...ANTI_KEYS.map((k) => [k, anti]), ...PRO_KEYS.map((k) => [k, pro])]));

test('anti-inflammatory score: 0–33 points mapped to 0–100, unchanged', () => {
  assert.equal(diet('daily', 'rarely').primaryValue, '100/100');
  assert.equal(diet('rarely', 'daily').primaryValue, '0/100');
  assert.equal(diet('3-5', '1-2').primaryValue, `${Math.round(((7 * 2 + 4 * 2) / 33) * 100)}/100`);
});

test('anti-inflammatory score: copy claims associations, not effects', () => {
  const r = diet('3-5', '1-2');
  const help = getDef('anti-inflammatory-score')!.fields.map((f) => f.help ?? '').join(' ');
  assert.doesNotMatch(help, /powerfully anti-inflammatory|drives inflammation/);
  assert.doesNotMatch(r.callout?.text ?? '', /gives similar anti-inflammatory benefits/);
  assert.match(r.callout?.text ?? '', /does not measure inflammation/);
});

const light = (o: Record<string, string>) => run('blue-light-exposure-estimator', {}, {
  bedtime: '23', preBed: '1-2', evening: '1-2', device: 'phone', nightMode: 'sometimes', roomLight: 'normal', curfew: 'none', ...o,
});
const pts = (r: ReturnType<typeof light>, name: string) => zonesOf(r.visual).find((z) => z.label === name)!.detail;

test('blue light: no penalty or tip for a device or filter that is not used', () => {
  const none = light({ device: 'none', preBed: '0', evening: '0', nightMode: 'never' });
  assert.equal(pts(none, 'Device type'), '6/6');
  assert.equal(pts(none, 'Night mode / filter'), '8/8');
  assert.doesNotMatch(none.note ?? '', /Enable night mode|Phones are held closest/);
  // No screen in the last hour: device irrelevant, but evening screens still count the filter.
  const noPreBed = light({ preBed: '0', evening: '2-3', device: 'phone', nightMode: 'never' });
  assert.equal(pts(noPreBed, 'Device type'), '6/6');
  assert.equal(pts(noPreBed, 'Night mode / filter'), '0/8');
  assert.doesNotMatch(noPreBed.note ?? '', /Phones are held closest/);
  assert.match(noPreBed.note ?? '', /Enable night mode/);
});

test('blue light: ordinary screen use keeps the original scoring', () => {
  const r = light({});
  assert.equal(pts(r, 'Device type'), '0/6');
  assert.equal(pts(r, 'Night mode / filter'), '4/8');
  assert.equal(r.primaryValue, `${Math.round(((2 + 4 + 0 + 4 + 2 + 0) / 40) * 100)}/100`);
  assert.match(r.note ?? '', /Phones are held closest/);
});

test('weight-loss %: arithmetic and clinically meaningful 5%/10% thresholds', () => {
  const r = run('weight-loss-percentage-calculator', { start: 100, current: 95 });
  assert.equal(r.primaryValue, '5%');
  assert.match(r.category?.label ?? '', /≥5%/);
  assert.match(run('weight-loss-percentage-calculator', { start: 100, current: 90 }).category?.label ?? '', /≥10%/);
  assert.equal(run('weight-loss-percentage-calculator', { start: 100, current: 104 }).category?.label, 'Weight gained');
});

test('calorie deficit: 3,500 kcal/lb arithmetic and unsafe-pace warnings', () => {
  const r = run('calorie-deficit-calculator', { maintenance: 2200, amount: 5, weeks: 10 }, {}, 'female');
  const lb = 5 * 2.20462;
  assert.equal(Number(r.primaryValue.replace(/[^\d.]/g, '')), Math.round((lb * 3500) / 70));
  assert.equal(r.callout, undefined);
  const fast = run('calorie-deficit-calculator', { maintenance: 2200, amount: 10, weeks: 4 }, {}, 'female');
  assert.equal(fast.callout?.tone, 'warn');
  const lowFloor = run('calorie-deficit-calculator', { maintenance: 1500, amount: 4, weeks: 10 }, {}, 'female');
  assert.match(lowFloor.callout?.text ?? '', /below the safe minimum of 1200/);
});
