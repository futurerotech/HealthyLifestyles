import test from 'node:test';
import assert from 'node:assert/strict';
import { convertPaceInputs, KM_PER_MILE, runningPaceInputError } from '../../../src/lib/pace.ts';

test('10 km at 5 min/km becomes the same run in miles', () => {
  const result = convertPaceInputs(
    { distance: '10', paceMinutes: '5', paceSeconds: '0' }, 'km', 'mi',
  );
  assert.deepEqual(result, {
    distance: '6.2137', paceMinutes: '8', paceSeconds: '3',
  });
  const originalFinishSeconds = 10 * 300;
  const convertedFinishSeconds = Number(result.distance) *
    (Number(result.paceMinutes) * 60 + Number(result.paceSeconds));
  assert.ok(Math.abs(originalFinishSeconds - convertedFinishSeconds) < 2,
    'rounding to whole pace seconds must keep the finish time close');
});

test('converting the same race from miles back to km restores the event', () => {
  const result = convertPaceInputs(
    { distance: '6.2137', paceMinutes: '8', paceSeconds: '3' }, 'mi', 'km',
  );
  assert.deepEqual(result, {
    distance: '10', paceMinutes: '5', paceSeconds: '0',
  });
});

test('all distance conversions use exact international mile and retain useful precision', () => {
  assert.equal(KM_PER_MILE, 1.609344);
  const result = convertPaceInputs(
    { distance: '42.195', paceMinutes: '4', paceSeconds: '45' }, 'km', 'mi',
  );
  assert.ok(Math.abs(Number(result.distance) - 42.195 / KM_PER_MILE) < 0.000051);
  assert.equal(Number(result.paceMinutes) * 60 + Number(result.paceSeconds),
    Math.round(285 * KM_PER_MILE));
});

test('switching to the already-selected unit is a no-op and does not mutate input', () => {
  const input = { distance: '10.00', paceMinutes: '04', paceSeconds: '09' };
  assert.deepEqual(convertPaceInputs(input, 'km', 'km'), input);
  assert.deepEqual(input, { distance: '10.00', paceMinutes: '04', paceSeconds: '09' });
});

test('blank and invalid inputs stay blank/invalid while other fields convert safely', () => {
  const missing = convertPaceInputs(
    { distance: '', paceMinutes: '', paceSeconds: '30' }, 'km', 'mi',
  );
  assert.deepEqual(missing, { distance: '', paceMinutes: '', paceSeconds: '30' });
  const invalid = convertPaceInputs(
    { distance: 'oops', paceMinutes: '5', paceSeconds: '90' }, 'mi', 'km',
  );
  assert.deepEqual(invalid, { distance: 'oops', paceMinutes: '5', paceSeconds: '90' });
});

test('zero values are preserved without introducing negative or nonfinite input', () => {
  assert.deepEqual(convertPaceInputs(
    { distance: '0', paceMinutes: '0', paceSeconds: '0' }, 'km', 'mi',
  ), { distance: '0', paceMinutes: '0', paceSeconds: '0' });
});

test('valid visible running pace inputs pass in all three modes', () => {
  const f = { distance: '10', timeHours: '0', timeMinutes: '50',
    timeSeconds: '0', paceMinutes: '5', paceSeconds: '0' };
  for (const mode of ['time', 'pace', 'distance'] as const) {
    assert.equal(runningPaceInputError(mode, f), null, mode);
  }
});

test('minutes and seconds beyond 59 cannot silently change the result', () => {
  const f = { distance: '10', timeHours: '0', timeMinutes: '50',
    timeSeconds: '0', paceMinutes: '5', paceSeconds: '0' };
  for (const value of ['60', '90', '-1', '1.5', '']) {
    assert.match(runningPaceInputError('time', { ...f, paceSeconds: value }) || '', /valid pace/);
    assert.match(runningPaceInputError('pace', { ...f, timeMinutes: value }) || '', /valid hours/);
    assert.match(runningPaceInputError('distance', { ...f, timeSeconds: value }) || '', /valid hours/);
  }
});

test('invalid, incomplete, negative and nonfinite active inputs are rejected', () => {
  const f = { distance: '10', timeHours: '0', timeMinutes: '50',
    timeSeconds: '0', paceMinutes: '5', paceSeconds: '0' };
  for (const distance of ['', '0', '-5', 'Infinity', '10oops', 'NaN']) {
    assert.match(runningPaceInputError('time', { ...f, distance }) || '', /positive distance/);
  }
  for (const paceMinutes of ['', '-1', '5oops', '3.14']) {
    assert.match(runningPaceInputError('time', { ...f, paceMinutes }) || '', /valid pace/);
  }
  assert.match(runningPaceInputError('distance', {
    ...f, timeHours: '0', timeMinutes: '0', timeSeconds: '0',
  }) || '', /greater than zero/);
});

test('hidden inactive fields do not block the selected calculation mode', () => {
  const f = { distance: '10', timeHours: '0', timeMinutes: '50',
    timeSeconds: '0', paceMinutes: '5', paceSeconds: '0' };
  assert.equal(runningPaceInputError('time', { ...f, timeSeconds: '90' }), null);
  assert.equal(runningPaceInputError('pace', { ...f, paceSeconds: '90' }), null);
  assert.equal(runningPaceInputError('distance', { ...f, distance: 'invalid' }), null);
});
