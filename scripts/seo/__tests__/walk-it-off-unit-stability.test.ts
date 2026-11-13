import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { minutesToBurn, weightForDisplay, weightToKg } from '../../../src/lib/walk-it-off.ts';

test('changing displayed weight units does not change canonical weight or estimated minutes', () => {
  const kg = 70;
  const initialMinutes = minutesToBurn(285, 3.8, kg);
  assert.equal(weightForDisplay(kg, 'kg'), 70);
  assert.equal(weightForDisplay(kg, 'lb'), 154.32);
  assert.equal(minutesToBurn(285, 3.8, kg), initialMinutes);
  // An in-place unit toggle must not re-ingest the rounded displayed number.
  const island = readFileSync(new URL('../../../src/islands/WalkItOff.tsx', import.meta.url), 'utf8');
  assert.match(island, /const \[weightKg, setWeightKg\] = useState\(70\)/);
  assert.match(island, /value=\{weightForDisplay\(weightKg, units\)\}/);
  assert.doesNotMatch(island, /setWeight\(\(w\) => Math\.round/);
});

test('entered pounds convert once to kilograms and preserve activity formula', () => {
  const kg = weightToKg(154.32, 'lb');
  assert.ok(Math.abs(kg - 70) < 0.01);
  assert.equal(weightToKg(70, 'kg'), 70);
  assert.ok(Math.abs(minutesToBurn(285, 3.8, kg) - minutesToBurn(285, 3.8, 70)) < 0.01);
});

test('unit display rounds for readability, not for storage or computation', () => {
  const kg = 72.35;
  const displayedLb = weightForDisplay(kg, 'lb');
  assert.ok(Number.isFinite(displayedLb));
  assert.notEqual(displayedLb, kg);
  assert.equal(weightForDisplay(kg, 'kg'), kg);
  assert.ok(Math.abs(weightToKg(displayedLb, 'lb') - kg) < 0.005);
});
