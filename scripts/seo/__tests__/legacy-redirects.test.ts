import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'));
const expected = [
  ['/tools/body-fat-percentage-calculator', '/tools/body-fat-calculator'],
  ['/tools/how-much-protein-do-i-need', '/tools/protein-intake-calculator'],
  ['/articles/how-are-calories-burned-calculated-a-guide-to-energy-expenditure', '/wellness-hub/calories-burned-calculator-guide'],
  ['/articles/how-many-calories-should-i-eat-to-lose-weight', '/wellness-hub/how-many-calories-to-lose-weight'],
  ['/articles/understanding-basal-metabolic-rate-bmr', '/tools/bmr-calculator'],
];

for (const [source, destination] of expected) {
  test(`legacy route ${source} permanently redirects to its relevant canonical resource`, () => {
    const matches = config.redirects.filter((entry: { source: string }) => entry.source === source);
    assert.equal(matches.length, 1, 'Expected exactly one explicit redirect, not a catch-all homepage redirect');
    assert.equal(matches[0].destination, destination);
    assert.equal(matches[0].permanent, true);
    assert.notEqual(source, destination);
    assert.equal(config.redirects.some((entry: { source: string }) => entry.source === destination), false, 'No redirect chains');
  });
}
