// Intermittent fasting scheduler: window arithmetic, live phase, safety notice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { PROTOCOLS, computeWindows, liveState, formatCountdown } = await import('../../../src/lib/fasting.ts');

test('every daily protocol adds up to 24 hours', () => {
  for (const p of PROTOCOLS.filter((x) => x.daily)) assert.equal(p.fastH + p.eatH, 24, p.key);
});

test('live phase and countdown across midnight (16:8 eating 12:00–20:00)', () => {
  const w = computeWindows(12 * 60, 8);
  assert.equal(w.eatEndMin, 20 * 60);
  const at = (h: number, m = 0) => liveState(w, h * 3600 + m * 60);
  assert.equal(at(12).phase, 'eating');
  assert.equal(at(19, 59).phase, 'eating');
  assert.equal(at(20).phase, 'fasting');
  assert.equal(at(20).secondsToBoundary, 16 * 3600);
  assert.equal(at(2).phase, 'fasting');
  assert.equal(at(2).secondsToBoundary, 10 * 3600);
  assert.equal(at(11, 59).boundaryMin, 12 * 60);
  // Late window that wraps past midnight (OMAD 23:30–00:30).
  const late = computeWindows(23 * 60 + 30, 1);
  assert.equal(liveState(late, 0).phase, 'eating');
  assert.equal(liveState(late, 0).boundaryMin, 30);
  assert.equal(formatCountdown(3661), '1:01:01');
  assert.equal(formatCountdown(-5), '0:00:00');
});

test('safety notice names the groups who should check first, on every view', () => {
  const ui = readFileSync(new URL('../../../src/islands/Fasting.tsx', import.meta.url), 'utf8');
  for (const g of [/pregnant/, /under 18/, /disordered eating/, /diabetes/, /lowers blood sugar or must be taken with food/]) assert.match(ui, g);
  assert.ok((ui.match(/<Disclaimer \/>/g) || []).length >= 2, 'notice on both the 5:2 and daily views');
});
