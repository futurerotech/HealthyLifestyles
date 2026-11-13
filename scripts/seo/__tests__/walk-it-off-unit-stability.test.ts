import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FOODS, minutesToBurn, validWalkInputs, weightForDisplay, weightToKg } from '../../../src/lib/walk-it-off.ts';

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


test('above-rest MET time excludes the one-MET baseline', () => {
  const walking = minutesToBurn(285, 3.8, 70);
  const running = minutesToBurn(285, 9.8, 70);
  assert.equal(Math.round(walking), 87);
  assert.equal(Math.round(running), 28);
  assert.ok(walking > 285 / (3.8 * 70) * 60);
});

test('invalid weight and intensity cannot produce a misleading zero-minute estimate', () => {
  assert.equal(validWalkInputs(285, 0), false);
  assert.equal(validWalkInputs(3001, 70), false);
  assert.equal(validWalkInputs(-1, 70), false);
  assert.equal(validWalkInputs(300, 70), true);
  assert.equal(Number.isNaN(minutesToBurn(285, 3.8, 0)), true);
  assert.equal(Number.isNaN(minutesToBurn(285, 1, 70)), true);
  assert.equal(Number.isNaN(minutesToBurn(-2, 3.8, 70)), true);
});

test('the visible result and share control fail closed on invalid inputs', () => {
  const island = readFileSync(new URL('../../../src/islands/WalkItOff.tsx', import.meta.url), 'utf8');
  assert.match(island, /validInputs = validWalkInputs\(kcal, weightKg\)/);
  assert.match(island, /disabled=\{!validInputs\}/);
  assert.match(island, /\{validInputs && <div class="wo__activities">/);
  assert.match(island, /above-rest energy/i);
});


test('food illustrations match their labeled food instead of misleading emoji', () => {
  const banana = FOODS.find((food) => food.name === 'Banana');
  assert.equal(banana?.emoji, '🍌');
});
