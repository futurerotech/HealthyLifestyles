import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const content = readFileSync(new URL('../../../src/data/nutrition-content.ts', import.meta.url), 'utf8');
const calculator = defs.split("'vitamin-d-sun-calculator': {")[1].split('// ---- Gut Health Score')[0];
const article = content.split("'vitamin-d-sun-calculator': {")[1].split("'gut-health-score': {")[0];

test('sun exposure copy does not prescribe unprotected minutes or delayed sunscreen', () => {
  for (const text of [calculator, article]) {
    assert.doesNotMatch(text, /(?:10[–-]30|10[–-]15|few) minutes?[^.]*unprotected|unprotected exposure before applying|apply SPF 30\+ after|after your short exposure/i);
    assert.match(text, /protect(?:ion|ive|ing) (?:your )?skin|sun protection/i);
  }
});

test('no vitamin D adequacy or reassuring UV exposure score is computed', () => {
  assert.match(calculator, /selectDefault: 'spf30'/);
  assert.doesNotMatch(calculator, /label: 'Good'|label: 'Meets target'|label: 'Above target'/);
  assert.doesNotMatch(calculator, /SCREEN_PTS|SKIN_PTS|ageAdj|gaugeVal|kind: 'gauge'/);
  assert.match(calculator, /visual: \{ kind: 'none' \}/);
  assert.match(calculator, /sunscreen === 'none' \|\| sunscreen === 'after'/);
  assert.match(calculator, /Do not delay (?:sun )?protection/);
});

test('dietary copy does not prescribe a blanket supplement dose or equate score with deficiency', () => {
  assert.doesNotMatch(article, /1,000[–-]2,000 IU|3[–-]6 times more sun exposure|low, moderate, or good chance of adequate vitamin D/i);
  assert.match(article, /25\(OH\)D/);
});
