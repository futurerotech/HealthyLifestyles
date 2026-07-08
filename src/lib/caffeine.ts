/**
 * Caffeine Curfew & Circadian Rhythm — pure logic (UI-free, testable).
 *
 * Models caffeine clearance with a ~5-hour half-life (first-order decay) to
 * recommend the latest intake time that leaves a low residual (~<50 mg) by
 * bedtime, and derives simple circadian sleep-hygiene anchors (morning light,
 * blue-light cutoff, wind-down). Educational only — individual caffeine
 * metabolism varies widely (genetics, age, smoking, pregnancy, medications).
 */

export const HALF_LIFE_H = 5;
export const RESIDUAL_THRESHOLD_MG = 50;

export interface CaffeineInputs {
  /** Minutes from midnight (0–1439). */
  wakeMin: number;
  bedMin: number;
  doseMg: number;
  age?: number;
}

export interface TimelineEvent {
  key: 'wake' | 'light' | 'caffeine-ok' | 'curfew' | 'screen' | 'winddown' | 'bed';
  label: string;
  detail?: string;
  /** Minutes from the day's wake reference (may exceed 1440 if bedtime is next day). */
  min: number;
}

export interface DecayPoint {
  min: number; // absolute minutes (same reference as events)
  mg: number;
}

export interface CaffeinePlan {
  ok: boolean;
  error?: string;
  wakeMin: number;
  /** Normalized bedtime (next-day bedtimes get +1440). */
  bedMin: number;
  hoursAwake: number;
  doseMg: number;
  /** Recommended latest caffeine intake time (minutes, normalized). */
  curfewMin: number;
  /** Hours before bedtime that the curfew falls. */
  hoursBeforeBed: number;
  /** Estimated residual caffeine (mg) at bedtime if the last dose is at curfew. */
  residualAtBed: number;
  lowDose: boolean;
  curfewBeforeWake: boolean;
  /** Conservative "stop 8–10h before bed" backup window. */
  backupEarlyMin: number; // 10h before
  backupLateMin: number; // 8h before
  morningLightStartMin: number;
  morningLightEndMin: number;
  screenCutoffMin: number;
  windDownMin: number;
  events: TimelineEvent[];
  decay: DecayPoint[];
  slowMetabolizerNote: boolean;
}

const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Residual fraction after `minutes` of first-order decay. */
const residualFraction = (minutes: number) => Math.pow(0.5, minutes / (HALF_LIFE_H * 60));

export function computeCaffeinePlan(input: CaffeineInputs): CaffeinePlan {
  const wakeMin = input.wakeMin;
  // If bedtime is at/earlier than wake, it's the next calendar day.
  let bedMin = input.bedMin;
  if (bedMin <= wakeMin) bedMin += 1440;

  const dose = Math.max(0, input.doseMg);
  const hoursAwake = (bedMin - wakeMin) / 60;

  let hoursBeforeBed: number;
  let lowDose = false;
  if (dose <= RESIDUAL_THRESHOLD_MG) {
    // Even one dose stays under the threshold — timing matters less; use a gentle default.
    lowDose = true;
    hoursBeforeBed = 6;
  } else {
    // residual(bed) = dose * 0.5^(h/HL) <= THRESHOLD  →  h >= HL * log2(dose/THRESHOLD)
    hoursBeforeBed = HALF_LIFE_H * Math.log2(dose / RESIDUAL_THRESHOLD_MG);
  }

  let curfewMin = bedMin - hoursBeforeBed * 60;
  let curfewBeforeWake = false;
  if (curfewMin < wakeMin) {
    curfewMin = wakeMin;
    curfewBeforeWake = true;
    hoursBeforeBed = (bedMin - wakeMin) / 60;
  }

  const residualAtBed = dose * residualFraction(bedMin - curfewMin);

  const morningLightStartMin = wakeMin;
  const morningLightEndMin = wakeMin + 60;
  const screenCutoffMin = bedMin - 90;
  const windDownMin = bedMin - 45;
  const backupEarlyMin = bedMin - 600; // 10h
  const backupLateMin = bedMin - 480; // 8h

  const events: TimelineEvent[] = ([
    { key: 'wake', label: 'Wake up', min: wakeMin },
    { key: 'light', label: 'Morning light', detail: '10–30 min outdoors, within 1 hour of waking', min: wakeMin + 30 },
    { key: 'curfew', label: 'Last caffeine', detail: `about ${round(hoursBeforeBed, 1)} h before bed`, min: curfewMin },
    { key: 'screen', label: 'Screens off', detail: 'dim screens & bright lights', min: screenCutoffMin },
    { key: 'winddown', label: 'Wind down', detail: 'relax, dim the lights', min: windDownMin },
    { key: 'bed', label: 'Bedtime', min: bedMin },
  ] as TimelineEvent[]).sort((a, b) => a.min - b.min);

  // Decay curve from the curfew time through bedtime + 2h.
  const decay: DecayPoint[] = [];
  const end = bedMin + 120;
  for (let t = curfewMin; t <= end; t += 15) {
    decay.push({ min: t, mg: round(dose * residualFraction(t - curfewMin), 1) });
  }

  return {
    ok: true,
    wakeMin,
    bedMin,
    hoursAwake: round(hoursAwake, 1),
    doseMg: dose,
    curfewMin,
    hoursBeforeBed: round(hoursBeforeBed, 1),
    residualAtBed: round(residualAtBed),
    lowDose,
    curfewBeforeWake,
    backupEarlyMin,
    backupLateMin,
    morningLightStartMin,
    morningLightEndMin,
    screenCutoffMin,
    windDownMin,
    events,
    decay,
    slowMetabolizerNote: !!input.age && input.age >= 65,
  };
}

/** Format minutes-from-midnight (may exceed 1440) into a 12-hour clock string. */
export function formatClock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
}

/** Parse an <input type="time"> "HH:MM" string to minutes from midnight. */
export function parseClock(value: string, fallback: number): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return fallback;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return fallback;
  return h * 60 + mm;
}

/** Amount generally considered safe for most healthy adults (FDA). */
export const SAFE_DAILY_CAFFEINE_MG = 400;

/** Common caffeine sources (mg) for quick-select. */
export const CAFFEINE_PRESETS: { label: string; mg: number }[] = [
  { label: 'Espresso shot', mg: 65 },
  { label: 'Cup of coffee', mg: 95 },
  { label: 'Large coffee', mg: 200 },
  { label: 'Cup of tea', mg: 47 },
  { label: 'Energy drink', mg: 80 },
  { label: 'Cola', mg: 40 },
];
