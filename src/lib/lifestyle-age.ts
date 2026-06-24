/**
 * Lifestyle Age Test — pure scoring logic (UI-free, testable).
 *
 * HONEST FRAMING: this is an EDUCATIONAL, lifestyle-based ESTIMATE. It does NOT
 * measure biological age (no telomeres, no epigenetic clock) and is not a
 * medical assessment. It starts at the user's real age and applies modest,
 * clearly-heuristic ± year adjustments based on the *direction* of well-known
 * epidemiological associations (cardiorespiratory fitness, sleep, central
 * adiposity, activity, smoking, alcohol, diet quality, stress). The total swing
 * is capped, the headline is a RANGE, and the tone is "here's what you can
 * change" — never alarmist.
 */

export type Activity = 'sedentary' | 'light' | 'moderate' | 'active';
export type Smoking = 'never' | 'former' | 'current';
export type Stress = 'low' | 'moderate' | 'high' | 'severe';

export interface LifestyleAgeInputs {
  age: number;
  restingHr: number;
  sleepHours: number;
  /** Waist and height in the SAME unit (ratio is unitless). */
  waist: number;
  height: number;
  activity: Activity;
  smoking: Smoking;
  alcoholPerWeek: number;
  fruitVegPerDay: number;
  stress: Stress;
}

export interface FactorResult {
  key: string;
  label: string;
  /** Years added (+) or subtracted (−) by this factor. */
  years: number;
  /** Plain description of the user's current state for this factor. */
  detail: string;
  /** What to do — improve if it's adding years, or keep it up if protective. */
  tip: string;
  /** True when the factor is protective (years ≤ 0). */
  good: boolean;
}

export interface LifestyleAgeResult {
  ok: boolean;
  error?: string;
  realAge: number;
  /** Clamped, rounded central estimate. */
  bodyAge: number;
  /** Headline range bracketing the estimate. */
  low: number;
  high: number;
  /** bodyAge − realAge (negative = younger than real age). */
  deltaYears: number;
  /** Total (clamped) adjustment in years. */
  totalAdjustment: number;
  /** All factors, sorted by impact (largest magnitude first). */
  factors: FactorResult[];
  /** The 3 biggest drivers (by absolute impact). */
  topDrivers: FactorResult[];
}

/** Maximum total +/- swing in years (keeps the estimate conservative). */
export const MAX_SWING = 12;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function fHeart(hr: number): FactorResult {
  let years: number;
  let detail: string;
  let tip: string;
  if (hr < 60) { years = -2; detail = `${hr} bpm — excellent`; tip = 'A low resting heart rate points to strong cardio fitness. Keep it up.'; }
  else if (hr < 70) { years = -0.5; detail = `${hr} bpm — good`; tip = 'Solid. Regular cardio keeps your resting heart rate low.'; }
  else if (hr < 80) { years = 1; detail = `${hr} bpm — average`; tip = 'Regular aerobic exercise can gradually lower your resting heart rate.'; }
  else if (hr < 90) { years = 2; detail = `${hr} bpm — a little high`; tip = 'Building cardio fitness with steady activity tends to lower resting heart rate.'; }
  else { years = 3.5; detail = `${hr} bpm — high`; tip = 'A high resting rate can reflect low fitness or stress; gentle, regular cardio helps most.'; }
  return { key: 'heart', label: 'Resting heart rate', years, detail, tip, good: years <= 0 };
}

function fSleep(h: number): FactorResult {
  let years: number;
  let detail: string;
  let tip: string;
  if (h >= 7 && h <= 9) { years = -1; detail = `${h} h — in the ideal range`; tip = 'Right in the 7–9 hour sweet spot. Protect it.'; }
  else if ((h >= 6 && h < 7) || (h > 9 && h <= 10)) { years = 0.5; detail = `${h} h — just outside ideal`; tip = 'Nudging toward a steady 7–9 hours would help.'; }
  else if (h < 6) { years = 2.5; detail = `${h} h — short sleep`; tip = 'Aim for 7–9 hours; a consistent wind-down routine makes the biggest difference.'; }
  else { years = 1.5; detail = `${h} h — long sleep`; tip = 'Very long sleep can signal poor sleep quality; a steady schedule helps.'; }
  return { key: 'sleep', label: 'Sleep', years, detail, tip, good: years <= 0 };
}

function fWaist(ratio: number): FactorResult {
  let years: number;
  let detail: string;
  let tip: string;
  const pct = `${Math.round(ratio * 100)}% of your height`;
  if (ratio < 0.5) { years = -1.5; detail = `Waist is ${pct} — healthy`; tip = 'Your waist is under half your height — a great metabolic sign.'; }
  else if (ratio < 0.55) { years = 1; detail = `Waist is ${pct} — slightly high`; tip = 'Keeping your waist under half your height lowers metabolic risk.'; }
  else if (ratio < 0.6) { years = 2.5; detail = `Waist is ${pct} — high`; tip = 'Trimming your waistline is one of the most effective changes you can make.'; }
  else { years = 4; detail = `Waist is ${pct} — very high`; tip = 'Reducing waist size meaningfully lowers metabolic risk — small, steady changes add up.'; }
  return { key: 'waist', label: 'Waist-to-height', years, detail, tip, good: years <= 0 };
}

function fActivity(a: Activity): FactorResult {
  const map: Record<Activity, { years: number; detail: string; tip: string }> = {
    sedentary: { years: 3, detail: 'Mostly inactive', tip: 'Even a daily 20–30 min brisk walk improves fitness and longevity markers.' },
    light: { years: 1, detail: 'Lightly active', tip: 'Adding 1–2 structured sessions a week builds on what you do.' },
    moderate: { years: -1.5, detail: 'Moderately active', tip: 'Nicely active — a little vigorous exercise adds extra benefit.' },
    active: { years: -3, detail: 'Very active', tip: 'Excellent activity level — a strong protective factor.' },
  };
  const m = map[a];
  return { key: 'activity', label: 'Activity level', years: m.years, detail: m.detail, tip: m.tip, good: m.years <= 0 };
}

function fSmoking(s: Smoking): FactorResult {
  const map: Record<Smoking, { years: number; detail: string; tip: string }> = {
    never: { years: -0.5, detail: 'Never smoked', tip: 'Not smoking is one of the best things for healthy aging.' },
    former: { years: 1, detail: 'Former smoker', tip: 'Risk keeps falling the longer you stay smoke-free — well done for quitting.' },
    current: { years: 5, detail: 'Current smoker', tip: 'Quitting is the single biggest change you can make; free quit support is widely available.' },
  };
  const m = map[s];
  return { key: 'smoking', label: 'Smoking', years: m.years, detail: m.detail, tip: m.tip, good: m.years <= 0 };
}

function fAlcohol(perWeek: number): FactorResult {
  let years: number;
  let detail: string;
  let tip: string;
  if (perWeek <= 3) { years = -0.5; detail = `${perWeek}/week — light`; tip = 'Low intake is easy on long-term health.'; }
  else if (perWeek <= 7) { years = 0; detail = `${perWeek}/week — moderate`; tip = 'Around the common low-risk guideline; fewer is better still.'; }
  else if (perWeek <= 14) { years = 1.5; detail = `${perWeek}/week — above guidelines`; tip = 'Cutting back toward ≤7 drinks a week reduces long-term risk.'; }
  else { years = 3; detail = `${perWeek}/week — high`; tip = 'Reducing alcohol is a high-impact change — even a few fewer drinks helps.'; }
  return { key: 'alcohol', label: 'Alcohol', years, detail, tip, good: years <= 0 };
}

function fDiet(perDay: number): FactorResult {
  let years: number;
  let detail: string;
  let tip: string;
  if (perDay >= 5) { years = -2; detail = `${perDay} servings/day — great`; tip = 'Hitting 5-a-day is a real protective habit.'; }
  else if (perDay >= 3) { years = -0.5; detail = `${perDay} servings/day — good`; tip = 'Good — pushing toward 5 a day adds more benefit.'; }
  else if (perDay >= 1) { years = 1; detail = `${perDay} servings/day — low`; tip = 'Adding a couple more servings of fruit & veg a day improves diet quality fast.'; }
  else { years = 2; detail = 'No fruit or veg'; tip = 'Even 2–3 servings of fruit & veg a day is an easy, high-impact upgrade.'; }
  return { key: 'diet', label: 'Fruit & veg', years, detail, tip, good: years <= 0 };
}

function fStress(s: Stress): FactorResult {
  const map: Record<Stress, { years: number; detail: string; tip: string }> = {
    low: { years: -1, detail: 'Low stress', tip: 'Low day-to-day stress is protective — keep your routines.' },
    moderate: { years: 0, detail: 'Moderate stress', tip: 'Manageable. Regular wind-down keeps it that way.' },
    high: { years: 2, detail: 'High stress', tip: 'Daily decompression — walks, breathing, screen-free time — buffers stress.' },
    severe: { years: 3.5, detail: 'Very high stress', tip: 'Chronic stress takes a real toll; consider support, and build in daily recovery.' },
  };
  const m = map[s];
  return { key: 'stress', label: 'Stress', years: m.years, detail: m.detail, tip: m.tip, good: m.years <= 0 };
}

export function computeLifestyleAge(i: LifestyleAgeInputs): LifestyleAgeResult {
  const realAge = Math.round(i.age);
  const ratio = i.height > 0 ? i.waist / i.height : 0.5;

  const factors: FactorResult[] = [
    fHeart(Math.round(i.restingHr)),
    fSleep(i.sleepHours),
    fWaist(ratio),
    fActivity(i.activity),
    fSmoking(i.smoking),
    fAlcohol(Math.round(i.alcoholPerWeek)),
    fDiet(Math.round(i.fruitVegPerDay)),
    fStress(i.stress),
  ];

  const rawAdjustment = factors.reduce((s, f) => s + f.years, 0);
  const totalAdjustment = clamp(rawAdjustment, -MAX_SWING, MAX_SWING);
  const bodyAge = clamp(Math.round(realAge + totalAdjustment), 18, 110);
  const low = Math.max(18, bodyAge - 2);
  const high = bodyAge + 2;

  const sorted = [...factors].sort((a, b) => Math.abs(b.years) - Math.abs(a.years));

  return {
    ok: true,
    realAge,
    bodyAge,
    low,
    high,
    deltaYears: bodyAge - realAge,
    totalAdjustment,
    factors: sorted,
    topDrivers: sorted.slice(0, 3),
  };
}
