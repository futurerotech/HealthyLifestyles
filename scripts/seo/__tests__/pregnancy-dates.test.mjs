import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { addDays, diffDays, pregnancyDating, weeksAndDays, trimesterOf, MAX_GESTATION_DAYS } = await import('../../../src/lib/dates.ts');
const ui = readFileSync(new URL('../../../src/islands/DateCalculator.tsx', import.meta.url), 'utf8');
const today = new Date(2026, 10, 14);

test('weeks/days spans are floor-based, not rounded (11 days was "2 weeks 4 days")', () => {
  assert.equal(weeksAndDays(11), '1 week 4 days');
  assert.equal(weeksAndDays(-11), '1 week 4 days');
  assert.equal(weeksAndDays(7), '1 week 0 days');
  assert.equal(weeksAndDays(0), '0 weeks 0 days');
  assert.equal(weeksAndDays(280), '40 weeks 0 days');
  for (let d = -300; d <= 300; d++) {
    const [w, , dd] = weeksAndDays(d).split(' ');
    assert.equal(Number(w) * 7 + Number(dd), Math.abs(d), String(d));
  }
  assert.doesNotMatch(ui, /Math\.round\(toGo \/ 7\)/);
});

test("Naegele dating: due date is LMP + 280 days; gestational age counts from LMP", () => {
  const lmp = addDays(today, -56);
  const r = pregnancyDating(lmp, today);
  assert.equal(r.status, 'ok');
  assert.equal(r.weeks, 8); assert.equal(r.days, 0);
  assert.equal(diffDays(r.due, lmp), 280);
  assert.equal(r.toGo, 224);
});

test('conception and IVF methods give the standard offsets (266, 263, 261 days)', () => {
  // DateCalculator converts each method to an LMP-equivalent date.
  assert.match(ui, /method === 'conception' \? addDays\(base, -14\)/);
  assert.match(ui, /addDays\(base, -\(14 \+ \(embryo === '3' \? 3 : 5\)\)\)/);
  const base = addDays(today, -30);
  for (const [offset, expected] of [[-14, 266], [-17, 263], [-19, 261]]) {
    const r = pregnancyDating(addDays(base, offset), today);
    assert.equal(diffDays(r.due, base), expected);
  }
});

test('a future date or a pregnancy over 44 weeks gives a check-the-date message, not a result', () => {
  assert.deepEqual(pregnancyDating(addDays(today, 1), today), { status: 'future' });
  assert.equal(pregnancyDating(addDays(today, 0), today).status, 'ok');
  assert.equal(pregnancyDating(addDays(today, -MAX_GESTATION_DAYS), today).status, 'ok');
  assert.equal(pregnancyDating(addDays(today, -MAX_GESTATION_DAYS - 1), today).status, 'too-old');
  assert.equal(pregnancyDating(addDays(today, -800), today).status, 'too-old');
  assert.equal(MAX_GESTATION_DAYS, 308);
  assert.match(ui, /is in the future, so there is no gestational age to show yet/);
  assert.match(ui, /more than 44 weeks, which is very unlikely/);
  assert.match(ui, /contact your OB-GYN or midwife/);
  // Both pregnancy tools use the shared dating function.
  assert.equal((ui.match(/pregnancyDating\(/g) || []).length, 2);
});

test('trimester boundaries: first through 13w6d, second 14–27, third from 28', () => {
  assert.equal(trimesterOf(13), 'First trimester');
  assert.equal(trimesterOf(14), 'Second trimester');
  assert.equal(trimesterOf(27), 'Second trimester');
  assert.equal(trimesterOf(28), 'Third trimester');
});

test('ovulation result warns that calendar estimates do not prevent pregnancy', () => {
  assert.match(ui, /Calendar estimates are not a reliable way to prevent pregnancy\./);
  assert.match(ui, /addDays\(base, c - 14\)/); // ovulation ≈ 14 days before the next period
  assert.match(ui, /const fertileStart = addDays\(ov, -5\)/); // 6-day window ending on ovulation day
});
