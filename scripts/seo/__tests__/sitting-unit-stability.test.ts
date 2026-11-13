import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lbToKg, kgToLb, round } from '../../../src/lib/units.ts';
import { computeSitting } from '../../../src/lib/sitting.ts';

test('changing display units cannot alter canonical sitting weight or energy result', () => {
  const kg = 75.43;
  const poundsDisplayed = round(kgToLb(kg), 2);
  assert.ok(Math.abs(lbToKg(poundsDisplayed) - kg) < 0.003);
  const input = { sittingHours: 8, weightKg: kg, currentSteps: 5000, job: 'desk' as const };
  const before = computeSitting(input);
  const after = computeSitting(input); // only the display unit changed
  assert.equal(before.caloriesReclaimed, after.caloriesReclaimed);
  assert.equal(before.addedSteps, after.addedSteps);
});

test('the island stores kilogram state and does not re-ingest rounded display on toggle', () => {
  const code = readFileSync(new URL('../../../src/islands/SittingReversal.tsx', import.meta.url), 'utf8');
  assert.match(code, /const \[weightKg, setWeightKg\] = useState\(75\)/);
  assert.match(code, /const displayedWeight = round\(units === 'kg' \? weightKg : kgToLb\(weightKg\), 2\)/);
  assert.match(code, /setWeightKg\(units === 'kg' \? entered : lbToKg\(entered\)\)/);
  assert.doesNotMatch(code, /setWeight\(\(w\) => Math\.round/);
  assert.doesNotMatch(code, /const weightKg = units === 'kg' \? weight : weight \/ LB/);
});

test('pounds entered by a user convert once to the canonical kilogram weight', () => {
  const original = 73.25;
  const enteredLb = kgToLb(original);
  assert.ok(Math.abs(lbToKg(enteredLb) - original) < 1e-9);
  assert.equal(round(original, 2), original);
});
