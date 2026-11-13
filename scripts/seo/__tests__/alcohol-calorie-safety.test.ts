import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { METABOLIC_CONTENT } = await import('../../../src/data/metabolic-content.ts');
const calculator = getDef('alcohol-calorie-calculator');
assert.ok(calculator);
const run = (beer: number, wine: number, spirits: number, cocktail: number) =>
  calculator.compute({ vals: { beer, wine, spirits, cocktail }, selects: {}, sex: 'female', units: 'metric' });

test('normal weekly alcohol energy arithmetic remains unchanged', () => {
  const out = run(4,3,2,1); // 600+375+194+225 = 1394 kcal/week
  assert.equal(out.ok, true);
  assert.equal(out.primaryValue, '1,394 kcal/week');
  assert.equal(out.rows?.find(x => /Per year/.test(x.label))?.value, '72,488 kcal');
  assert.equal(out.rows?.find(x => /Total drinks/.test(x.label))?.value, '10');
});

test('no numerical fat-gain prediction is displayed', () => {
  for (const out of [run(4,3,2,1), run(0,0,0,0)]) {
    assert.equal(out.rows?.some(x => /body fat per year|fat gain|pounds of fat/i.test(x.label)), false);
    assert.doesNotMatch(out.note ?? '', /3,500 kcal-per-pound/);
    assert.match(out.note ?? '', /not predicted fat gain or weight loss/i);
  }
});

test('zero drinks remain zero with no implied fat change', () => {
  const out = run(0,0,0,0);
  assert.equal(out.primaryValue, '0 kcal/week');
  assert.equal(out.visual.kind, 'none');
  assert.equal(out.rows?.find(x => /Per year/.test(x.label))?.value, '0 kcal');
});

test('moderation is not presented as a health-safe threshold', () => {
  const out = run(1,0,0,0);
  assert.match(out.callout?.text ?? '', /not a risk-free dose/i);
  const content = METABOLIC_CONTENT['alcohol-calorie-calculator'];
  assert.ok(content);
  assert.match(content.notice ?? '', /does not mean risk-free/i);
  assert.ok(content.faq.some(q => /risk-free/.test(q.q)));
  assert.ok(content.sources.some(x => x.url === 'https://www.cdc.gov/cancer/risk-factors/alcohol.html'));
});
