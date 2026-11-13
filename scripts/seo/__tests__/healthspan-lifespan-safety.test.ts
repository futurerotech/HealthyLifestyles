import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeHealthspan, type HealthspanInput } from '../../../src/lib/healthspan.ts';
import { RISK_CONTENT } from '../../../src/data/risk-content.ts';

const baseline: HealthspanInput = {
  age: 35, sex: 'female', activityMinutes: 90, fruitVeg: 3,
  ultraProcessed: 'sometimes', smoking: 'never', drinksPerWeek: 3,
  sleepHours: 7, stress: 'moderate', social: 'some', waistToHeight: null,
};

test('healthspan returns an educational habits score with no life-expectancy estimate', () => {
  const result = computeHealthspan(baseline);
  assert.ok(Number.isInteger(result.score) && result.score >= 0 && result.score <= 100);
  assert.equal('lifeEstimate' in result, false);
  assert.equal('lifeNote' in result, false);
  assert.equal(result.usedWaist, false);
});

test('both extreme habits profiles omit fabricated predicted lifespan years', () => {
  const profiles: HealthspanInput[] = [
    { ...baseline, sex: 'male', activityMinutes: 0, fruitVeg: 0, ultraProcessed: 'daily',
      smoking: 'current', drinksPerWeek: 70, sleepHours: 3, stress: 'high', social: 'limited',
      waistToHeight: 0.7 },
    { ...baseline, sex: 'female', activityMinutes: 300, fruitVeg: 8, ultraProcessed: 'rarely',
      smoking: 'never', drinksPerWeek: 0, sleepHours: 8, stress: 'low', social: 'strong',
      waistToHeight: 0.44 },
  ];
  for (const profile of profiles) {
    const result = computeHealthspan(profile);
    assert.equal('lifeEstimate' in result, false);
    assert.equal('lifeNote' in result, false);
    assert.ok(result.score >= 0 && result.score <= 100);
  }
});

test('optional waist factor remains transparent and score remains bounded', () => {
  const withoutWaist = computeHealthspan(baseline);
  const withWaist = computeHealthspan({ ...baseline, waistToHeight: 0.49 });
  assert.equal(withoutWaist.usedWaist, false);
  assert.equal(withWaist.usedWaist, true);
  assert.ok(withWaist.factors.some(f => f.key === 'waist' && f.max === 10));
  assert.equal(withoutWaist.factors.some(f => f.key === 'waist'), false);
  assert.ok(withWaist.score >= 0 && withWaist.score <= 100);
});

test('result island does not render an unsupported life expectancy panel', () => {
  const island = readFileSync(new URL('../../../src/islands/HealthspanScore.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(island, /lifeEstimate|lifeNote|Estimated life expectancy|hs__life-exp/);
  assert.match(island, /result\.score/);
  assert.match(island, /result\.improvements/);
});

test('tool copy correctly discloses no personal lifespan prediction', () => {
  const content = RISK_CONTENT['healthspan-score'];
  assert.ok(content);
  assert.match(content.notice ?? '', /NOT a lifespan prediction/i);
  assert.match(content.intro ?? '', /not a prediction of your lifespan/i);
});
