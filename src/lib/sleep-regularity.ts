/**
 * Sleep timing consistency (Phase 5 Candidate 4) — pure logic, UI-free, testable.
 *
 * From up to 7 nights of bedtime and wake time, reports how much bedtime, wake time and
 * the sleep midpoint vary from night to night (standard deviation in minutes) and the
 * shift in sleep midpoint between weekend nights (Sat, Sun) and weekdays. Clock times are
 * circular, so each series is centred on its circular mean before the spread is measured
 * (23:30 and 00:30 are 60 minutes apart, not 23 hours). Descriptive only: no score, no
 * diagnosis. Nothing is stored or sent.
 */
import { parseTime } from './time';

const DAY = 1440;

export interface NightTimes { bed: string; wake: string; }

export interface RegularityResult {
  nights: number;
  /** Mean sleep duration from the entered times, hours. */
  meanDuration: number;
  bedSd: number;
  wakeSd: number;
  midSd: number;
  /** Weekend minus weekday midpoint, minutes (positive = later on weekends); null without both. */
  weekendShift: number | null;
  /** Nights whose duration from the entered times is under 3 h or over 14 h (likely an entry error). */
  implausible: number[];
}

/** Circular mean of clock minutes (0–1439). */
export function circularMean(mins: number[]): number {
  let s = 0, c = 0;
  for (const m of mins) { const a = (m / DAY) * 2 * Math.PI; s += Math.sin(a); c += Math.cos(a); }
  const ang = Math.atan2(s / mins.length, c / mins.length);
  return (((ang / (2 * Math.PI)) * DAY) % DAY + DAY) % DAY;
}

/** Signed minutes from `ref` to `m` on the clock, in (-720, 720]. */
export function clockDiff(m: number, ref: number): number {
  let d = (m - ref) % DAY;
  if (d > DAY / 2) d -= DAY;
  if (d <= -DAY / 2) d += DAY;
  return d;
}

function spread(mins: number[]): number {
  if (mins.length < 2) return 0;
  const mu = circularMean(mins);
  const ds = mins.map((m) => clockDiff(m, mu));
  const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
  const v = ds.reduce((a, d) => a + (d - mean) ** 2, 0) / ds.length;
  return Math.sqrt(v);
}

/** dayIndex 0 = Mon … 6 = Sun; the night is labeled by the day it starts. Fri and Sat nights precede free days. */
export function sleepRegularity(nights: (NightTimes | null)[]): RegularityResult | null {
  const rows: { i: number; bed: number; wake: number; dur: number; mid: number }[] = [];
  nights.forEach((n, i) => {
    if (!n) return;
    const bed = parseTime(n.bed), wake = parseTime(n.wake);
    if (bed === null || wake === null) return;
    const dur = ((wake - bed) % DAY + DAY) % DAY;
    rows.push({ i, bed, wake, dur, mid: (bed + dur / 2) % DAY });
  });
  if (rows.length < 3) return null;
  const implausible = rows.filter((r) => r.dur < 180 || r.dur > 840).map((r) => r.i);
  const free = rows.filter((r) => r.i === 4 || r.i === 5);
  const work = rows.filter((r) => r.i !== 4 && r.i !== 5);
  let weekendShift: number | null = null;
  if (free.length && work.length) {
    weekendShift = Math.round(clockDiff(circularMean(free.map((r) => r.mid)), circularMean(work.map((r) => r.mid))));
  }
  return {
    nights: rows.length,
    meanDuration: rows.reduce((a, r) => a + r.dur, 0) / rows.length / 60,
    bedSd: Math.round(spread(rows.map((r) => r.bed))),
    wakeSd: Math.round(spread(rows.map((r) => r.wake))),
    midSd: Math.round(spread(rows.map((r) => r.mid))),
    weekendShift,
    implausible,
  };
}
