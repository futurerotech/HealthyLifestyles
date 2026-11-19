/** Pure validation and observations for the local food/symptom diary (no network/storage). */
export interface DiaryEntry {
  id: string;
  datetime: string; // local wall-clock YYYY-MM-DDTHH:mm; no timezone recorded
  foods: string;
  symptoms: string[];
  severity: number; // 0 when no symptom, otherwise 1..5
  notes: string;
}
export interface DiaryPattern { food: string; symptom: string; count: number }
export const MAX_FOODS_LENGTH = 500;
export const MAX_NOTES_LENGTH = 2000;
export const SYMPTOMS = [
  'Bloating', 'Gas', 'Stomach pain / cramps', 'Nausea', 'Heartburn',
  'Diarrhea', 'Constipation', 'Headache', 'Fatigue', 'Skin flare',
  'Joint pain', 'Brain fog',
] as const;
export const RED_FLAG_SYMPTOMS = [
  'Trouble breathing', 'Throat swelling / tightness', 'Lip / tongue swelling',
  'Hives (widespread)', 'Dizziness / fainting',
] as const;
const allowedSymptoms: ReadonlySet<string> = new Set([...SYMPTOMS, ...RED_FLAG_SYMPTOMS]);
const redFlags: ReadonlySet<string> = new Set(RED_FLAG_SYMPTOMS);
export const SEVERITY_LABELS: Record<number, string> = {
  1: '1 — Minimal', 2: '2 — Mild', 3: '3 — Moderate', 4: '4 — Strong', 5: '5 — Severe',
};
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Avoid .toISOString().slice(0,16): the input represents LOCAL, not UTC, time. */
export function localDateTime(date: Date = new Date()): string {
  return String(date.getFullYear()).padStart(4, '0') + '-' + pad2(date.getMonth() + 1) +
    '-' + pad2(date.getDate()) + 'T' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
}
/** Reject invalid and silently normalized dates (Feb 31, skipped DST hour, etc). */
export function parseLocalDateTime(raw: unknown): Date | null {
  if (typeof raw !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return null;
  const [y, m, d, h, min] = match.slice(1).map(Number);
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31 || h > 23 || min > 59) return null;
  const date = new Date(y, m - 1, d, h, min);
  if (!Number.isFinite(date.getTime()) || date.getFullYear() !== y ||
      date.getMonth() !== m - 1 || date.getDate() !== d ||
      date.getHours() !== h || date.getMinutes() !== min) return null;
  return date;
}
export const hasRedFlag = (symptoms: readonly string[]): boolean =>
  symptoms.some(s => redFlags.has(s));

type DiaryInput = Pick<DiaryEntry, 'datetime' | 'foods' | 'symptoms' | 'severity' | 'notes'>;
export function validateDiaryInput(input: DiaryInput, now: Date = new Date()): string | null {
  const time = parseLocalDateTime(input.datetime);
  if (!time) return 'Enter a valid local date and time (year 1900 or later).';
  if (time.getTime() > now.getTime() + 60_000)
    return 'Log a past or current meal or symptom, not a future event.';
  if (typeof input.foods !== 'string' || input.foods.length > MAX_FOODS_LENGTH ||
      typeof input.notes !== 'string' || input.notes.length > MAX_NOTES_LENGTH)
    return 'Food details must be at most 500 characters and notes at most 2,000.';
  if (!Array.isArray(input.symptoms) ||
      input.symptoms.some(s => typeof s !== 'string' || !allowedSymptoms.has(s)) ||
      new Set(input.symptoms).size !== input.symptoms.length)
    return 'Choose only the listed symptoms, without duplicates.';
  if (!input.foods.trim() && !input.symptoms.length)
    return 'Enter food details or select at least one symptom.';
  if (!Number.isInteger(input.severity) ||
      (input.symptoms.length ? input.severity < 1 || input.severity > 5 : input.severity !== 0))
    return 'Choose a severity of 1–5 when symptoms are selected.';
  return null;
}
/**
 * Read ALL existing entries as an atomic set. If even one is invalid, do not
 * rewrite localStorage or silently drop the previous diary. Old UTC-as-local
 * timestamps might look future-dated: do not reject old data on that basis.
 */
export function parseStoredDiary(input: unknown): DiaryEntry[] | null {
  if (!Array.isArray(input)) return null;
  const ids = new Set<string>();
  const result: DiaryEntry[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== 'string' || !item.id || item.id.length > 128 ||
        ids.has(item.id) || !parseLocalDateTime(item.datetime) ||
        typeof item.foods !== 'string' || typeof item.notes !== 'string' ||
        item.foods.length > MAX_FOODS_LENGTH || item.notes.length > MAX_NOTES_LENGTH ||
        !Array.isArray(item.symptoms) ||
        !item.symptoms.every(s => typeof s === 'string' && allowedSymptoms.has(s)) ||
        new Set(item.symptoms).size !== item.symptoms.length ||
        !Number.isInteger(item.severity) ||
        (item.symptoms.length
          ? (item.severity as number) < 1 || (item.severity as number) > 5
          : item.severity !== 0) ||
        (!item.foods.trim() && item.symptoms.length === 0)) return null;
    ids.add(item.id);
    result.push({
      id: item.id, datetime: item.datetime as string, foods: item.foods,
      symptoms: item.symptoms as string[], severity: item.severity as number,
      notes: item.notes,
    });
  }
  return result;
}
const foodsIn = (raw: string): Set<string> => new Set(
  raw.split(/[,;]/).map(s => s.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean),
);
const WINDOW_MS = 6 * 60 * 60 * 1000;
/**
 * Count a food + nonemergency symptom only if logged in DISTINCT entries at
 * STRICTLY increasing timestamps within 6h. Each distinct later symptom
 * timestamp counts once despite repeated meals/duplicate food mentions.
 * The arbitrary six-hour window is not a clinical allergy threshold.
 */
export function detectDiaryPatterns(entries: readonly DiaryEntry[]): DiaryPattern[] {
  const sorted = entries
    .map(entry => ({ entry, ms: parseLocalDateTime(entry.datetime)?.getTime() }))
    .filter((x): x is { entry: DiaryEntry; ms: number } => x.ms !== undefined)
    .sort((a, b) => a.ms - b.ms);
  const counts = new Map<string, Set<number>>();
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (hasRedFlag(current.entry.symptoms)) continue;
    const symptoms = new Set(current.entry.symptoms.filter(s => !redFlags.has(s)));
    if (!symptoms.size) continue;
    const previousFoods = new Set<string>();
    for (let j = i - 1; j >= 0; j--) {
      const earlier = sorted[j];
      const gap = current.ms - earlier.ms;
      if (gap > WINDOW_MS) break;
      if (gap <= 0 || hasRedFlag(earlier.entry.symptoms)) continue;
      for (const food of foodsIn(earlier.entry.foods)) previousFoods.add(food);
    }
    for (const food of previousFoods) {
      for (const symptom of symptoms) {
        const key = JSON.stringify([food, symptom]);
        if (!counts.has(key)) counts.set(key, new Set<number>());
        counts.get(key)!.add(current.ms);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, timestamps]) => timestamps.size >= 2)
    .map(([key, timestamps]) => {
      const [food, symptom] = JSON.parse(key) as [string, string];
      return { food: food.charAt(0).toUpperCase() + food.slice(1), symptom, count: timestamps.size };
    })
    .sort((a, b) => b.count - a.count || a.food.localeCompare(b.food) || a.symptom.localeCompare(b.symptom))
    .slice(0, 5);
}
