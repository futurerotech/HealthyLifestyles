/**
 * Intermittent Fasting Scheduler — pure logic (UI-free). Window protocols
 * compute an eating window and fasting window from an eating-start time; the
 * live countdown is derived in the island from the current time. 5:2 is a
 * calorie-restriction pattern (no daily window), handled as info.
 * Educational only — fasting isn't right for everyone.
 */

export type ProtocolKey = '16:8' | '18:6' | '20:4' | 'omad' | '14:10' | '5:2';

export interface Protocol {
  key: ProtocolKey;
  label: string;
  fastH: number;
  eatH: number;
  daily: boolean;
  desc: string;
}

export const PROTOCOLS: Protocol[] = [
  { key: '14:10', label: '14:10 (gentle)', fastH: 14, eatH: 10, daily: true, desc: 'Fast 14 hours, eat within 10 — an easy starting point.' },
  { key: '16:8', label: '16:8', fastH: 16, eatH: 8, daily: true, desc: 'Fast 16 hours, eat within an 8-hour window — the most popular protocol.' },
  { key: '18:6', label: '18:6', fastH: 18, eatH: 6, daily: true, desc: 'Fast 18 hours, eat within 6 hours.' },
  { key: '20:4', label: '20:4 (Warrior)', fastH: 20, eatH: 4, daily: true, desc: 'Fast 20 hours, eat within a 4-hour window.' },
  { key: 'omad', label: 'OMAD', fastH: 23, eatH: 1, daily: true, desc: 'One meal a day — a single ~1-hour eating window.' },
  { key: '5:2', label: '5:2', fastH: 0, eatH: 0, daily: false, desc: 'Eat normally 5 days a week; on 2 non-consecutive days, limit to about 500 (women) / 600 (men) calories.' },
];

export const getProtocol = (key: ProtocolKey): Protocol =>
  PROTOCOLS.find((p) => p.key === key) ?? PROTOCOLS[1];

export interface FastingWindows {
  eatStartMin: number;
  eatEndMin: number; // may exceed 1440 (next day)
  eatH: number;
  fastH: number;
}

export function computeWindows(eatStartMin: number, eatH: number): FastingWindows {
  return {
    eatStartMin,
    eatEndMin: eatStartMin + eatH * 60,
    eatH,
    fastH: 24 - eatH,
  };
}

export type Phase = 'eating' | 'fasting';

export interface LiveState {
  phase: Phase;
  /** Seconds until the current phase ends. */
  secondsToBoundary: number;
  /** Fraction of the current phase elapsed (0–1). */
  progress: number;
  boundaryMin: number; // minute-of-day the current phase ends
}

/**
 * Given the eating window and the current time (seconds since midnight),
 * return whether we're eating or fasting and the countdown to the next flip.
 */
export function liveState(w: FastingWindows, nowSeconds: number): LiveState {
  const eatStartS = w.eatStartMin * 60;
  const eatLenS = w.eatH * 3600;
  const daySec = 86400;
  // Seconds since the eating window started (wrapped to a day).
  const sinceStart = ((nowSeconds - eatStartS) % daySec + daySec) % daySec;
  if (sinceStart < eatLenS) {
    const remain = eatLenS - sinceStart;
    return {
      phase: 'eating',
      secondsToBoundary: remain,
      progress: sinceStart / eatLenS,
      boundaryMin: (w.eatStartMin + w.eatH * 60) % 1440,
    };
  }
  const fastLenS = daySec - eatLenS;
  const sinceFast = sinceStart - eatLenS;
  const remain = fastLenS - sinceFast;
  return {
    phase: 'fasting',
    secondsToBoundary: remain,
    progress: sinceFast / fastLenS,
    boundaryMin: w.eatStartMin % 1440,
  };
}

/** Format seconds as H:MM:SS. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
