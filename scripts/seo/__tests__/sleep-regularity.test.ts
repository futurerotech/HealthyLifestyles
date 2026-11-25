import test from 'node:test';
import assert from 'node:assert/strict';

const { sleepRegularity, circularMean, clockDiff } = await import('../../../src/lib/sleep-regularity.ts');

const n = (bed: string, wake: string) => ({ bed, wake });

test('identical nights have zero spread and the right duration', () => {
  const r = sleepRegularity(Array(7).fill(n('23:00', '07:00')))!;
  assert.equal(r.nights, 7);
  assert.equal(r.meanDuration, 8);
  assert.deepEqual([r.bedSd, r.wakeSd, r.midSd, r.weekendShift], [0, 0, 0, 0]);
});

test('bedtimes either side of midnight are measured on the clock, not across the day', () => {
  assert.equal(Math.round(clockDiff(30, 1410)), 60);
  assert.ok(Math.abs(clockDiff(circularMean([1410, 30]), 0)) < 1e-6);
  const r = sleepRegularity([n('23:30', '07:30'), n('00:30', '08:30'), n('23:30', '07:30'), n('00:30', '08:30')])!;
  assert.equal(r.bedSd, 30);
  assert.equal(r.wakeSd, 30);
});

test('later weekend sleep shows as a positive weekend shift', () => {
  const week = [n('23:00', '07:00'), n('23:00', '07:00'), n('23:00', '07:00'), n('23:00', '07:00'),
    n('01:00', '10:00'), n('01:00', '10:00'), n('23:00', '07:00')];
  const r = sleepRegularity(week)!;
  // Weekday midpoint 03:00; Fri/Sat-night midpoint 05:30.
  assert.equal(r.weekendShift, 150);
  assert.ok(r.midSd > 60);
});

test('needs at least three complete nights; incomplete or blank nights are skipped', () => {
  assert.equal(sleepRegularity([n('23:00', '07:00'), n('23:00', '07:00'), null]), null);
  assert.equal(sleepRegularity([n('23:00', '07:00'), n('', '07:00'), n('23:00', ''), n('23:00', '07:00')]), null);
  const r = sleepRegularity([n('23:00', '07:00'), null, n('23:00', '07:00'), n('22:00', '06:00')])!;
  assert.equal(r.nights, 3);
  assert.equal(r.weekendShift, null);
});

test('implausible durations are flagged for the user to check', () => {
  const r = sleepRegularity([n('23:00', '07:00'), n('23:00', '00:30'), n('23:00', '07:00'), n('07:00', '23:00')])!;
  assert.deepEqual(r.implausible, [1, 3]);
});

test('night shift sleep (day sleep) is handled like any other schedule', () => {
  const r = sleepRegularity(Array(5).fill(n('08:00', '15:00')))!;
  assert.equal(r.meanDuration, 7);
  assert.equal(r.bedSd, 0);
});
