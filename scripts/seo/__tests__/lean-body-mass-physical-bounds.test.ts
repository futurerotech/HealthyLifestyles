import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { BODY_WEIGHT_CONTENT } = await import('../../../src/data/body-weight-content.ts');

const calculator = getDef('lean-body-mass-calculator');
assert.ok(calculator);
const compute = (weight: number, height: number, sex: 'male' | 'female') =>
  calculator.compute({ vals: { weight, height }, sex, selects: {}, units: 'metric' });

test('Boer model withholds impossible lean mass instead of showing negative fat', () => {
  for (const sex of ['male', 'female'] as const) {
    const out = compute(25, 230, sex);
    assert.equal(out.ok, false);
    assert.equal(out.visual.kind, 'none');
    assert.equal(out.primaryValue, '—');
    assert.match(out.error ?? '', /physically implausible/);
  }
});

test('ordinary male case retains the Boer formula exactly', () => {
  const out = compute(80, 175, 'male');
  assert.equal(out.ok, true);
  assert.equal(out.primaryValue, '60.1 kg');
  assert.equal(out.rows?.find(x => x.label === 'Estimated fat mass')?.value, '19.9 kg');
  assert.equal(out.rows?.find(x => /as % of weight/.test(x.label))?.value, '75.1%');
});

test('ordinary female case retains the formula', () => {
  const out = compute(70, 165, 'female');
  assert.equal(out.ok, true);
  assert.equal(out.primaryValue, '47.4 kg');
  assert.equal(out.rows?.find(x => x.label === 'Estimated fat mass')?.value, '22.6 kg');
});

test('non-finite, zero and negative inputs do not produce numeric results', () => {
  for (const weight of [Number.NaN, Number.POSITIVE_INFINITY, 0, -3]) {
    const out = compute(weight, 175, 'male');
    assert.equal(out.ok, false);
    assert.equal(out.visual.kind, 'none');
  }
});

test('source copy warns about bounds and cites the primary Boer study', () => {
  const text = BODY_WEIGHT_CONTENT['lean-body-mass-calculator'];
  assert.ok(text);
  assert.match(text.notice ?? '', /above total weight/);
  assert.ok(text.sections.some(s => s.paragraphs?.some(p => /66 adults/.test(p))));
  assert.ok(text.sources.some(s => s.url === 'https://pubmed.ncbi.nlm.nih.gov/6496691/'));
});
