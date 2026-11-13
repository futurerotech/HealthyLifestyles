/**
 * Sitting Disease Reversal — pure logic (UI-free, testable).
 *
 * Offers optional short-movement and daily-step ideas based on reported sitting.
 * The planned cadence and step increments are unvalidated heuristics, not a
 * medical risk score or a guaranteed way to reverse sedentary-health effects.
 * Legacy calorie fields contain approximate GROSS MET energy; steps may occur
 * during movement breaks, so adding both estimates can DOUBLE-COUNT activity.
 */

export type JobType = 'desk' | 'mixed' | 'active' | '';

export interface SittingInputs {
  sittingHours: number;
  weightKg: number;
  currentSteps: number;
  job: JobType;
}

export interface SittingResult {
  ok: boolean;
  sittingHours: number;
  weightKg: number;
  currentSteps: number;
  // Micro-breaks
  breakIntervalMin: number;
  breakDurationMin: number;
  breaksPerDay: number;
  movementMinutes: number;
  // NEAT steps
  addedSteps: number;
  newDailySteps: number;
  // Calories
  walkMinutes: number;
  kcalSteps: number;
  kcalBreaks: number;
  caloriesReclaimed: number;
  caloriesWeekly: number;
  // Context
  sittingLevel: 'moderate' | 'high' | 'very high';
  sittingNote: string;
  ideas: string[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const BREAK_INTERVAL_MIN = 45; // move roughly every 30–60 min (use the midpoint)
const BREAK_DURATION_MIN = 3; // ~2–5 min on your feet
const CADENCE_SPM = 100; // assumed casual walking cadence (steps/min)
const WALK_MET = 3.0; // light walking
const BREAK_MET = 2.0; // standing / light movement

const DESK_IDEAS = [
  'Take walking phone/video calls instead of sitting for them.',
  'Do 10 sit-to-stands from your chair each break.',
  'Park the printer, bin, or water far enough away to force a walk.',
  'Calf raises or desk push-ups while you wait for things to load.',
  'Use the stairs and add a lap of the floor on every bathroom trip.',
  'Set an hourly reminder to stand, roll your shoulders, and stretch your hips.',
];

export function computeSitting(input: SittingInputs): SittingResult {
  const sittingHours = clamp(input.sittingHours, 0, 18);
  const weightKg = Math.max(1, input.weightKg);
  const currentSteps = Math.max(0, Math.round(input.currentSteps));

  // Micro-breaks across the sitting day.
  const breaksPerDay = Math.max(0, Math.round((sittingHours * 60) / BREAK_INTERVAL_MIN));
  const movementMinutes = breaksPerDay * BREAK_DURATION_MIN;

  // Extra NEAT steps: scales with sitting time, bounded to the ~3,000–4,500 range.
  // No sitting time entered means no sitting-related target is warranted.
  // Preserve the original optional planning heuristic for positive inputs.
  const addedSteps = sittingHours === 0 ? 0 : Math.round(clamp(2500 + sittingHours * 200, 3000, 4500) / 100) * 100;
  const newDailySteps = currentSteps + addedSteps;

  // Legacy estimated gross activity energy: includes rest, and summed movements may overlap.
  const walkMinutes = Math.round(addedSteps / CADENCE_SPM);
  const kcalSteps = Math.round((WALK_MET * weightKg * walkMinutes) / 60);
  const kcalBreaks = Math.round((BREAK_MET * weightKg * movementMinutes) / 60);
  const caloriesReclaimed = kcalSteps + kcalBreaks;
  const caloriesWeekly = caloriesReclaimed * 7;

  // Sitting level (qualitative, non-alarmist).
  let sittingLevel: SittingResult['sittingLevel'];
  let sittingNote: string;
  if (sittingHours === 0) {
    sittingLevel = 'moderate';
    sittingNote = 'No sitting hours entered, so no added-step or movement-break target is calculated. This tool is not a health-risk score.';
  } else if (sittingHours < 6) {
    sittingLevel = 'moderate';
    sittingNote = `You entered ${sittingHours} hours of sitting. These are optional movement ideas, not a validated health-risk category.`;
  } else if (sittingHours < 9) {
    sittingLevel = 'high';
    sittingNote = `You entered ${sittingHours} hours of sitting. Consider feasible movement breaks; no precise safe-hour threshold is established.`;
  } else {
    sittingLevel = 'very high';
    sittingNote = `You entered ${sittingHours} hours of sitting. Consider moving more and sitting less where feasible; this is not a clinical risk score.`;
  }

  // Pick 3 movement ideas (rotate the start point by sitting hours for variety).
  const start = Math.floor(sittingHours) % DESK_IDEAS.length;
  const ideas = [0, 1, 2].map((i) => DESK_IDEAS[(start + i) % DESK_IDEAS.length]);

  return {
    ok: true,
    sittingHours,
    weightKg,
    currentSteps,
    breakIntervalMin: BREAK_INTERVAL_MIN,
    breakDurationMin: BREAK_DURATION_MIN,
    breaksPerDay,
    movementMinutes,
    addedSteps,
    newDailySteps,
    walkMinutes,
    kcalSteps,
    kcalBreaks,
    caloriesReclaimed,
    caloriesWeekly,
    sittingLevel,
    sittingNote,
    ideas,
  };
}
