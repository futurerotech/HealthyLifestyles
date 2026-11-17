import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, buildWeekPlan } from '../src/lib/health-reality-lab.mjs';

test('default plan respects available days and time', () => {
  const plan = buildWeekPlan(DEFAULTS);
  assert.equal(plan.schedule.length, 3);
  assert.ok(plan.totalMinutes <= DEFAULTS.sessions * DEFAULTS.minutes);
  assert.ok(plan.schedule.every((item) => item.minutes <= DEFAULTS.minutes));
});

test('five-minute low-energy seated options exist for all goals', () => {
  for (const goal of ['movement', 'food', 'sleep', 'calm']) {
    const plan = buildWeekPlan({ ...DEFAULTS, goal, minutes: 5, sessions: 7, energy: 'low', mobility: 'seated' });
    assert.equal(plan.schedule.length, 7);
    assert.ok(plan.schedule.every((item) => item.minutes === 5));
    assert.ok(plan.schedule.every((item) => item.when.length > 0));
  }
});

test('night shift avoids assuming night is sleep time', () => {
  const plan = buildWeekPlan({ ...DEFAULTS, goal: 'sleep', shift: 'night' });
  assert.ok(plan.schedule.every((item) => item.when.includes('main sleep')));
  assert.ok(plan.schedule.every((item) => !item.when.includes('10 PM')));
});

test('no spending is ever required', () => {
  for (const budget of ['no-spend', 'flexible']) {
    const plan = buildWeekPlan({ ...DEFAULTS, goal: 'food', budget, energy: 'high', minutes: 30 });
    assert.match(plan.summary, /No purchase is required/);
    assert.ok(plan.schedule.every((item) => item.minutes <= 30));
  }
});

test('plan is deterministic and avoids calendar duplication', () => {
  const a = buildWeekPlan({ ...DEFAULTS, sessions: 7 });
  const b = buildWeekPlan({ ...DEFAULTS, sessions: 7 });
  assert.deepEqual(a, b);
  assert.equal(new Set(a.schedule.map((item) => item.day)).size, 7);
});

test('rejects unsupported inputs and invalid time budgets', () => {
  for (const value of [
    { ...DEFAULTS, minutes: 0 },
    { ...DEFAULTS, minutes: Infinity },
    { ...DEFAULTS, sessions: 8 },
    { ...DEFAULTS, goal: 'diagnosis' },
    { ...DEFAULTS, shift: 'unknown' },
    null,
  ]) assert.throws(() => buildWeekPlan(value));
});

test('result structures are immutable to callers', () => {
  const result = buildWeekPlan(DEFAULTS);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.schedule));
  assert.ok(Object.isFrozen(result.schedule[0]));
});
