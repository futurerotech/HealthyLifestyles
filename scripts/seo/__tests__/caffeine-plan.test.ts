// Caffeine curfew and tracker: half-life arithmetic and daily-limit messaging.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { computeCaffeinePlan, formatClock, parseClock, SAFE_DAILY_CAFFEINE_MG, PREGNANCY_DAILY_CAFFEINE_MG } = await import('../../../src/lib/caffeine.ts');

test('curfew follows 5 h half-life to ≤50 mg at bedtime', () => {
  const p = computeCaffeinePlan({ wakeMin: 7 * 60, bedMin: 23 * 60, doseMg: 200 });
  assert.equal(p.hoursBeforeBed, 10); // 5 × log2(200/50)
  assert.equal(formatClock(p.curfewMin), '1:00 PM');
  assert.equal(p.residualAtBed, 50);
  const after = computeCaffeinePlan({ wakeMin: 22 * 60, bedMin: 6 * 60, doseMg: 100 }); // night shift, bed next day
  assert.equal(after.bedMin, 6 * 60 + 1440);
  assert.equal(after.hoursBeforeBed, 5);
  assert.equal(computeCaffeinePlan({ wakeMin: 420, bedMin: 1380, doseMg: 40 }).lowDose, true);
  assert.equal(parseClock('25:00', 99), 99);
});

test('a single dose over the FDA 400 mg general amount is flagged', () => {
  assert.equal(SAFE_DAILY_CAFFEINE_MG, 400);
  assert.equal(PREGNANCY_DAILY_CAFFEINE_MG, 200);
  assert.equal(computeCaffeinePlan({ wakeMin: 420, bedMin: 1380, doseMg: 400 }).overDailyLimit, false);
  assert.equal(computeCaffeinePlan({ wakeMin: 420, bedMin: 1380, doseMg: 450 }).overDailyLimit, true);
  const ui = readFileSync(new URL('../../../src/islands/CaffeineCurfew.tsx', import.meta.url), 'utf8');
  assert.match(ui, /plan\.overDailyLimit &&/);
  assert.match(ui, /pregnant, keep caffeine under 200 mg a day/);
});

test('tracker does not call 400 mg a "safe limit" and states the pregnancy limit', () => {
  const ui = readFileSync(new URL('../../../src/islands/CaffeineTracker.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /safe limit/);
  assert.match(ui, /general limit \(healthy adults\)/);
  assert.match(ui, /under \{PREGNANCY_DAILY_CAFFEINE_MG\} mg a day/);
});
