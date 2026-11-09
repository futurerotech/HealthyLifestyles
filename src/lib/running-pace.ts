/**
 * Pure math for the existing Running Pace Calculator. This is a performance
 * projection at constant pace, not a health/fitness or race-readiness assessment.
 */
export type PaceUnit = 'km' | 'mi';
export type PaceMode = 'time' | 'pace' | 'distance';
export const KM_PER_MILE = 1.609344;
export const MAX_SPLIT_CHECKPOINTS = 60;

export type PaceSplit = { mark: number; label: string; time: number };
export type PaceCalculation = {
  valid: boolean;
  outDist: number;
  outTime: number;
  outPace: number;
  speed: number;
  splits: PaceSplit[];
};

export function convertDistance(distance: number, from: PaceUnit, to: PaceUnit): number {
  if (from === to) return distance;
  return from === 'km' ? distance / KM_PER_MILE : distance * KM_PER_MILE;
}
export function convertPaceSeconds(seconds: number, from: PaceUnit, to: PaceUnit): number {
  if (from === to) return seconds;
  return from === 'km' ? seconds * KM_PER_MILE : seconds / KM_PER_MILE;
}
export function parseDistance(value: string): number {
  const s = value.trim();
  if (!/^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(s)) return NaN;
  const v = Number(s);
  return Number.isFinite(v) && v >= 0 ? v : NaN;
}
function parseWhole(value: string, max?: number): number {
  const s = value.trim();
  if (!/^[0-9]+$/.test(s)) return NaN;
  const v = Number(s);
  return Number.isSafeInteger(v) && (max === undefined || v <= max) ? v : NaN;
}
export function parseElapsedSeconds(hours: string, minutes: string, seconds: string): number {
  const h = parseWhole(hours), m = parseWhole(minutes, 59), s = parseWhole(seconds, 59);
  const total = h * 3600 + m * 60 + s;
  return Number.isSafeInteger(total) ? total : NaN;
}
export function parsePaceSeconds(minutes: string, seconds: string): number {
  const m = parseWhole(minutes), s = parseWhole(seconds, 59);
  const total = m * 60 + s;
  return Number.isSafeInteger(total) ? total : NaN;
}
const pad = (v: number): string => String(v).padStart(2, '0');
export function formatHMS(seconds: number): string {
  const sec = Math.max(0, Math.round(seconds));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
}
export function formatMS(seconds: number): string {
  const sec = Math.max(0, Math.round(seconds));
  return Math.floor(sec / 60) + ':' + pad(sec % 60);
}
export function paceInputParts(seconds: number): { minutes: string; seconds: string } {
  const whole = Math.max(0, Math.round(seconds));
  return { minutes: String(Math.floor(whole / 60)), seconds: String(whole % 60) };
}
export function distanceInput(distance: number): string {
  // Exact physical value is held separately while toggling. Round only text.
  return String(Number(distance.toFixed(6)));
}
export function calculateRunningPace(
  mode: PaceMode, unit: PaceUnit, enteredDistance: number,
  elapsedSeconds: number, enteredPaceSeconds: number,
): PaceCalculation {
  let outDist = enteredDistance, outTime = elapsedSeconds, outPace = enteredPaceSeconds;
  const positive = (v: number): boolean => Number.isFinite(v) && v > 0;
  if (mode === 'time') {
    if (!positive(enteredDistance) || !positive(enteredPaceSeconds)) return { valid:false, outDist:0, outTime:0, outPace:0, speed:0, splits:[] };
    outTime = enteredDistance * enteredPaceSeconds;
  } else if (mode === 'pace') {
    if (!positive(enteredDistance) || !positive(elapsedSeconds)) return { valid:false, outDist:0, outTime:0, outPace:0, speed:0, splits:[] };
    outPace = elapsedSeconds / enteredDistance;
  } else {
    if (!positive(elapsedSeconds) || !positive(enteredPaceSeconds)) return { valid:false, outDist:0, outTime:0, outPace:0, speed:0, splits:[] };
    outDist = elapsedSeconds / enteredPaceSeconds;
  }
  if (![outDist,outTime,outPace].every(positive) || outTime > Number.MAX_SAFE_INTEGER) {
    return {valid:false, outDist:0, outTime:0, outPace:0, speed:0, splits:[]};
  }
  const speed = outDist / (outTime / 3600);
  if (!Number.isFinite(speed)) return {valid:false,outDist:0,outTime:0,outPace:0,speed:0,splits:[]};
  const splits: PaceSplit[] = [];
  const whole = Math.min(MAX_SPLIT_CHECKPOINTS,Math.floor(outDist));
  for (let k=1;k<=whole;k++) {
    splits.push({mark:k,label:k+' '+unit,time:k*outPace});
  }
  if (outDist - whole > 1e-9) {
    // Always show finish, including ultradistances >60; avoid rounding away
    // fractional finish markers, which could otherwise duplicate 10.00.
    const finishLabel = Number(outDist.toFixed(6));
    splits.push({mark:outDist,label:finishLabel+' '+unit+' (finish)',time:outTime});
  }
  return {valid:true,outDist,outTime,outPace,speed,splits};
}
