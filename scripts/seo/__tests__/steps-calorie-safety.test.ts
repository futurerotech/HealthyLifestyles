import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { FITNESS_CONTENT } = await import('../../../src/data/fitness-content.ts');

const calculator = () => {
  const def = getDef('steps-to-calories-calculator');
  assert.ok(def, 'existing steps calculator must be registered');
  return def;
};
const result = (steps: number, units: 'metric' | 'imperial' = 'metric') =>
  calculator().compute({ vals: { steps, height: 170, weight: 72 }, selects: {}, sex: 'male', units });

test('eight thousand walking steps distinguish gross from above-rest energy', () => {
  const r = result(8000);
  assert.equal(r.ok, true);
  assert.match(r.primaryLabel, /including rest/i);
  assert.equal(r.primaryValue, '296 kcal');
  assert.equal(r.rows?.find((row) => /additional above-rest/i.test(row.label))?.value, '212 kcal');
  assert.equal(r.rows?.find((row) => /distance walked/i.test(row.label))?.value, '5.64 km');
  assert.equal(r.rows?.find((row) => /assumed pace/i.test(row.label))?.value, '4.8 km/h (3.0 mph)');
});

test('unit changes preserve kcal totals and use miles for distance', () => {
  const metric = result(8000, 'metric'), imperial = result(8000, 'imperial');
  assert.equal(metric.primaryValue, imperial.primaryValue);
  assert.match(imperial.rows?.find((row) => /distance walked/i.test(row.label))?.value ?? '', /mi$/);
});

test('a step count cannot assign a clinical category or mandated daily goal', () => {
  for (const steps of [100, 4999, 7500, 10000, 60000]) {
    const r = result(steps);
    assert.equal(r.category, undefined);
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.rows?.some((row) => /daily goal/i.test(row.label)), false);
  }
});

test('authored copy explains MET assumptions and cites real step evidence', () => {
  const c = FITNESS_CONTENT['steps-to-calories-calculator'];
  assert.ok(c);
  assert.ok(c.sections.some((s) => s.paragraphs?.some((p) => /2024 Adult Compendium/.test(p))));
  assert.ok(c.sections.some((s) => s.paragraphs?.some((p) => /2025 systematic review/.test(p))));
  assert.ok(c.sections.some((s) => s.paragraphs?.some((p) => /No universal daily step threshold/.test(p))));
  assert.ok(c.sources.some((s) => s.url === 'https://pubmed.ncbi.nlm.nih.gov/40713949/'));
});
