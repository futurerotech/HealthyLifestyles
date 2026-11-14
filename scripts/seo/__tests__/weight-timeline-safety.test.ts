// Weight-loss timeline: plausible inputs, healthy-range goal floor, safe pace cap.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier: string, context: unknown, next: (s: string, c: unknown) => unknown) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} } as never);
const { computeWeightTimeline } = await import('../../../src/lib/weight-timeline.ts');

test('ordinary plan keeps the original projection and 1%/week cap', () => {
  const r = computeWeightTimeline({ currentKg: 90, goalKg: 75, weeklyRateKg: 0.5, heightCm: 175 });
  assert.equal(r.ok, true);
  assert.equal(r.status, 'ok');
  assert.equal(r.weeks, 30);
  assert.equal(r.safeMaxKg, 0.9);
  const fast = computeWeightTimeline({ currentKg: 90, goalKg: 75, weeklyRateKg: 3, heightCm: 175 });
  assert.equal(fast.tooFast, true);
  assert.equal(fast.effectiveRateKg, 0.9);
  assert.equal(fast.weeks, Math.ceil(15 / 0.9));
});

test('no timeline to a goal below the healthy range for the height (BMI < 18.5)', () => {
  // 175 cm → 18.5 × 1.75² = 56.7 kg
  const below = computeWeightTimeline({ currentKg: 70, goalKg: 50, weeklyRateKg: 0.5, heightCm: 175 });
  assert.equal(below.ok, false);
  assert.equal(below.status, 'below-healthy');
  assert.equal(below.healthyMinKg, 56.7);
  assert.equal(below.weeks, 0);
  assert.deepEqual(below.milestones, []);
  const at = computeWeightTimeline({ currentKg: 70, goalKg: 56.7, weeklyRateKg: 0.5, heightCm: 175 });
  assert.equal(at.status, 'ok');
});

test('impossible weights or heights are rejected, never given a date (goal 0 kg)', () => {
  for (const [currentKg, goalKg, heightCm] of [[90, 0, 175], [90, 10, 175], [1, 0, 175], [400, 90, 175], [90, 75, 50], [90, 75, 300], [Number.NaN, 75, 175]] as [number, number, number][]) {
    const r = computeWeightTimeline({ currentKg, goalKg, weeklyRateKg: 0.5, heightCm });
    assert.equal(r.status, 'invalid', `${currentKg}/${goalKg}/${heightCm}`);
    assert.equal(r.weeks, 0);
  }
  assert.equal(computeWeightTimeline({ currentKg: 80, goalKg: 85, weeklyRateKg: 0.5, heightCm: 175 }).status, 'gain');
});

test('UI asks for height, passes it, and offers help instead of a below-range plan', () => {
  const ui = readFileSync(new URL('../../../src/islands/WeightTimeline.tsx', import.meta.url), 'utf8');
  assert.match(ui, /<span>Height<\/span>/);
  assert.match(ui, /heightCm \}\)/);
  assert.match(ui, /registered dietitian can help/);
  assert.match(ui, /if \(!r\.ok\)/);
  assert.doesNotMatch(ui, /min="0" value=\{goal\}/);
});
