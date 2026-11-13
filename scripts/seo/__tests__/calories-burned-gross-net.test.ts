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
  const def = getDef('calories-burned-calculator');
  assert.ok(def, 'the original calculator definition must exist');
  return def;
};

test('running keeps gross MET energy as primary and labels the above-rest estimate', () => {
  const result = calculator().compute({
    vals: { weight: 72, minutes: 45 },
    selects: { activity: 'running' },
    sex: 'male',
    units: 'metric',
  });
  assert.equal(result.ok, true);
  assert.match(result.primaryLabel, /including rest/i);
  assert.equal(result.primaryValue, '529 kcal'); // 9.8 * 72 * (45/60) = 529.2
  const additional = result.rows?.find((row) => /additional above-rest/i.test(row.label));
  assert.equal(additional?.value, '475 kcal'); // (9.8 - 1) * 72 * 0.75 = 475.2
  assert.match(result.note ?? '', /double-count/i);
});

test('walking exposes the exact gross-versus-above-rest distinction at one hour', () => {
  const result = calculator().compute({
    vals: { weight: 70, minutes: 60 },
    selects: { activity: 'walking' },
    sex: 'female',
    units: 'metric',
  });
  assert.equal(result.primaryValue, '245 kcal'); // 3.5 * 70 * 1
  assert.equal(result.rows?.find((row) => /additional above-rest/i.test(row.label))?.value, '175 kcal');
  assert.equal(result.rows?.find((row) => /total per hour/i.test(row.label))?.value, '245 kcal');
});

test('longer duration scales both energy estimates while preserving their distinction', () => {
  const run = (minutes: number) => calculator().compute({
    vals: { weight: 80, minutes },
    selects: { activity: 'cycling' },
    sex: 'male',
    units: 'metric',
  });
  const thirty = run(30);
  const sixty = run(60);
  assert.equal(thirty.primaryValue, '300 kcal');
  assert.equal(sixty.primaryValue, '600 kcal');
  assert.equal(thirty.rows?.find((r) => /above-rest/i.test(r.label))?.value, '260 kcal');
  assert.equal(sixty.rows?.find((r) => /above-rest/i.test(r.label))?.value, '520 kcal');
});

test('educational content clearly differentiates total and additional energy', () => {
  const content = FITNESS_CONTENT['calories-burned-calculator'];
  assert.ok(content);
  const explanation = content.sections.find((s) => /how calories burned/i.test(s.h2));
  assert.ok(explanation?.paragraphs?.some((p) => /gross/i.test(p) && /resting/i.test(p)));
  assert.ok(content.faq.some((f) => /total and additional calories/i.test(f.q)));
  assert.ok(content.sections.some((s) => s.paragraphs?.some((p) => /double-count/i.test(p))));
});
