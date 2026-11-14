// Phase 6 Hypothesis C prototype: deterministic schedule arithmetic, no clinical claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import { planShift, isOvernight, parseTime, formatTime, formatDuration, PRESETS, SLEEP_MIN_ADULT } from '../../../src/lib/shift-work.ts';

test('night shift 23:00-07:00 with a 30 min commute', () => {
  const p = planShift({ ...PRESETS.night, commuteMin: 30 });
  assert.equal(p.leaveHome, 22 * 60 + 30);
  assert.equal(p.arriveHome, 7 * 60 + 30);
  assert.equal(p.restWindowMin, 1440 - 480 - 60); // 15 h
  assert.equal(p.sleepStart, 8 * 60);           // after a 30 min wind-down
  assert.equal(p.sleepMin, 480);
  assert.equal(p.sleepEnd, 16 * 60);
  assert.equal(p.overnight, true);
  assert.ok(p.napWindow && p.napWindow.end === 21 * 60 + 30 && p.napWindow.start === 21 * 60 + 10);
  assert.equal(p.caffeineCutoff, 2 * 60);       // 6 h before the planned sleep start
  assert.equal(p.shortRest, false);
});

test('day and evening shifts are not overnight and get no nap suggestion', () => {
  for (const k of ['day', 'evening'] as const) {
    const p = planShift({ ...PRESETS[k], commuteMin: 20 });
    assert.equal(p.overnight, false);
    assert.equal(p.napWindow, null);
  }
});

test('a long shift with a long commute is flagged as short rest and never schedules more sleep than fits', () => {
  const p = planShift({ start: 6 * 60, end: 20 * 60, commuteMin: 90 }); // 14 h shift, 3 h commuting
  assert.equal(p.restWindowMin, 1440 - 840 - 180);
  assert.ok(p.sleepMin < SLEEP_MIN_ADULT);
  assert.equal(p.shortRest, true);
  assert.ok(p.sleepMin <= p.restWindowMin - 90);
});

test('overnight detection wraps midnight; time parsing and formatting are exact', () => {
  assert.equal(isOvernight(22 * 60, 2 * 60), true);
  assert.equal(isOvernight(18 * 60, 23 * 60 + 59), false);
  assert.equal(isOvernight(4 * 60, 12 * 60), true);
  assert.equal(parseTime('07:05'), 425);
  assert.equal(parseTime('24:00'), null);
  assert.equal(formatTime(0, 12), '12:00 AM');
  assert.equal(formatTime(13 * 60 + 5, 12), '1:05 PM');
  assert.equal(formatTime(13 * 60 + 5, 24), '13:05');
  assert.equal(formatTime(-30, 24), '23:30');
  assert.equal(formatDuration(450), '7 h 30 min');
});
