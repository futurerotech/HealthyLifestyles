/**
 * Realistic Weight-Loss Timeline — pure logic (UI-free). Projects a date from a
 * chosen weekly pace, but CAPS the pace at ~1% of body weight per week so it
 * never produces a crash-diet plan. Linear estimate; real loss slows over time.
 */

export interface WeightTimelineInputs {
  currentKg: number;
  goalKg: number;
  weeklyRateKg: number;
}

export interface TimelinePoint {
  week: number;
  weightKg: number;
}
export interface Milestone {
  label: string;
  weightKg: number;
  week: number;
}

export interface WeightTimelineResult {
  ok: boolean;
  isGain: boolean;
  currentKg: number;
  goalKg: number;
  toLoseKg: number;
  requestedRateKg: number;
  effectiveRateKg: number;
  safeMaxKg: number;
  tooFast: boolean;
  weeks: number;
  points: TimelinePoint[];
  milestones: Milestone[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeWeightTimeline(i: WeightTimelineInputs): WeightTimelineResult {
  const currentKg = Math.max(1, i.currentKg);
  const goalKg = Math.max(0, i.goalKg);
  const safeMaxKg = round1(currentKg * 0.01); // ~1% of body weight/week

  if (goalKg >= currentKg) {
    return {
      ok: true, isGain: true, currentKg, goalKg, toLoseKg: 0,
      requestedRateKg: i.weeklyRateKg, effectiveRateKg: 0, safeMaxKg, tooFast: false,
      weeks: 0, points: [], milestones: [],
    };
  }

  const toLoseKg = currentKg - goalKg;
  const requested = Math.max(0.05, i.weeklyRateKg);
  const tooFast = requested > safeMaxKg;
  const effectiveRateKg = Math.min(requested, safeMaxKg);
  const weeks = Math.max(1, Math.ceil(toLoseKg / effectiveRateKg));

  // Chart points (cap sample count for readability).
  const points: TimelinePoint[] = [];
  const sampleCount = Math.min(weeks, 16);
  for (let s = 0; s <= sampleCount; s++) {
    const week = Math.round((s / sampleCount) * weeks);
    const weightKg = Math.max(goalKg, round1(currentKg - effectiveRateKg * week));
    points.push({ week, weightKg });
  }
  points[points.length - 1] = { week: weeks, weightKg: goalKg };

  // Milestones.
  const milestones: Milestone[] = [];
  const weekFor = (lossKg: number) => Math.ceil(lossKg / effectiveRateKg);
  const fivePct = currentKg * 0.05;
  if (toLoseKg >= fivePct) {
    milestones.push({ label: 'First 5% lost — real health benefits', weightKg: round1(currentKg - fivePct), week: weekFor(fivePct) });
  }
  if (toLoseKg >= 2 * effectiveRateKg) {
    milestones.push({ label: 'Halfway there', weightKg: round1(currentKg - toLoseKg / 2), week: weekFor(toLoseKg / 2) });
  }
  milestones.push({ label: 'Goal reached 🎯', weightKg: round1(goalKg), week: weeks });

  return {
    ok: true, isGain: false, currentKg, goalKg, toLoseKg: round1(toLoseKg),
    requestedRateKg: requested, effectiveRateKg, safeMaxKg, tooFast,
    weeks, points, milestones,
  };
}

/** Add `weeks` weeks to a base date; return a friendly date string. */
export function projectDate(base: Date, weeks: number): string {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
