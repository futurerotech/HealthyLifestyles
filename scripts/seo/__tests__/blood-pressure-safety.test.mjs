import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const definitions = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const content = readFileSync(new URL('../../../src/data/heart-content.ts', import.meta.url), 'utf8');

// Execute the existing calculator entry rather than maintaining a duplicate algorithm.
const definitionText = definitions.split("'blood-pressure-checker': {")[1]?.split('// ---- Resting Heart Rate Checker ----')[0];
assert.ok(definitionText, 'Blood Pressure Checker must exist in the original tool definitions');
const executable = definitionText
  .replace('let key: string;', 'let key;')
  .replace("let callout: CalcResult['callout'];", 'let callout;')
  .replace('const cat = cats.find((c) => c.key === key)!;', 'const cat = cats.find((c) => c.key === key);');
const def = vm.runInNewContext(
  "({'blood-pressure-checker': {" + executable + "})['blood-pressure-checker']",
  { fmt: (value, places) => Number(value).toFixed(places) },
  { timeout: 1000 },
);
const evaluate = (systolic, diastolic) => def.compute({ vals: { systolic, diastolic } });
const copy = content.split("'blood-pressure-checker': {")[1]?.split("'hrv-explainer-log': {")[0];
assert.ok(copy, 'Blood Pressure Checker supporting copy must exist');

test('AHA adult categories retain correct OR boundary rules', () => {
  for (const [s, d, label] of [
    [118, 78, 'Normal'], [120, 79, 'Elevated'], [129, 79, 'Elevated'],
    [119, 80, 'High — Stage 1'], [120, 80, 'High — Stage 1'],
    [139, 89, 'High — Stage 1'], [140, 79, 'High — Stage 2'],
    [139, 90, 'High — Stage 2'], [180, 120, 'High — Stage 2'],
    [181, 75, 'Severe hypertension'], [180, 121, 'Severe hypertension'],
  ]) {
    assert.equal(evaluate(s, d).category.label, label, s + '/' + d);
  }
});

test('severely elevated reading distinguishes danger symptoms from one-minute recheck', () => {
  const { category, callout } = evaluate(185, 75);
  assert.equal(category.label, 'Severe hypertension');
  assert.equal(callout.tone, 'danger');
  assert.match(callout.text, /call emergency services immediately/i);
  assert.match(callout.text, /do not wait to recheck/i);
  assert.match(callout.text, /at least 1 minute/i);
  assert.match(callout.text, /contact your healthcare professional promptly/i);
  assert.doesNotMatch(callout.text, /wait 5 minutes|hypertensive crisis/i);
});

test('implausibly reversed numbers give a warning without hiding urgent guidance', () => {
  const severe = evaluate(70, 160);
  assert.equal(severe.category.label, 'Severe hypertension');
  assert.equal(severe.callout.tone, 'danger');
  assert.match(severe.callout.text, /systolic.*higher than diastolic/i);
  assert.match(severe.callout.text, /call emergency services immediately/i);
  assert.ok(
    severe.callout.text.indexOf('call emergency services immediately') <
      severe.callout.text.indexOf('Check the numbers entered'),
    'Emergency advice must appear before a reversed-input warning',
  );
  const notSevere = evaluate(75, 80);
  assert.equal(notSevere.callout.tone, 'warn');
  assert.match(notSevere.callout.text, /numbers entered/i);
  assert.equal(evaluate(118, 78).callout, undefined);
});

test('pregnancy and postpartum 160/110 OR thresholds warn urgently without changing adult category', () => {
  for (const [s, d] of [[160, 70], [159, 110], [160, 110]]) {
    const result = evaluate(s, d);
    assert.equal(result.category.label, 'High — Stage 2', s + '/' + d);
    assert.equal(result.callout.tone, 'danger', s + '/' + d);
    assert.match(result.callout.text, /Pregnant or within 6 weeks after childbirth/i);
    assert.match(result.callout.text, /160 or higher OR a diastolic reading of 110 or higher/i);
    assert.match(result.callout.text, /urgent obstetric or emergency medical assessment/i);
  }
  assert.match(evaluate(118, 78).note, /General AHA adult categories.*not a pregnancy\/postpartum risk assessment/i);
  assert.match(evaluate(118, 78).note, /Severe headache, vision changes/i);
});

test('pregnancy and postpartum 140/90 OR thresholds prompt obstetric contact', () => {
  for (const [s, d] of [[140, 70], [139, 90]]) {
    const { category, callout } = evaluate(s, d);
    assert.equal(category.label, 'High — Stage 2');
    assert.equal(callout.tone, 'warn');
    assert.match(callout.text, /call your obstetric care team right away/i);
  }
  assert.doesNotMatch(evaluate(118, 78).primaryValue, /pregnant/i);
});

test('pregnancy-specific visible page notice, FAQ and authoritative references stay aligned', () => {
  assert.match(copy, /General adult categories only.*pregnancy or postpartum risk assessment/i);
  assert.match(copy, /Pregnancy and the first six weeks after childbirth/);
  assert.match(copy, /systolic blood pressure of 160 mmHg or higher OR diastolic pressure of 110 mmHg or higher/);
  assert.match(copy, /Postpartum preeclampsia can begin after delivery/);
  assert.match(copy, /Do these blood pressure categories apply during pregnancy or postpartum\?/);
  for (const ref of ['ACOG_PREGNANCY_BP', 'ACOG_POSTPARTUM_BP', 'CDC_PREGNANCY_BP']) {
    assert.ok(copy.includes(ref), ref + ' must be listed as a source');
    assert.ok(content.includes('const ' + ref + ': Source'), ref + ' must exist');
  }
});

test('published copy and sources mirror the safer AHA guidance', () => {
  assert.match(copy, /Severe hypertension:/);
  assert.match(copy, /wait at least one minute/i);
  assert.match(copy, /call emergency services immediately/i);
  assert.doesNotMatch(copy, /Hypertensive crisis|Wait five minutes|a medical emergency, especially/i);
  assert.match(content, /2025 High Blood Pressure Guideline/);
  assert.doesNotMatch(content, /2017 ACC\/AHA Guideline/);
});
