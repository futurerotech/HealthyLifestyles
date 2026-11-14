/**
 * Shift Work Health Constraint Explorer (Phase 6 Hypothesis C), non-public prototype.
 *
 * Deterministic, educational arithmetic over the user's own schedule. It does not model
 * anyone's circadian clock and makes no clinical recommendation. The only rules used:
 *  - adults are advised to sleep 7 or more hours per day (AASM/SRS consensus, 2015);
 *  - short naps of about 15–30 minutes before or during night shifts can improve
 *    alertness, with grogginess possible on waking (NIOSH training, citing AASM);
 *  - caffeine taken even 6 hours before bedtime reduced sleep in a lab study
 *    (Drake et al., J Clin Sleep Med 2013).
 * Times are minutes after midnight (0–1439). All computation is local.
 */
export type ShiftKind = 'day' | 'evening' | 'night' | 'custom';
export interface ShiftInput { start: number; end: number; commuteMin: number; windDownMin?: number; getReadyMin?: number }
export interface ShiftPlan {
  leaveHome: number;
  arriveHome: number;
  /** Gap between arriving home and leaving for the next identical shift. */
  restWindowMin: number;
  sleepStart: number;
  sleepEnd: number;
  sleepMin: number;
  /** True when the rest window cannot hold 7 hours of sleep plus wind-down and getting ready. */
  shortRest: boolean;
  overnight: boolean;
  napWindow: { start: number; end: number } | null;
  caffeineCutoff: number;
}

export const DAY = 1440;
export const SLEEP_MIN_ADULT = 7 * 60;
export const SLEEP_TARGET = 8 * 60;
const mod = (m: number) => ((Math.round(m) % DAY) + DAY) % DAY;

/** Does the shift cover any time between midnight and 06:00 (the usual sleeping hours)? */
export function isOvernight(start: number, end: number): boolean {
  const s = mod(start), e = mod(end);
  const covers = (t: number) => (s <= e ? t >= s && t < e : t >= s || t < e);
  for (let t = 0; t < 360; t += 15) if (covers(t)) return true;
  return false;
}

export function planShift(input: ShiftInput): ShiftPlan {
  const commute = Math.max(0, Math.min(240, input.commuteMin));
  const windDown = input.windDownMin ?? 30, getReady = input.getReadyMin ?? 60;
  const start = mod(input.start), end = mod(input.end);
  const shiftLen = mod(end - start) || DAY;
  const leaveHome = mod(start - commute);
  const arriveHome = mod(end + commute);
  // Same shift repeated daily: the time off between arriving home and leaving again.
  const restWindowMin = DAY - shiftLen - 2 * commute;
  const sleepRoom = Math.max(0, restWindowMin - windDown - getReady);
  const sleepMin = Math.min(SLEEP_TARGET, sleepRoom);
  const sleepStart = mod(arriveHome + windDown);
  const sleepEnd = mod(sleepStart + sleepMin);
  const overnight = isOvernight(start, end);
  // Optional pre-shift nap: 20 minutes, ending an hour before leaving (time to shake off grogginess).
  const napWindow = overnight && restWindowMin - sleepMin - windDown - getReady >= 80 ? { start: mod(leaveHome - 80), end: mod(leaveHome - 60) } : null;
  return { leaveHome, arriveHome, restWindowMin, sleepStart, sleepEnd, sleepMin, shortRest: sleepRoom < SLEEP_MIN_ADULT, overnight, napWindow, caffeineCutoff: mod(sleepStart - 6 * 60) };
}

export function parseTime(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  return h < 24 && mi < 60 ? h * 60 + mi : null;
}

export function formatTime(min: number, clock: 12 | 24): string {
  const t = mod(min), h = Math.floor(t / 60), m = t % 60;
  if (clock === 24) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export const formatDuration = (min: number) => `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;

export const PRESETS: Record<Exclude<ShiftKind, 'custom'>, { start: number; end: number }> = {
  day: { start: 7 * 60, end: 15 * 60 },
  evening: { start: 15 * 60, end: 23 * 60 },
  night: { start: 23 * 60, end: 7 * 60 },
};
