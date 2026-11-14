import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { addDays, diffDays, pregnancyDating, weeksAndDays, trimesterOf, MAX_GESTATION_DAYS, dueDateDating, parseDateInput, boundedInt, lastPeriodProblem, toDateInputValue } = await import('../../../src/lib/dates.ts');
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
  const base = addDays(today, -30);
  for (const [method, embryo, expected] of [['lmp', '5', 280], ['conception', '5', 266], ['ivf', '3', 263], ['ivf', '5', 261]]) {
    const r = dueDateDating(method, base, embryo, today);
    assert.equal(r.status, 'ok', method + embryo);
    assert.equal(diffDays(r.due, base), expected, method + embryo);
  }
  assert.match(ui, /dueDateDating\(method as 'lmp' \| 'conception' \| 'ivf', base, embryo === '3' \? '3' : '5', today\)/);
});

test('a future entered date is rejected for every method, before any offset (review #6873310811)', () => {
  const tomorrow = addDays(today, 1);
  for (const [method, embryo] of [['lmp', '5'], ['conception', '5'], ['ivf', '3'], ['ivf', '5']]) {
    assert.deepEqual(dueDateDating(method, tomorrow, embryo, today), { status: 'future' }, method + embryo);
    // Previously conception/IVF dates up to 14–19 days ahead became a past LMP-equivalent.
    assert.deepEqual(dueDateDating(method, addDays(today, 19), embryo, today), { status: 'future' }, method + embryo);
    assert.equal(dueDateDating(method, today, embryo, today).status, method === 'lmp' ? 'ok' : 'ok', method + embryo);
  }
});

test('impossible calendar dates are rejected, including leap years', () => {
  for (const bad of ['2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00', '2026-1-01', '', 'x']) {
    assert.equal(parseDateInput(bad), null, bad);
  }
  for (const good of ['2028-02-29', '2026-02-28', '2026-12-31', '2000-02-29']) {
    assert.equal(toDateInputValue(parseDateInput(good)), good, good);
  }
  assert.equal(parseDateInput('1900-02-29'), null);
});

test('typed cycle and period lengths must be whole numbers within range', () => {
  assert.equal(boundedInt('28', 20, 45), 28);
  assert.equal(boundedInt('20', 20, 45), 20);
  assert.equal(boundedInt('45', 20, 45), 45);
  for (const bad of ['19', '46', '1000', '28.5', '-28', '', ' ', '2e1', 'abc']) assert.equal(boundedInt(bad, 20, 45), null, bad);
  assert.equal(boundedInt(' 30 ', 20, 45), 30);
  assert.match(ui, /boundedInt\(cycle, 20, 45\)/);
  assert.match(ui, /boundedInt\(period, 1, 10\)/);
  assert.doesNotMatch(ui, /intNum\(/);
  assert.match(ui, /must be a whole number from \$\{min\} to \$\{max\} days/);
});

test('a last-period date in the future or over a year ago is rejected by the cycle tools', () => {
  assert.equal(lastPeriodProblem(addDays(today, 1), today), 'future');
  assert.equal(lastPeriodProblem(today, today), null);
  assert.equal(lastPeriodProblem(addDays(today, -365), today), null);
  assert.equal(lastPeriodProblem(addDays(today, -366), today), 'too-old');
  assert.equal((ui.match(/lastPeriodProblem\(base, today\)/g) || []).length, 2);
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
  // Both pregnancy tools use the shared dating functions.
  assert.equal((ui.match(/pregnancyDating\(base, today\)/g) || []).length, 1);
  assert.equal((ui.match(/dueDateDating\(/g) || []).length, 1);
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
