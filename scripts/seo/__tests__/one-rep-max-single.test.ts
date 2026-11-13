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
  const d = getDef('one-rep-max-calculator');
  assert.ok(d);
  return d;
};
const result = (w: number, reps: number, units: 'metric' | 'imperial' = 'metric') =>
  calc().compute({ vals: { weight: w, reps }, selects: {}, sex: 'male', units });

test('one entered repetition reports the actual recorded weight, not an invented heavier max', () => {
  const r = result(80, 1);
  assert.equal(r.primaryValue, '80 kg');
  assert.match(r.primaryLabel, /Recorded single-rep load/i);
  assert.equal(r.rows?.[0]?.value, '80 kg');
  assert.equal(r.rows?.find((x) => /100%/.test(x.label))?.value, '80 kg');
  assert.match(r.note ?? '', /does not prove/i);
});

test('multi-rep Epley and Brzycki formulas are unchanged', () => {
  const r = result(80, 5);
  assert.equal(r.primaryValue, '93.3 kg'); // 80 × (1 + 5/30)
  assert.equal(r.rows?.[0]?.value, '90 kg'); // 80 × 36 / (37 - 5)
  assert.equal(r.category, undefined);
});

test('15-rep extrapolation warns about high uncertainty', () => {
  const r = result(80, 15);
  assert.equal(r.primaryValue, '120 kg');
  assert.match(r.callout?.text ?? '', /More than 10 reps/i);
});

test('the content avoids treating a recorded single as a proved 1RM', () => {
  const c = FITNESS_CONTENT['one-rep-max-calculator'];
  assert.ok(c);
  assert.match(c.intro, /not a proven true maximum/i);
  assert.ok(c.sections.some((s) => s.paragraphs?.some((p) => /one rep/i.test(p))));
});
