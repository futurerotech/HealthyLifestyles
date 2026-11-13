import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { FITNESS_CONTENT } = await import('../../../src/data/fitness-content.ts');
const calc = () => {
  const d = getDef('ffmi-calculator');
  assert.ok(d);
  return d;
};
const r = (weight: number, height: number, bodyfat: number, units: 'metric' | 'imperial' = 'metric') =>
  calc().compute({ vals: {weight, height, bodyfat}, selects: {}, sex: 'male', units });

test('original FFMI calculation remains numeric and height normalization uses published 6.3 coefficient', () => {
  const out = r(72, 175, 15);
  assert.equal(out.ok, true);
  assert.equal(out.primaryValue, '20');
  assert.equal(out.rows?.find((x) => /Height-normalized FFMI/.test(x.label))?.value, '20.3');
  assert.equal(out.rows?.find((x) => /fat-free mass/.test(x.label))?.value, '61.2 kg');
});

test('study-specific FFMI cannot assign drug status or universal health band', () => {
  for (const input of [[72,175,15],[72,150,15],[115,180,8]]) {
    const out = r(...input);
    assert.equal(out.visual.kind, 'none');
    assert.equal(out.category, undefined);
    assert.match(out.note ?? '', /cannot diagnose health or determine/i);
  }
});

test('height difference makes normalization coefficient observable', () => {
  const out = r(72, 150, 15);
  assert.equal(out.rows?.find((x) => /Height-normalized FFMI/.test(x.label))?.value, '29.1');
});

test('sources are exact relevant studies and the visible prose rejects drug inferences', () => {
  const c = FITNESS_CONTENT['ffmi-calculator'];
  assert.ok(c);
  assert.ok(c.sources.some((x) => x.url === 'https://pubmed.ncbi.nlm.nih.gov/7496846/'));
  assert.ok(c.sources.some((x) => x.url === 'https://pubmed.ncbi.nlm.nih.gov/12080449/'));
  assert.match(c.faq.find((x) => /natural/i.test(x.q))?.a ?? '', /cannot determine/i);
});
