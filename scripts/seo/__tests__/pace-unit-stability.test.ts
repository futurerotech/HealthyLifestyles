import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KM_PER_MILE, fromKilometers, toKilometers, fromSecondsPerKm, toSecondsPerKm } from '../../../src/lib/pace-units.ts';

test('10 km at 5 min/km is same physical finish time as miles at converted pace', () => {
  const distanceKm = 10, paceSecKm = 300;
  const miles = fromKilometers(distanceKm, 'mi');
  const secondsPerMile = fromSecondsPerKm(paceSecKm, 'mi');
  assert.ok(Math.abs(miles - 10 / KM_PER_MILE) < 1e-10);
  assert.ok(Math.abs(secondsPerMile - 300 * KM_PER_MILE) < 1e-10);
  assert.ok(Math.abs(miles * secondsPerMile - 3000) < 1e-9);
});

test('roundtrip unit toggle keeps internal kilometer and seconds per km values intact', () => {
  for (const [km, pace] of [[10, 300], [21.0975, 341], [42.195, 305]]) {
    assert.ok(Math.abs(toKilometers(fromKilometers(km, 'mi'), 'mi') - km) < 1e-9);
    assert.ok(Math.abs(toSecondsPerKm(fromSecondsPerKm(pace, 'mi'), 'mi') - pace) < 1e-9);
  }
});

test('pace UI stores canonical source units and does not only relabel on click', () => {
  const island = readFileSync(new URL('../../../src/islands/PaceCalculator.tsx', import.meta.url), 'utf8');
  assert.match(island, /const \[distanceKm, setDistanceKm\] = useState\(10\)/);
  assert.match(island, /const \[paceSecondsPerKm, setPaceSecondsPerKm\] = useState\(300\)/);
  assert.match(island, /setDisplayUnit\(u\)/);
  assert.doesNotMatch(island, /onClick=\{\(\) => setUnit\(u\)\}/);
});

test('long race split tables still include a finish beyond 60 miles or km', () => {
  const island = readFileSync(new URL('../../../src/islands/PaceCalculator.tsx', import.meta.url), 'utf8');
  assert.match(island, /if \(outDist - whole > 0\.01\) splits\.push/);
  assert.doesNotMatch(island, /whole < 60\) splits\.push/);
  assert.match(island, /first 60/);
});
