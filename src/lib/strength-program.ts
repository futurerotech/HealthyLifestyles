/**
 * Periodized Strength Program Builder — pure logic (UI-free, testable).
 *
 * Turns a user's 1RM per lift into a 4-week progressive-overload block with
 * exact working weights, warm-up ramps, rest guidance, and a weekly schedule.
 * Intensities follow the brief (strength 80→82→85% + deload; hypertrophy
 * 65→70→72% + deload) and are capped lower for beginners. Educational only.
 */

export type Goal = 'strength' | 'hypertrophy';
export type Experience = 'beginner' | 'intermediate';
export type Units = 'kg' | 'lb';
export type LiftKey = 'squat' | 'bench' | 'deadlift' | 'ohp' | 'row';

export const LIFT_NAMES: Record<LiftKey, string> = {
  squat: 'Back Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
  ohp: 'Overhead Press',
  row: 'Barbell Row',
};

/** Lift order used for the schedule + display. */
export const LIFT_ORDER: LiftKey[] = ['squat', 'bench', 'deadlift', 'ohp', 'row'];

export interface LiftInput {
  key: LiftKey;
  oneRm: number; // in the active unit
}

export interface ProgramInputs {
  lifts: LiftInput[];
  daysPerWeek: number; // 2–5
  experience: Experience;
  goal: Goal;
  units: Units;
}

export interface WeekRx {
  week: number;
  label: string;
  sets: number;
  reps: string;
  percent: number;
  weight: number;
  deload: boolean;
}

export interface WarmupSet {
  label: string;
  weight: number;
}

export interface LiftProgram {
  key: LiftKey;
  name: string;
  oneRm: number;
  weeks: WeekRx[];
  warmups: WarmupSet[];
  /** Top working-set weight per week (for the progression chart). */
  topWeights: number[];
}

export interface DaySchedule {
  day: number;
  lifts: LiftKey[];
}

export interface Program {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  units: Units;
  lifts: LiftProgram[];
  schedule: DaySchedule[];
  restGuidance: string;
  warmupNote: string;
}

interface Scheme {
  sets: number;
  reps: string;
  percent: number;
  deload?: boolean;
}

// 4-week schemes. Intermediate matches the brief; beginner is capped lower
// (lower %, fewer sets) for safety.
const SCHEMES: Record<Goal, Record<Experience, Scheme[]>> = {
  strength: {
    intermediate: [
      { sets: 4, reps: '5', percent: 80 },
      { sets: 4, reps: '4', percent: 82 },
      { sets: 5, reps: '3', percent: 85 },
      { sets: 3, reps: '5', percent: 65, deload: true },
    ],
    beginner: [
      { sets: 3, reps: '5', percent: 75 },
      { sets: 3, reps: '5', percent: 77 },
      { sets: 4, reps: '4', percent: 80 },
      { sets: 2, reps: '5', percent: 60, deload: true },
    ],
  },
  hypertrophy: {
    intermediate: [
      { sets: 4, reps: '10', percent: 65 },
      { sets: 4, reps: '9', percent: 70 },
      { sets: 4, reps: '8', percent: 72 },
      { sets: 2, reps: '10', percent: 55, deload: true },
    ],
    beginner: [
      { sets: 3, reps: '12', percent: 60 },
      { sets: 3, reps: '10', percent: 65 },
      { sets: 3, reps: '10', percent: 67 },
      { sets: 2, reps: '10', percent: 50, deload: true },
    ],
  },
};

const increment = (units: Units): number => (units === 'kg' ? 2.5 : 5);
const barWeight = (units: Units): number => (units === 'kg' ? 20 : 45);

/** Round to the nearest loadable increment (2.5 kg / 5 lb). */
export function roundToIncrement(weight: number, units: Units): number {
  const inc = increment(units);
  return Math.round(weight / inc) * inc;
}

function buildLift(input: LiftInput, goal: Goal, experience: Experience, units: Units): LiftProgram {
  const scheme = SCHEMES[goal][experience];
  const weeks: WeekRx[] = scheme.map((s, i) => ({
    week: i + 1,
    label: s.deload ? 'Deload' : `Week ${i + 1}`,
    sets: s.sets,
    reps: s.reps,
    percent: s.percent,
    weight: roundToIncrement((s.percent / 100) * input.oneRm, units),
    deload: !!s.deload,
  }));

  // Warm-up ramp based on the first working week's weight.
  const w1 = weeks[0].weight;
  const bar = barWeight(units);
  const warmups: WarmupSet[] = [
    { label: 'Empty bar × 8', weight: bar },
    { label: '~50% × 5', weight: roundToIncrement(0.5 * w1, units) },
    { label: '~70% × 3', weight: roundToIncrement(0.7 * w1, units) },
    { label: '~90% × 1', weight: roundToIncrement(0.9 * w1, units) },
  ].filter((wu, idx) => idx === 0 || wu.weight > bar); // drop warm-ups lighter than the bar

  return {
    key: input.key,
    name: LIFT_NAMES[input.key],
    oneRm: input.oneRm,
    weeks,
    warmups,
    topWeights: weeks.map((w) => w.weight),
  };
}

/** Distribute the selected lifts across the training days (round-robin, big
 *  lifts repeated to fill extra days). */
export function buildSchedule(lifts: LiftKey[], daysPerWeek: number): DaySchedule[] {
  const days: LiftKey[][] = Array.from({ length: daysPerWeek }, () => []);
  lifts.forEach((lift, i) => days[i % daysPerWeek].push(lift));
  // Fill any day left empty (when days > lifts) by repeating the priority lifts.
  const priority: LiftKey[] = ['squat', 'bench', 'deadlift', 'ohp', 'row'].filter((l) =>
    lifts.includes(l as LiftKey),
  ) as LiftKey[];
  let p = 0;
  for (const d of days) {
    if (d.length === 0 && priority.length) {
      d.push(priority[p % priority.length]);
      p++;
    }
  }
  return days.map((l, i) => ({ day: i + 1, lifts: l }));
}

export function buildProgram(inputs: ProgramInputs): Program {
  const lifts = inputs.lifts
    .filter((l) => l.oneRm > 0)
    .map((l) => buildLift(l, inputs.goal, inputs.experience, inputs.units));

  const schedule = buildSchedule(lifts.map((l) => l.key), inputs.daysPerWeek);

  const restGuidance =
    inputs.goal === 'strength'
      ? 'Rest 2–3 minutes between working sets so each set is fresh and safe.'
      : 'Rest 60–90 seconds between working sets to keep the muscle under tension.';

  const warmupNote =
    'Always warm up: a few minutes of light cardio, then ramp to your working weight using the warm-up sets shown. As your working weight rises through the block, scale the warm-up weights up too.';

  return {
    goal: inputs.goal,
    experience: inputs.experience,
    daysPerWeek: inputs.daysPerWeek,
    units: inputs.units,
    lifts,
    schedule,
    restGuidance,
    warmupNote,
  };
}
