/**
 * Calculator definitions: field schemas + pure compute functions for every
 * Body & Weight tool. All maths is in metric base units (kg, cm, years); the
 * island converts imperial input → metric before calling compute(), and compute
 * formats any mass output back into the active unit system.
 *
 * Formula sources are cited on each tool page (see body-weight-content.ts).
 */
import { fmt, fmtMass, kgToLb, massUnitLabel, round, type Sex, type UnitSystem } from '../../lib/units';

// Brand-aligned status colours.
const C = {
  blue: '#3b82f6',
  green: '#16a34a',
  teal: '#14b8a6',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
} as const;

export type FieldType = 'mass' | 'height' | 'length' | 'age' | 'sex' | 'select' | 'number';

export interface SelectOption {
  value: string;
  label: string;
}

export interface CalcField {
  key: string;
  label: string;
  type: FieldType;
  /** Default value in metric base units (kg / cm / years). For 'number', the raw default. */
  metricDefault: number;
  /** Validation bounds in metric base units. */
  min: number;
  max: number;
  help?: string;
  /** Hide unless predicate passes (e.g. hip only for women). */
  showIf?: (ctx: ComputeCtx) => boolean;
  /** 'select' only: options + default value (read from ctx.selects). */
  options?: SelectOption[];
  selectDefault?: string;
  /** 'number'/'select' display suffix (e.g. "kcal", "weeks"). */
  suffix?: string;
  /** 'number' input step (allows decimals, e.g. 0.5). Defaults to "1". */
  step?: number;
  /** Allow a value of 0 to still produce a result (e.g. 0 drinks of one type). */
  allowZero?: boolean;
}

export interface Segment {
  /** Inclusive-upper bound of this band. */
  upTo: number;
  label: string;
  color: string;
}

export interface DonutSlice {
  label: string;
  /** Display value, e.g. "180 g". */
  value: string;
  /** Share of the whole, 0–100. */
  pct: number;
  color: string;
}

export interface ZoneItem {
  label: string;
  detail: string;
  color: string;
  /** Highlight as the user's matched zone/category. */
  active?: boolean;
}

export type Visual =
  | { kind: 'gauge'; value: number; min: number; max: number; segments: Segment[]; valueLabel?: string }
  | { kind: 'range'; min: number; max: number; low: number; high: number; unit: string }
  | { kind: 'split'; aLabel: string; aValue: number; bLabel: string; bValue: number; aColor: string; bColor: string; unit: string }
  | { kind: 'donut'; centerValue: string; centerLabel: string; slices: DonutSlice[] }
  | { kind: 'zones'; items: ZoneItem[] }
  | { kind: 'none' };

export interface ResultRow {
  label: string;
  value: string;
  strong?: boolean;
}

export interface GoalCard {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'warn' | 'neutral';
}

export interface CalcResult {
  ok: boolean;
  /** Shown when ok === false (e.g. impossible measurements). */
  error?: string;
  primaryLabel: string;
  primaryValue: string;
  category?: { label: string; color: string };
  visual: Visual;
  /** Goal cards (e.g. lose / maintain / gain). */
  cards?: GoalCard[];
  /** Prominent safety / info notice. */
  callout?: { tone: 'warn' | 'info' | 'danger'; text: string };
  rows?: ResultRow[];
  note?: string;
  /** Optional call-to-action link shown after the result (e.g. hand off to another tool). */
  cta?: { label: string; href: string };
}

export interface ComputeCtx {
  /** Metric base-unit values keyed by field.key (kg / cm / years). */
  vals: Record<string, number>;
  /** String values for 'select' fields, keyed by field.key. */
  selects: Record<string, string>;
  sex: Sex;
  units: UnitSystem;
}

export interface CalcDef {
  slug: string;
  /** Active-voice heading above the form, e.g. "Calculate your BMI". */
  heading: string;
  fields: CalcField[];
  hasSex: boolean;
  compute: (ctx: ComputeCtx) => CalcResult;
}

// ---------- shared helpers ----------

/** Find the band a value falls into (first segment whose upTo it does not exceed). */
const bandFor = (value: number, segments: Segment[]): Segment =>
  segments.find((s) => value <= s.upTo) ?? segments[segments.length - 1];

const massScale = (kg: number, units: UnitSystem): number =>
  units === 'metric' ? kg : kgToLb(kg);

// ---------- field presets ----------

const F = {
  weight: (def = 70): CalcField => ({ key: 'weight', label: 'Weight', type: 'mass', metricDefault: def, min: 25, max: 300 }),
  height: (def = 170): CalcField => ({ key: 'height', label: 'Height', type: 'height', metricDefault: def, min: 120, max: 230 }),
  age: (def = 30): CalcField => ({ key: 'age', label: 'Age', type: 'age', metricDefault: def, min: 15, max: 100 }),
  neck: (): CalcField => ({ key: 'neck', label: 'Neck circumference', type: 'length', metricDefault: 38, min: 20, max: 80, help: 'Measure just below the larynx.' }),
  waist: (def = 85): CalcField => ({ key: 'waist', label: 'Waist circumference', type: 'length', metricDefault: def, min: 40, max: 200, help: 'Measure at the narrowest point, after breathing out.' }),
  hip: (): CalcField => ({ key: 'hip', label: 'Hip circumference', type: 'length', metricDefault: 100, min: 50, max: 200, help: 'Measure at the widest point.' }),
} as const;

// ---------- nutrition helpers ----------

// Macro colours (protein / carbs / fat).
const MACRO = { protein: '#3b82f6', carbs: '#f97316', fat: '#16a34a' } as const;

const FREQ_OPTIONS: SelectOption[] = [
  { value: 'rarely', label: 'Rarely / never' },
  { value: '1-2', label: '1–2×/week' },
  { value: '3-5', label: '3–5×/week' },
  { value: 'daily', label: 'Daily' },
];

const ACTIVITY_OPTIONS: SelectOption[] = [
  { value: '1.2', label: 'Sedentary — little or no exercise' },
  { value: '1.375', label: 'Lightly active — 1–3 days/week' },
  { value: '1.55', label: 'Moderately active — 3–5 days/week' },
  { value: '1.725', label: 'Very active — 6–7 days/week' },
  { value: '1.9', label: 'Extra active — hard daily training/job' },
];

const activityField = (): CalcField => ({
  key: 'activity',
  label: 'Activity level',
  type: 'select',
  metricDefault: 0,
  min: 0,
  max: 0,
  options: ACTIVITY_OPTIONS,
  selectDefault: '1.375',
});

/** Mifflin-St Jeor BMR (kcal/day). */
const mifflin = (weightKg: number, heightCm: number, age: number, sex: Sex): number => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
};

/** Minimum safe daily intake recommended without supervision. */
const calorieFloor = (sex: Sex): number => (sex === 'female' ? 1200 : 1500);

const macroDonut = (
  proteinG: number,
  carbsG: number,
  fatG: number,
): Extract<Visual, { kind: 'donut' }> => {
  const pK = proteinG * 4;
  const cK = carbsG * 4;
  const fK = fatG * 9;
  const total = pK + cK + fK || 1;
  return {
    kind: 'donut',
    centerValue: `${fmt(total, 0)}`,
    centerLabel: 'kcal/day',
    slices: [
      { label: 'Protein', value: `${fmt(proteinG, 0)} g`, pct: (pK / total) * 100, color: MACRO.protein },
      { label: 'Carbs', value: `${fmt(carbsG, 0)} g`, pct: (cK / total) * 100, color: MACRO.carbs },
      { label: 'Fat', value: `${fmt(fatG, 0)} g`, pct: (fK / total) * 100, color: MACRO.fat },
    ],
  };
};

// ============================================================
// Definitions
// ============================================================

export const DEFS: Record<string, CalcDef> = {
  // ---- 1. BMI ----
  'bmi-calculator': {
    slug: 'bmi-calculator',
    heading: 'Calculate your BMI',
    hasSex: false,
    fields: [F.weight(72), F.height(175)],
    compute: ({ vals, units }) => {
      const m = vals.height / 100;
      const bmi = vals.weight / (m * m);
      const segments: Segment[] = [
        { upTo: 18.5, label: 'Underweight', color: C.blue },
        { upTo: 25, label: 'Normal weight', color: C.green },
        { upTo: 30, label: 'Overweight', color: C.amber },
        { upTo: 40, label: 'Obese', color: C.red },
      ];
      const band = bandFor(bmi, segments);
      const lowKg = 18.5 * m * m;
      const highKg = 24.9 * m * m;
      return {
        ok: true,
        primaryLabel: 'Your BMI',
        primaryValue: fmt(bmi, 1),
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: bmi, min: 15, max: 40, segments },
        rows: [
          { label: 'Healthy weight for your height', value: `${fmtMass(lowKg, units, 0)} – ${fmtMass(highKg, units, 0)}`, strong: true },
        ],
        note: 'BMI is a screening tool — it does not distinguish muscle from fat. Very muscular people may read high.',
      };
    },
  },

  // ---- 2. BMR (Mifflin-St Jeor) ----
  'bmr-calculator': {
    slug: 'bmr-calculator',
    heading: 'Calculate your BMR',
    hasSex: true,
    fields: [F.weight(72), F.height(175), F.age(30)],
    compute: ({ vals, sex }) => {
      const base = 10 * vals.weight + 6.25 * vals.height - 5 * vals.age;
      const bmr = sex === 'male' ? base + 5 : base - 161;
      const levels: [string, number][] = [
        ['Sedentary (little exercise)', 1.2],
        ['Light (1–3 days/week)', 1.375],
        ['Moderate (3–5 days/week)', 1.55],
        ['Active (6–7 days/week)', 1.725],
        ['Very active (hard daily training)', 1.9],
      ];
      return {
        ok: true,
        primaryLabel: 'Your BMR',
        primaryValue: `${fmt(bmr, 0)} kcal/day`,
        visual: { kind: 'none' },
        rows: levels.map(([label, mult]) => ({
          label,
          value: `${fmt(bmr * mult, 0)} kcal/day`,
        })),
        note: 'BMR is the energy you burn at complete rest. The table estimates total daily calories (TDEE) once activity is added.',
      };
    },
  },

  // ---- 3. Ideal Weight (BMI range + Devine) ----
  'ideal-weight-calculator': {
    slug: 'ideal-weight-calculator',
    heading: 'Calculate your ideal weight',
    hasSex: true,
    fields: [F.height(175)],
    compute: ({ vals, sex, units }) => {
      const m = vals.height / 100;
      const lowKg = 18.5 * m * m;
      const highKg = 24.9 * m * m;
      const inches = vals.height / 2.54;
      const over5ft = Math.max(0, inches - 60);
      const devineKg = (sex === 'male' ? 50 : 45.5) + 2.3 * over5ft;
      const unit = units === 'metric' ? 'kg' : 'lb';
      return {
        ok: true,
        primaryLabel: 'Healthy weight range (BMI 18.5–24.9)',
        primaryValue: `${fmtMass(lowKg, units, 1)} – ${fmtMass(highKg, units, 1)}`,
        visual: {
          kind: 'range',
          min: round(massScale(lowKg, units) - 12, 0),
          max: round(massScale(highKg, units) + 12, 0),
          low: round(massScale(lowKg, units), 1),
          high: round(massScale(highKg, units), 1),
          unit,
        },
        rows: [
          { label: 'Devine formula ideal weight', value: fmtMass(devineKg, units, 1), strong: true },
        ],
        note: 'There is no single "ideal" weight. A healthy BMI range and the Devine clinical formula give complementary targets.',
      };
    },
  },

  // ---- 4. Body Fat % (US Navy) ----
  'body-fat-calculator': {
    slug: 'body-fat-calculator',
    heading: 'Estimate your body fat',
    hasSex: true,
    fields: [
      F.height(175),
      F.neck(),
      F.waist(88),
      { ...F.hip(), showIf: ({ sex }) => sex === 'female' },
    ],
    compute: ({ vals, sex }) => {
      const { height, neck, waist } = vals;
      const hip = vals.hip ?? 0;
      const log10 = Math.log10;
      let bf: number;
      if (sex === 'male') {
        if (waist - neck <= 0) {
          return { ok: false, error: 'Waist must be larger than neck. Re-check your measurements.', primaryLabel: 'Body fat', primaryValue: '—', visual: { kind: 'none' } };
        }
        bf = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450;
      } else {
        if (waist + hip - neck <= 0) {
          return { ok: false, error: 'Check your waist, hip and neck measurements.', primaryLabel: 'Body fat', primaryValue: '—', visual: { kind: 'none' } };
        }
        bf = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450;
      }
      bf = Math.max(2, Math.min(60, bf));
      const segments: Segment[] = sex === 'male'
        ? [
            { upTo: 6, label: 'Essential fat', color: C.blue },
            { upTo: 14, label: 'Athletic', color: C.green },
            { upTo: 18, label: 'Fitness', color: C.teal },
            { upTo: 25, label: 'Average', color: C.amber },
            { upTo: 45, label: 'Above average', color: C.red },
          ]
        : [
            { upTo: 14, label: 'Essential fat', color: C.blue },
            { upTo: 21, label: 'Athletic', color: C.green },
            { upTo: 25, label: 'Fitness', color: C.teal },
            { upTo: 32, label: 'Average', color: C.amber },
            { upTo: 45, label: 'Above average', color: C.red },
          ];
      const band = bandFor(bf, segments);
      return {
        ok: true,
        primaryLabel: 'Estimated body fat',
        primaryValue: `${fmt(bf, 1)}%`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: bf, min: 0, max: 45, segments },
        note: 'This is an estimate from the U.S. Navy circumference method. Lab methods such as DEXA are more accurate.',
      };
    },
  },

  // ---- 5. Lean Body Mass (Boer) ----
  'lean-body-mass-calculator': {
    slug: 'lean-body-mass-calculator',
    heading: 'Calculate your lean body mass',
    hasSex: true,
    fields: [F.weight(72), F.height(175)],
    compute: ({ vals, sex, units }) => {
      const { weight, height } = vals;
      const lbm = sex === 'male'
        ? 0.407 * weight + 0.267 * height - 19.2
        : 0.252 * weight + 0.473 * height - 48.3;
      const fatMass = Math.max(0, weight - lbm);
      const unit = massUnitLabel(units);
      return {
        ok: true,
        primaryLabel: 'Lean body mass',
        primaryValue: fmtMass(lbm, units, 1),
        visual: {
          kind: 'split',
          aLabel: 'Lean mass',
          aValue: round(massScale(lbm, units), 1),
          bLabel: 'Fat mass',
          bValue: round(massScale(fatMass, units), 1),
          aColor: C.green,
          bColor: C.amber,
          unit,
        },
        rows: [
          { label: 'Estimated fat mass', value: fmtMass(fatMass, units, 1) },
          { label: 'Lean mass as % of weight', value: `${fmt((lbm / weight) * 100, 1)}%`, strong: true },
        ],
        note: 'Lean body mass is everything that is not fat — muscle, bone, organs and water. Estimated with the Boer formula.',
      };
    },
  },

  // ---- 6. Waist-to-Height Ratio ----
  'waist-to-height-ratio-calculator': {
    slug: 'waist-to-height-ratio-calculator',
    heading: 'Calculate your waist-to-height ratio',
    hasSex: false,
    fields: [F.waist(85), F.height(175)],
    compute: ({ vals }) => {
      const ratio = vals.waist / vals.height;
      const segments: Segment[] = [
        { upTo: 0.4, label: 'Slim', color: C.blue },
        { upTo: 0.5, label: 'Healthy', color: C.green },
        { upTo: 0.6, label: 'Increased risk', color: C.amber },
        { upTo: 0.7, label: 'High risk', color: C.red },
      ];
      const band = bandFor(ratio, segments);
      return {
        ok: true,
        primaryLabel: 'Waist-to-height ratio',
        primaryValue: fmt(ratio, 2),
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: ratio, min: 0.3, max: 0.7, segments },
        note: 'A simple rule: keep your waist to less than half your height (ratio under 0.5).',
      };
    },
  },

  // ---- 7. Waist-to-Hip Ratio ----
  'waist-to-hip-ratio-calculator': {
    slug: 'waist-to-hip-ratio-calculator',
    heading: 'Calculate your waist-to-hip ratio',
    hasSex: true,
    fields: [F.waist(85), F.hip()],
    compute: ({ vals, sex }) => {
      const ratio = vals.waist / vals.hip;
      const segments: Segment[] = sex === 'male'
        ? [
            { upTo: 0.9, label: 'Low risk', color: C.green },
            { upTo: 1.0, label: 'Increased risk', color: C.amber },
            { upTo: 1.3, label: 'High risk', color: C.red },
          ]
        : [
            { upTo: 0.85, label: 'Low risk', color: C.green },
            { upTo: 0.9, label: 'Increased risk', color: C.amber },
            { upTo: 1.3, label: 'High risk', color: C.red },
          ];
      const band = bandFor(ratio, segments);
      return {
        ok: true,
        primaryLabel: 'Waist-to-hip ratio',
        primaryValue: fmt(ratio, 2),
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: ratio, min: 0.6, max: 1.1, segments },
        note: `WHO links higher abdominal fat with greater health risk above ${sex === 'male' ? '0.90 for men' : '0.85 for women'}.`,
      };
    },
  },

  // ---- 8. Weight Loss Percentage ----
  'weight-loss-percentage-calculator': {
    slug: 'weight-loss-percentage-calculator',
    heading: 'Calculate your weight loss percentage',
    hasSex: false,
    fields: [
      { key: 'start', label: 'Starting weight', type: 'mass', metricDefault: 90, min: 25, max: 350 },
      { key: 'current', label: 'Current weight', type: 'mass', metricDefault: 82, min: 25, max: 350 },
    ],
    compute: ({ vals, units }) => {
      const { start, current } = vals;
      if (start <= 0) {
        return { ok: false, error: 'Starting weight must be greater than zero.', primaryLabel: 'Weight change', primaryValue: '—', visual: { kind: 'none' } };
      }
      const lostKg = start - current;
      const pct = (lostKg / start) * 100;
      const gained = lostKg < 0;
      let cat: { label: string; color: string };
      if (gained) cat = { label: 'Weight gained', color: C.red };
      else if (pct >= 10) cat = { label: 'Significant loss (≥10%)', color: C.green };
      else if (pct >= 5) cat = { label: 'Clinically meaningful (≥5%)', color: C.teal };
      else if (pct > 0) cat = { label: 'In progress', color: C.amber };
      else cat = { label: 'No change yet', color: C.slate };
      return {
        ok: true,
        primaryLabel: gained ? 'Weight gained' : 'Weight lost',
        primaryValue: `${fmt(Math.abs(pct), 1)}%`,
        category: cat,
        visual: { kind: 'none' },
        rows: [
          { label: gained ? 'Total gained' : 'Total lost', value: fmtMass(Math.abs(lostKg), units, 1), strong: true },
        ],
        note: 'Losing 5–10% of your starting weight delivers meaningful health benefits, even before reaching a "goal" weight.',
      };
    },
  },

  // ============================================================
  // Nutrition
  // ============================================================

  // ---- Calorie Calculator (TDEE) ----
  'calorie-calculator': {
    slug: 'calorie-calculator',
    heading: 'Calculate your daily calories',
    hasSex: true,
    fields: [F.weight(72), F.height(175), F.age(30), activityField()],
    compute: ({ vals, selects, sex }) => {
      const factor = parseFloat(selects.activity) || 1.375;
      const bmr = mifflin(vals.weight, vals.height, vals.age, sex);
      const tdee = bmr * factor;
      const floor = calorieFloor(sex);
      const loseRaw = tdee - 500;
      const lose = Math.max(loseRaw, floor);
      const clamped = loseRaw < floor;
      return {
        ok: true,
        primaryLabel: 'Maintenance calories (TDEE)',
        primaryValue: `${fmt(tdee, 0)} kcal/day`,
        visual: { kind: 'none' },
        cards: [
          { label: 'Lose weight', value: `${fmt(lose, 0)} kcal`, sub: '≈ 0.5 kg (1 lb)/week', tone: clamped ? 'warn' : 'good' },
          { label: 'Maintain', value: `${fmt(tdee, 0)} kcal`, sub: 'Stay at current weight', tone: 'neutral' },
          { label: 'Gain weight', value: `${fmt(tdee + 500, 0)} kcal`, sub: '≈ 0.5 kg (1 lb)/week', tone: 'good' },
        ],
        callout: clamped
          ? {
              tone: 'warn',
              text: `A 500 kcal deficit would drop you below the safe minimum of ${floor} kcal/day for ${sex === 'female' ? 'women' : 'men'}. We’ve set your weight-loss target to ${fmt(floor, 0)} kcal — for faster loss, work with a healthcare professional.`,
            }
          : undefined,
        rows: [{ label: 'BMR (calories at rest)', value: `${fmt(bmr, 0)} kcal/day` }],
        note: 'TDEE = your BMR (Mifflin-St Jeor) multiplied by an activity factor from 1.2 (sedentary) to 1.9 (extra active).',
      };
    },
  },

  // ---- Macro Calculator ----
  'macro-calculator': {
    slug: 'macro-calculator',
    heading: 'Calculate your macros',
    hasSex: true,
    fields: [
      F.weight(72), F.height(175), F.age(30), activityField(),
      {
        key: 'goal', label: 'Goal', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'maintain',
        options: [
          { value: 'cut', label: 'Cut — lose fat' },
          { value: 'maintain', label: 'Maintain' },
          { value: 'bulk', label: 'Bulk — build muscle' },
        ],
      },
    ],
    compute: ({ vals, selects, sex }) => {
      const factor = parseFloat(selects.activity) || 1.375;
      const goal = selects.goal || 'maintain';
      const bmr = mifflin(vals.weight, vals.height, vals.age, sex);
      const tdee = bmr * factor;
      const floor = calorieFloor(sex);
      let calories: number;
      let pPerKg: number;
      let fPerKg: number;
      let goalLabel: string;
      if (goal === 'cut') { calories = tdee - 500; pPerKg = 2.2; fPerKg = 0.8; goalLabel = 'Cut'; }
      else if (goal === 'bulk') { calories = tdee + 300; pPerKg = 1.6; fPerKg = 1.0; goalLabel = 'Bulk'; }
      else { calories = tdee; pPerKg = 1.8; fPerKg = 0.9; goalLabel = 'Maintain'; }
      const clamped = calories < floor;
      if (clamped) calories = floor;
      const proteinG = pPerKg * vals.weight;
      const fatG = fPerKg * vals.weight;
      let carbsG = (calories - proteinG * 4 - fatG * 9) / 4;
      let lowCarb = false;
      if (carbsG < 0) { carbsG = 0; lowCarb = true; }
      return {
        ok: true,
        primaryLabel: `Daily calories (${goalLabel})`,
        primaryValue: `${fmt(calories, 0)} kcal/day`,
        visual: macroDonut(proteinG, carbsG, fatG),
        rows: [
          { label: 'Protein', value: `${fmt(proteinG, 0)} g · ${fmt(proteinG * 4, 0)} kcal`, strong: true },
          { label: 'Carbs', value: `${fmt(carbsG, 0)} g · ${fmt(carbsG * 4, 0)} kcal` },
          { label: 'Fat', value: `${fmt(fatG, 0)} g · ${fmt(fatG * 9, 0)} kcal` },
        ],
        callout: clamped
          ? { tone: 'warn', text: `Your cut target was raised to the safe minimum of ${fmt(floor, 0)} kcal/day.` }
          : lowCarb
          ? { tone: 'info', text: 'Your protein and fat targets already use all your calories, so carbs are set to zero. Consider a smaller deficit.' }
          : undefined,
        note: `Protein set at ${pPerKg} g/kg and fat at ${fPerKg} g/kg of body weight; the rest of your calories go to carbs (protein & carbs = 4 kcal/g, fat = 9 kcal/g).`,
        cta: {
          label: 'Build a free 7-day meal plan from these numbers →',
          href: `/tools/meal-plan-generator?calories=${Math.round(calories)}&protein=${Math.round(proteinG)}&carbs=${Math.round(carbsG)}&fat=${Math.round(fatG)}`,
        },
      };
    },
  },

  // ---- Protein Intake ----
  'protein-intake-calculator': {
    slug: 'protein-intake-calculator',
    heading: 'Calculate your protein target',
    hasSex: false,
    fields: [
      F.weight(72),
      {
        key: 'goal', label: 'Activity / goal', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1.6',
        options: [
          { value: '0.8', label: 'Sedentary — minimum (0.8 g/kg)' },
          { value: '1.2', label: 'Active / general fitness (1.2 g/kg)' },
          { value: '1.6', label: 'Building muscle / strength (1.6 g/kg)' },
          { value: '2.0', label: 'Athlete / fat loss (2.0 g/kg)' },
          { value: '2.2', label: 'Maximum — heavy training (2.2 g/kg)' },
        ],
      },
    ],
    compute: ({ vals, selects }) => {
      const gPerKg = parseFloat(selects.goal) || 1.6;
      const proteinG = gPerKg * vals.weight;
      return {
        ok: true,
        primaryLabel: 'Daily protein target',
        primaryValue: `${fmt(proteinG, 0)} g/day`,
        visual: { kind: 'none' },
        rows: [
          { label: 'Based on', value: `${fmt(gPerKg, 1)} g per kg body weight`, strong: true },
          { label: 'Per meal (4 meals)', value: `${fmt(proteinG / 4, 0)} g` },
          { label: 'Calories from protein', value: `${fmt(proteinG * 4, 0)} kcal` },
        ],
        note: 'General health needs about 0.8 g/kg. Active people and those building muscle benefit from 1.6–2.2 g/kg, spread across the day.',
      };
    },
  },

  // ---- Water Intake ----
  'water-intake-calculator': {
    slug: 'water-intake-calculator',
    heading: 'Calculate your water intake',
    hasSex: false,
    fields: [
      F.weight(72),
      {
        key: 'activity', label: 'Daily activity', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '500',
        options: [
          { value: '0', label: 'Light — little exercise' },
          { value: '500', label: 'Moderate — 30–60 min/day' },
          { value: '1000', label: 'Active — 1–2 hours/day' },
          { value: '1500', label: 'Very active — over 2 hours/day' },
        ],
      },
    ],
    compute: ({ vals, selects }) => {
      // 35 ml/kg is a rule of thumb built around typical adult body sizes. It is
      // not validated at high body weights (clinical practice switches to an
      // adjusted weight there), and scaling it linearly produced 6–12 L/day
      // "recommendations". We therefore stop scaling above a reference weight.
      // This is a limit of the formula, NOT a maximum safe or needed intake:
      // the National Academies set no upper limit for water.
      const SCALING_LIMIT_KG = 100;
      const held = vals.weight > SCALING_LIMIT_KG;
      const baselineMl = 35 * Math.min(vals.weight, SCALING_LIMIT_KG);
      const extraMl = parseFloat(selects.activity) || 0;
      const totalMl = baselineMl + extraMl;
      const liters = totalMl / 1000;
      const oz = totalMl / 29.5735;
      const drinksMl = totalMl * 0.8;
      return {
        ok: true,
        primaryLabel: 'Estimated total daily fluid (drinks + food)',
        primaryValue: `${fmt(liters, 1)} L/day`,
        visual: { kind: 'none' },
        callout: held
          ? {
              tone: 'info',
              text: 'The 35 ml/kg rule of thumb is not reliable at higher body weights, so this estimate stops scaling above 100 kg (220 lb). That is a limit of the formula, not a maximum — your needs may be higher or lower. Thirst, urine colour and your doctor’s advice are better guides.',
            }
          : undefined,
        rows: [
          { label: 'In fluid ounces', value: `${fmt(oz, 0)} oz`, strong: true },
          { label: 'Roughly in cups (8 oz)', value: `${fmt(oz / 8, 0)} cups` },
          { label: 'Of which from drinks (about 80%)', value: `${fmt(drinksMl / 1000, 1)} L · ${fmt(drinksMl / 29.5735, 0)} oz` },
          { label: held ? 'Baseline (35 ml/kg, held at 100 kg)' : 'Baseline (35 ml/kg)', value: `${fmt(baselineMl / 1000, 1)} L` },
          { label: 'U.S. reference intake, total water', value: '3.7 L men · 2.7 L women' },
        ],
        note: 'A rule-of-thumb estimate of total fluid — all drinks plus the roughly 20% that comes from food — not a prescription or a limit. The U.S. reference figures are adequate intakes for healthy adults in temperate climates, also counted from drinks and food together; they are not maximums, and people who are very active or in hot weather can need considerably more. If you have a heart, kidney or liver condition or have been told to limit fluids, follow your doctor’s advice instead. Spread fluids through the day — drinking very large amounts quickly can be dangerous.',
      };
    },
  },

  // ---- Calorie Deficit ----
  'calorie-deficit-calculator': {
    slug: 'calorie-deficit-calculator',
    heading: 'Calculate your calorie deficit',
    hasSex: true,
    fields: [
      { key: 'maintenance', label: 'Your maintenance calories', type: 'number', metricDefault: 2200, min: 1000, max: 6000, suffix: 'kcal', help: 'Not sure? Use the Calorie Calculator first.' },
      { key: 'amount', label: 'Weight to lose', type: 'mass', metricDefault: 5, min: 0.5, max: 100 },
      { key: 'weeks', label: 'Timeframe', type: 'number', metricDefault: 10, min: 1, max: 104, suffix: 'weeks' },
    ],
    compute: ({ vals, sex }) => {
      const weeks = vals.weeks;
      if (weeks <= 0) {
        return { ok: false, error: 'Enter a timeframe of at least one week.', primaryLabel: 'Daily deficit', primaryValue: '—', visual: { kind: 'none' } };
      }
      const lossLb = kgToLb(vals.amount);
      const totalKcal = lossLb * 3500;
      const days = weeks * 7;
      const dailyDeficit = totalKcal / days;
      const resulting = vals.maintenance - dailyDeficit;
      const floor = calorieFloor(sex);
      const weeklyKg = vals.amount / weeks;
      // Flag below-floor intake, very large deficits, or rapid loss (>1 kg/week).
      const unsafe = dailyDeficit > 1000 || resulting < floor || weeklyKg > 1;
      return {
        ok: true,
        primaryLabel: 'Daily calorie deficit needed',
        primaryValue: `${fmt(dailyDeficit, 0)} kcal/day`,
        visual: { kind: 'none' },
        rows: [
          { label: 'Total energy to burn', value: `${fmt(totalKcal, 0)} kcal` },
          { label: 'Resulting daily intake', value: `${fmt(Math.max(resulting, 0), 0)} kcal/day`, strong: true },
          { label: 'Timeframe', value: `${fmt(weeks, 0)} weeks (${fmt(days, 0)} days)` },
        ],
        callout: unsafe
          ? {
              tone: 'warn',
              text: `${resulting < floor ? `This drops your intake below the safe minimum of ${floor} kcal/day.` : 'This means rapid weight loss.'} A safe pace is about 0.5–1 kg (1–2 lb) a week — extend your timeframe, avoid crash dieting, and talk to your doctor before attempting faster loss.`,
            }
          : undefined,
        note: 'Uses the classic 3,500 kcal-per-pound rule. Real metabolism adapts as you lose weight, so treat this as a starting estimate, never crash diet, and adjust to results.',
      };
    },
  },

  // ---- Keto / Carb ----
  'keto-calculator': {
    slug: 'keto-calculator',
    heading: 'Calculate your keto macros',
    hasSex: true,
    fields: [F.weight(72), F.height(175), F.age(30), activityField()],
    compute: ({ vals, selects, sex }) => {
      const factor = parseFloat(selects.activity) || 1.375;
      const bmr = mifflin(vals.weight, vals.height, vals.age, sex);
      const tdee = bmr * factor;
      const fatG = (tdee * 0.7) / 9;
      const proteinG = (tdee * 0.25) / 4;
      const carbsG = (tdee * 0.05) / 4;
      return {
        ok: true,
        primaryLabel: 'Daily calories (keto)',
        primaryValue: `${fmt(tdee, 0)} kcal/day`,
        visual: macroDonut(proteinG, carbsG, fatG),
        rows: [
          { label: 'Fat (70%)', value: `${fmt(fatG, 0)} g · ${fmt(tdee * 0.7, 0)} kcal`, strong: true },
          { label: 'Protein (25%)', value: `${fmt(proteinG, 0)} g · ${fmt(tdee * 0.25, 0)} kcal` },
          { label: 'Carbs (5%)', value: `${fmt(carbsG, 0)} g · ${fmt(tdee * 0.05, 0)} kcal` },
          { label: 'Net carb cap', value: '≤ 20–50 g', strong: true },
        ],
        callout: {
          tone: 'info',
          text: `To reach and stay in ketosis, keep net carbs (total carbs minus fibre) under about 20–50 g per day. Your 5% target is ${fmt(carbsG, 0)} g.`,
        },
        note: 'A standard ketogenic split is roughly 70% fat, 25% protein and 5% carbohydrate. Talk to your doctor before starting keto, especially with a medical condition.',
      };
    },
  },

  // ============================================================
  // Heart Health
  // ============================================================

  // ---- Target Heart Rate Zones (Karvonen) ----
  'target-heart-rate-calculator': {
    slug: 'target-heart-rate-calculator',
    heading: 'Find your heart rate zones',
    hasSex: false,
    fields: [
      { ...F.age(30), min: 18, help: 'For adults 18+. An age-predicted maximum is an estimate, not an exercise safety clearance.' },
      { key: 'rest', label: 'Resting heart rate', type: 'number', metricDefault: 65, min: 30, max: 120, suffix: 'bpm', help: 'Use a calm waking reading. Very low or high resting values may need medical assessment before training.' },
      {
        key: 'formula', label: 'Max HR formula', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '220',
        options: [
          { value: '220', label: '220 − age (standard)' },
          { value: 'tanaka', label: 'Tanaka (208 − 0.7 × age)' },
        ],
      },
    ],
    compute: ({ vals, selects }) => {
      const age = vals.age;
      const rest = vals.rest;
      const formula = selects.formula || '220';
      const hrMax = formula === 'tanaka' ? 208 - 0.7 * age : 220 - age;
      const reserve = hrMax - rest;
      const emergency = 'Stop exercise and call emergency services immediately for chest pain, severe shortness of breath, fainting, or other serious new symptoms, regardless of the calculated heart-rate zone.';
      // Each of the five displayed zones spans 10% of reserve. With fewer
      // than 10 bpm in reserve, whole-bpm rounding cannot show five
      // distinguishable zones. This is a display/math check, NOT a diagnosis.
      if (!Number.isFinite(reserve) || reserve < 10) {
        const reason = reserve <= 0
          ? 'The resting pulse must be lower than the estimated maximum heart rate.'
          : 'The calculated reserve is under 10 bpm and cannot display five distinct whole-bpm zones.';
        return {
          ok: false,
          error: `${emergency} ${reason} Please verify your age and resting pulse. If an unexpectedly high or low resting rate persists, ask a healthcare professional before using training targets.`,
          primaryLabel: 'Heart-rate zones unavailable',
          primaryValue: '—',
          visual: { kind: 'none' },
        };
      }
      let callout: CalcResult['callout'];
      if (rest < 40) {
        callout = { tone: 'danger', text: `${emergency} A waking resting pulse below 40 bpm is markedly low. If it is new or unexplained, seek prompt medical advice even if you are an athlete; do not rely on predicted training zones to judge safety.` };
      } else if (rest > 100) {
        callout = { tone: 'warn', text: `${emergency} A resting pulse above 100 bpm deserves a medical review if persistent or unexplained. Do not use this estimate as clearance for vigorous exercise.` };
      } else if (rest < 60) {
        callout = { tone: 'info', text: 'Resting rates below 60 bpm can occur in trained people or with certain medicines, but are not automatically safe. Discuss a new or unexplained low rate with a clinician.' };
      }
      const Z = ['#3b82f6', '#14b8a6', '#16a34a', '#f59e0b', '#ef4444'];
      const bands = [
        { lo: 0.5, hi: 0.6, name: 'Zone 1 · Very light', desc: 'Warm-up & recovery' },
        { lo: 0.6, hi: 0.7, name: 'Zone 2 · Light', desc: 'Easy steady effort, not a unique fat-loss threshold' },
        { lo: 0.7, hi: 0.8, name: 'Zone 3 · Moderate', desc: 'Aerobic endurance' },
        { lo: 0.8, hi: 0.9, name: 'Zone 4 · Hard', desc: 'Anaerobic threshold' },
        { lo: 0.9, hi: 1.0, name: 'Zone 5 · Maximum', desc: 'Near estimated peak; not a recommended target' },
      ];
      const items = bands.map((b, i) => {
        const lo = Math.round(reserve * b.lo + rest);
        const hi = Math.round(reserve * b.hi + rest);
        return {
          label: b.name,
          detail: `${Math.round(b.lo * 100)}–${Math.round(b.hi * 100)}% · ${lo}–${hi} bpm`,
          color: Z[i],
        };
      });
      return {
        ok: true,
        primaryLabel: 'Estimated maximum heart rate',
        primaryValue: `${fmt(hrMax, 0)} bpm`,
        visual: { kind: 'zones', items },
        callout,
        rows: [
          { label: 'Resting heart rate', value: `${fmt(rest, 0)} bpm` },
          { label: 'Heart-rate reserve', value: `${fmt(reserve, 0)} bpm` },
          { label: 'Method', value: formula === 'tanaka' ? 'Tanaka (208 − 0.7 × age)' : '220 − age' },
        ],
        note: `Karvonen: target = resting + ((estimated max − resting) × intensity). These five bands are estimates, not measured physiological thresholds, a safe exercise ceiling or a prescription; age-predicted maximum heart rate varies by individual. Zone 5 is near an estimated peak and is not a goal for unprepared exercisers. ${emergency} If you have a heart condition or take heart-rate-altering medicine, discuss suitable training targets with your clinician.`,
      };
    },
  },

  // ---- Max Heart Rate ----
  'max-heart-rate-calculator': {
    slug: 'max-heart-rate-calculator',
    heading: 'Estimate your maximum heart rate',
    hasSex: false,
    fields: [
      { ...F.age(30), min: 18, help: 'For adults 18+. Age-based equations estimate population averages; they cannot determine a personal safe exercise limit.' },
      {
        key: 'formula', label: 'Formula', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '220',
        options: [
          { value: '220', label: '220 − age (standard)' },
          { value: 'tanaka', label: 'Tanaka (208 − 0.7 × age)' },
        ],
      },
    ],
    compute: ({ vals, selects }) => {
      const age = vals.age;
      const standard = 220 - age;
      const tanaka = 208 - 0.7 * age;
      const formula = selects.formula || '220';
      const hrMax = formula === 'tanaka' ? tanaka : standard;
      const safety = 'If you develop chest pain or pressure, severe difficulty breathing, fainting, or other serious new symptoms during exercise, stop and call emergency services immediately. Predicted maximum heart rate is not a personal safe upper limit. Heart conditions, certain medications (including beta-blockers), and individual differences can change your exercise response; ask your clinician for appropriate targets.';
      return {
        ok: true,
        primaryLabel: 'Estimated maximum heart rate',
        primaryValue: `${fmt(hrMax, 0)} bpm`,
        visual: { kind: 'none' },
        callout: { tone: 'warn', text: safety },
        rows: [
          { label: '220 − age', value: `${fmt(standard, 0)} bpm`, strong: formula !== 'tanaka' },
          { label: 'Tanaka (208 − 0.7 × age)', value: `${fmt(tanaka, 0)} bpm`, strong: formula === 'tanaka' },
        ],
        note: 'These are population-based estimates, not measured maximums or a test of fitness. Individual prediction errors vary and may exceed 10–12 bpm. Tanaka can improve average accuracy in older healthy adults, but neither formula is an exact limit, exercise prescription, or a guarantee of safety.',
      };
    },
  },

  // ---- Blood Pressure Category Checker (AHA) ----
  'blood-pressure-checker': {
    slug: 'blood-pressure-checker',
    heading: 'Check your blood pressure',
    hasSex: false,
    fields: [
      { key: 'systolic', label: 'Systolic (top number)', type: 'number', metricDefault: 118, min: 70, max: 260, suffix: 'mmHg' },
      { key: 'diastolic', label: 'Diastolic (bottom number)', type: 'number', metricDefault: 78, min: 40, max: 160, suffix: 'mmHg' },
    ],
    compute: ({ vals }) => {
      const s = vals.systolic;
      const d = vals.diastolic;
      const cats = [
        { key: 'normal', label: 'Normal', color: '#16a34a', detail: 'Below 120 / below 80 mmHg' },
        { key: 'elevated', label: 'Elevated', color: '#f59e0b', detail: '120–129 / below 80 mmHg' },
        { key: 'stage1', label: 'High — Stage 1', color: '#f97316', detail: '130–139 / 80–89 mmHg' },
        { key: 'stage2', label: 'High — Stage 2', color: '#ef4444', detail: '140+ / 90+ mmHg' },
        { key: 'severe', label: 'Severe hypertension', color: '#b91c1c', detail: 'Above 180 systolic or above 120 diastolic (mmHg)' },
      ];
      let key: string;
      if (s > 180 || d > 120) key = 'severe';
      else if (s >= 140 || d >= 90) key = 'stage2';
      else if (s >= 130 || d >= 80) key = 'stage1';
      else if (s >= 120) key = 'elevated';
      else key = 'normal';
      const cat = cats.find((c) => c.key === key)!;
      const items = cats.map((c) => ({ label: c.label, detail: c.detail, color: c.color, active: c.key === key }));
      let callout: CalcResult['callout'];
      if (key === 'severe') {
        callout = { tone: 'danger', text: 'This is in the severe hypertension range. If you have chest pain, shortness of breath, back pain, numbness, weakness, changes in vision, difficulty speaking, or other new concerning symptoms, call emergency services immediately; do not wait to recheck. Without emergency symptoms, wait at least 1 minute, measure again, and contact your healthcare professional promptly if the reading remains this high.' };
      } else if (key === 'stage2') {
        callout = { tone: 'warn', text: 'Stage 2 high blood pressure usually needs medical treatment. Please see your doctor to discuss these readings.' };
      }
      // Pregnancy and the first six weeks postpartum have lower urgent-care thresholds.
      // These are conditional SAFETY advisories, not diagnoses or altered AHA adult categories.
      const pregnancyWarning = s >= 160 || d >= 110
        ? 'Pregnant or within 6 weeks after childbirth? A systolic reading of 160 or higher OR a diastolic reading of 110 or higher requires urgent obstetric or emergency medical assessment, even without symptoms. Seek immediate care; this checker cannot assess pregnancy-related emergencies.'
        : s >= 140 || d >= 90
          ? 'Pregnant or within 6 weeks after childbirth? A systolic reading of 140 or higher OR a diastolic reading of 90 or higher means you should call your obstetric care team right away, even if you feel well.'
          : '';
      const reversedWarning = s <= d
        ? 'Check the numbers entered: systolic (top) is normally higher than diastolic (bottom). The values may have been reversed or the measurement may be inaccurate. Repeat the measurement.'
        : '';
      // With a severe adult reading, emergency-symptom advice MUST precede any
      // remeasurement/entry-check guidance, including if the input seems reversed.
      if (key === 'severe') {
        callout = { tone: 'danger', text: [callout?.text, pregnancyWarning, reversedWarning].filter(Boolean).join(' ') };
      } else if (pregnancyWarning || reversedWarning) {
        callout = {
          tone: s >= 160 || d >= 110 ? 'danger' : 'warn',
          text: [pregnancyWarning, callout?.text, reversedWarning].filter(Boolean).join(' '),
        };
      }
      return {
        ok: true,
        primaryLabel: 'Your reading',
        primaryValue: `${fmt(s, 0)}/${fmt(d, 0)} mmHg`,
        category: { label: cat.label, color: cat.color },
        visual: { kind: 'zones', items },
        callout,
        note: 'General AHA adult categories (2025) are not a pregnancy/postpartum risk assessment. If pregnant or within 6 weeks after childbirth, contact your obstetric care team right away for systolic 140+ OR diastolic 90+; systolic 160+ OR diastolic 110+ needs urgent assessment. Severe headache, vision changes, upper-abdominal pain or trouble breathing need immediate medical attention at any reading. One reading is not a diagnosis.',
      };
    },
  },

  // ---- Resting Heart Rate Checker ----
  'resting-heart-rate-checker': {
    slug: 'resting-heart-rate-checker',
    heading: 'Check your resting heart rate',
    hasSex: true,
    fields: [
      { key: 'rhr', label: 'Resting heart rate', type: 'number', metricDefault: 65, min: 30, max: 130, suffix: 'bpm', help: 'Measure at rest, ideally first thing in the morning before getting up.' },
      { ...F.age(30), min: 18, help: 'For adults 18+. Age adjusts only this tool’s illustrative comparison; the usual adult pulse reference is 60–100 bpm.' },
      {
        key: 'fitness', label: 'Fitness level (optional)', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'unknown',
        options: [
          { value: 'unknown', label: 'Prefer not to say' },
          { value: 'sedentary', label: 'Mostly sedentary' },
          { value: 'recreational', label: 'Recreationally active' },
          { value: 'athlete', label: 'Athlete / highly trained' },
        ],
      },
    ],
    compute: ({ vals, sex, selects }) => {
      const rhr = vals.rhr;
      // Preserve the site’s documented age/sex illustration for consistency
      // with the existing article. These offsets are NOT validated medical
      // reference limits, measures of fitness, or AHA clinical thresholds.
      const sexAdj = sex === 'female' ? 4 : 0;
      const ageAdj = vals.age >= 65 ? 2 : vals.age >= 45 ? 1 : 0;
      const t = (b: number) => b + sexAdj + ageAdj;
      const segments: Segment[] = [
        { upTo: t(55), label: 'Athlete', color: C.blue },
        { upTo: t(61), label: 'Excellent', color: C.green },
        { upTo: t(65), label: 'Good', color: C.teal },
        { upTo: t(73), label: 'Average', color: C.amber },
        { upTo: 130, label: 'Below average', color: C.slate },
      ];
      let cat: { label: string; color: string };
      if (rhr <= t(55)) cat = { label: 'Athlete', color: C.blue };
      else if (rhr <= t(61)) cat = { label: 'Excellent', color: C.green };
      else if (rhr <= t(65)) cat = { label: 'Good', color: C.teal };
      else if (rhr <= t(73)) cat = { label: 'Average', color: C.amber };
      else cat = { label: 'Below average', color: C.slate };
      const meanings: Record<string, string> = {
        Athlete: 'An illustrative low-pulse band; this label does not establish athletic conditioning or a healthy heart.',
        Excellent: 'An illustrative comparison band, not a validated cardiovascular fitness rating.',
        Good: 'An illustrative comparison band, not proof of better cardiovascular health.',
        Average: 'An illustrative comparison band; compare your reading with the usual 60–100 bpm adult reference.',
        'Below average': 'This illustrative band can include readings within the usual 60–100 bpm adult range; it does not diagnose poor health or fitness.',
      };
      const emergency = 'If you have chest pain, severe difficulty breathing, fainting, or other serious new symptoms, call emergency services immediately regardless of the number shown.';
      let callout: CalcResult['callout'];
      if (rhr < 40) {
        callout = { tone: 'danger', text: `${emergency} A waking resting pulse under 40 bpm is markedly slow; contact a healthcare professional promptly if it is new or unexplained, even if you are a trained athlete.` };
      } else if (rhr > 100) {
        callout = { tone: 'warn', text: `${emergency} If your resting pulse stays above 100 bpm, arrange a medical assessment; temporary causes and medications may affect the reading.` };
      } else if (rhr < 60) {
        callout = { tone: 'info', text: 'A resting pulse below 60 bpm can occur in athletes or with certain medications, but it is not automatically healthy. If this is new, unexplained, or repeatedly low, discuss it with a healthcare professional.' };
      }
      const fit = selects.fitness;
      const fitNote = fit === 'athlete'
        ? ' Athletic training can lower resting pulse, but does not guarantee that a low reading is safe or that symptoms can be ignored.'
        : fit === 'sedentary'
          ? ' Fitness and other factors can influence pulse, but one reading cannot measure your fitness.'
          : '';
      return {
        ok: true,
        primaryLabel: 'Your resting heart rate',
        primaryValue: `${fmt(rhr, 0)} bpm`,
        category: { label: `${cat.label} (illustrative)`, color: rhr < 40 || rhr > 100 ? C.red : cat.color },
        visual: { kind: 'gauge', value: rhr, min: 30, max: 130, segments },
        callout,
        rows: [
          { label: 'General adult reference range', value: '60–100 bpm', strong: true },
          { label: 'Your reading vs. this adult reference', value: rhr < 60 ? 'Below the usual adult range' : rhr > 100 ? 'Above the usual adult range' : 'Within the usual adult range', strong: true },
          { label: 'Well-trained athletes', value: '~40–60 bpm (not a guarantee of health)' },
          { label: `Illustrative band (${sex === 'female' ? 'women' : 'men'}${vals.age >= 45 ? `, ${vals.age >= 65 ? '65+' : '45–64'}` : ''})`, value: `Athlete ≤${t(55)} · Average ${t(66)}–${t(73)}` },
        ],
        note: `${meanings[cat.label] ?? ''}${fitNote} The sex/age offsets and five fitness bands are this site's unvalidated illustrations, NOT American Heart Association or Mayo Clinic clinical cutoffs. The adult reference is 60–100 bpm, but even a reading in that range does not rule out a rhythm problem. ${emergency} Discuss persistently unusual readings or a new change with a healthcare professional.`,
      };
    },
  },

  // ============================================================
  // Metabolic Health
  // ============================================================

  // ---- Metabolic Age (illustrative, BMR-based) ----
  'metabolic-age-calculator': {
    slug: 'metabolic-age-calculator',
    heading: 'Estimate your metabolic age',
    hasSex: true,
    fields: [F.weight(72), F.height(175), F.age(30)],
    compute: ({ vals, sex }) => {
      const userBMR = mifflin(vals.weight, vals.height, vals.age, sex);
      const avgForAge = sex === 'male' ? 1700 - 6 * (vals.age - 25) : 1400 - 5 * (vals.age - 25);
      const diff = userBMR - avgForAge;
      // Gentle mapping: ~40 kcal above the age-average ≈ 1 year "younger". Capped at ±12.
      let metAge = Math.round(vals.age - diff / 40);
      metAge = Math.max(vals.age - 12, Math.min(vals.age + 12, metAge));
      metAge = Math.max(16, Math.min(90, metAge));
      const delta = metAge - vals.age;
      const cat = delta <= -3 ? { label: 'Younger than your age', color: C.green }
        : delta >= 3 ? { label: 'Older than your age', color: C.amber }
        : { label: 'About your age', color: C.teal };
      return {
        ok: true,
        primaryLabel: 'Estimated metabolic age',
        primaryValue: `${metAge} years`,
        category: cat,
        visual: { kind: 'split', aLabel: 'Real age', aValue: vals.age, bLabel: 'Metabolic age', bValue: metAge, aColor: C.slate, bColor: delta <= 0 ? C.green : C.amber, unit: 'yrs' },
        rows: [
          { label: 'Your BMR (Mifflin-St Jeor)', value: `${fmt(userBMR, 0)} kcal/day`, strong: true },
          { label: `Typical BMR around age ${fmt(vals.age, 0)}`, value: `${fmt(avgForAge, 0)} kcal/day` },
          { label: 'Difference', value: `${diff >= 0 ? '+' : ''}${fmt(diff, 0)} kcal/day` },
        ],
        callout: { tone: 'info', text: 'This is a simplified, illustrative estimate — not a medical measurement. It compares your BMR with a rough average for your age: a higher BMR maps to a "younger" number. Muscle and activity raise BMR, but body size also influences it, so read this as a fun motivator, not a diagnosis.' },
        note: 'Method: we calculate your Basal Metabolic Rate with the Mifflin-St Jeor equation, then compare it to a typical BMR for your age and sex and map the gap onto an illustrative age (capped at ±12 years). Building muscle and staying active raise your BMR — see the BMR and Calorie calculators for the underlying numbers.',
      };
    },
  },

  // ---- Alcohol Calorie Calculator ----
  'alcohol-calorie-calculator': {
    slug: 'alcohol-calorie-calculator',
    heading: 'Calculate your alcohol calories',
    hasSex: false,
    fields: [
      { key: 'beer', label: 'Beers per week (12 oz)', type: 'number', metricDefault: 4, min: 0, max: 100, step: 0.5, allowZero: true },
      { key: 'wine', label: 'Glasses of wine per week (5 oz)', type: 'number', metricDefault: 3, min: 0, max: 100, step: 0.5, allowZero: true },
      { key: 'spirits', label: 'Shots of spirits per week (1.5 oz)', type: 'number', metricDefault: 2, min: 0, max: 100, step: 0.5, allowZero: true },
      { key: 'cocktail', label: 'Cocktails per week', type: 'number', metricDefault: 1, min: 0, max: 100, step: 0.5, allowZero: true },
    ],
    compute: ({ vals }) => {
      const KCAL = { beer: 150, wine: 125, spirits: 97, cocktail: 225 };
      const beerK = vals.beer * KCAL.beer;
      const wineK = vals.wine * KCAL.wine;
      const spiritK = vals.spirits * KCAL.spirits;
      const cockK = vals.cocktail * KCAL.cocktail;
      const weekly = beerK + wineK + spiritK + cockK;
      const yearly = weekly * 52;
      const fatLb = yearly / 3500;
      const totalDrinks = vals.beer + vals.wine + vals.spirits + vals.cocktail;
      const parts = [
        { label: 'Beer', kcal: beerK, color: C.amber },
        { label: 'Wine', kcal: wineK, color: C.red },
        { label: 'Spirits', kcal: spiritK, color: C.blue },
        { label: 'Cocktails', kcal: cockK, color: '#8b5cf6' },
      ].filter((s) => s.kcal > 0);
      const total = weekly || 1;
      const visual: Visual = parts.length
        ? { kind: 'donut', centerValue: `${fmt(weekly, 0)}`, centerLabel: 'kcal/week', slices: parts.map((s) => ({ label: s.label, value: `${fmt(s.kcal, 0)} kcal`, pct: (s.kcal / total) * 100, color: s.color })) }
        : { kind: 'none' };
      return {
        ok: true,
        primaryLabel: 'Calories from alcohol',
        primaryValue: `${fmt(weekly, 0)} kcal/week`,
        visual,
        rows: [
          { label: 'Per month', value: `${fmt(weekly * 4.345, 0)} kcal` },
          { label: 'Per year', value: `${fmt(yearly, 0)} kcal`, strong: true },
          { label: '≈ body fat per year, if unburned', value: `${fmt(fatLb, 1)} lb` },
          { label: 'Total drinks per week', value: `${fmt(totalDrinks, 1)}` },
        ],
        callout: { tone: 'info', text: 'Low-risk guidance: the CDC suggests up to 1 drink/day for women and 2 for men; the UK NHS advises 14 units a week or less, spread over 3+ days with drink-free days. Alcohol carries 7 kcal per gram — "empty" calories with no nutrition, and that\'s before sugary mixers.' },
        note: 'Calories per drink are typical values (beer 12 oz ≈ 150, wine 5 oz ≈ 125, spirit 1.5 oz ≈ 97, cocktail ≈ 225) and climb with stronger or larger servings and mixers. The body-fat equivalent uses the 3,500 kcal-per-pound rule and assumes the calories are not offset by activity. Educational and non-judgmental — small cutbacks add up.',
      };
    },
  },

  // ============================================================
  // Women's Health
  // ============================================================

  // ---- Pregnancy Weight Gain (IOM) ----
  'pregnancy-weight-gain-calculator': {
    slug: 'pregnancy-weight-gain-calculator',
    heading: 'Check your pregnancy weight gain',
    hasSex: false,
    fields: [
      { key: 'weight', label: 'Pre-pregnancy weight', type: 'mass', metricDefault: 65, min: 35, max: 200 },
      F.height(165),
      { key: 'week', label: 'Current week of pregnancy', type: 'number', metricDefault: 20, min: 1, max: 42, suffix: 'weeks' },
      { key: 'current', label: 'Current weight', type: 'mass', metricDefault: 71, min: 35, max: 250 },
    ],
    compute: ({ vals, units }) => {
      const m = vals.height / 100;
      const bmi = vals.weight / (m * m);
      // IOM (2009) Table S-1, singleton pregnancy. Both unit columns are the
      // published values — the kg figures are not conversions of the lb ones.
      // [total low, total high, weekly rate low, weekly rate high] for trimesters 2–3.
      const IOM = {
        under: { cat: 'Underweight', color: '#3b82f6', lb: [28, 40, 1.0, 1.3], kg: [12.5, 18, 0.44, 0.58] },
        normal: { cat: 'Normal weight', color: '#16a34a', lb: [25, 35, 0.8, 1.0], kg: [11.5, 16, 0.35, 0.5] },
        over: { cat: 'Overweight', color: '#f59e0b', lb: [15, 25, 0.5, 0.7], kg: [7, 11.5, 0.23, 0.33] },
        obesity: { cat: 'Obesity', color: '#ef4444', lb: [11, 20, 0.4, 0.6], kg: [5, 9, 0.17, 0.27] },
      } as const;
      const row = bmi < 18.5 ? IOM.under : bmi < 25 ? IOM.normal : bmi < 30 ? IOM.over : IOM.obesity;
      const metric = units === 'metric';
      const [totalLo, totalHi, rLo, rHi] = metric ? row.kg : row.lb;
      // First-trimester gain assumed by the IOM: 0.5–2 kg (1.1–4.4 lb).
      const firstLo = metric ? 0.5 : 1.1;
      const firstHi = metric ? 2 : 4.4;
      const cat = row.cat; const color = row.color;
      const w = Math.max(1, Math.min(42, vals.week));
      // By-week range: our interpolation (linear across the first trimester, then
      // the IOM weekly rate), never allowed to exceed the IOM total range.
      const byLo = Math.min(totalLo, w <= 13 ? firstLo * (w / 13) : firstLo + rLo * (w - 13));
      const byHi = Math.min(totalHi, w <= 13 ? firstHi * (w / 13) : firstHi + rHi * (w - 13));
      const gainKg = vals.current - vals.weight;
      const gainDisp = metric ? gainKg : kgToLb(gainKg);
      const unit = massUnitLabel(units);
      const maxScale = totalHi * 1.3;
      let callout: CalcResult['callout'];
      if (gainDisp < 0) callout = { tone: 'warn', text: 'Your current weight is below your pre-pregnancy weight. A small loss can happen early on with nausea, but tell your OB-GYN or midwife — especially after the first trimester or if you are struggling to eat or drink.' };
      else if (gainDisp < byLo * 0.9) callout = { tone: 'info', text: `You're tracking below the estimated range for week ${Math.round(w)}. Week-to-week gain varies — your OB-GYN can confirm whether you're on track.` };
      else if (gainDisp > byHi * 1.1) callout = { tone: 'warn', text: `You're tracking above the estimated range for week ${Math.round(w)}. It's worth discussing your weight gain with your OB-GYN.` };
      return {
        ok: true,
        primaryLabel: 'Recommended total gain',
        primaryValue: `${fmt(totalLo, 1)}–${fmt(totalHi, 1)} ${unit}`,
        category: { label: cat, color },
        visual: {
          kind: 'gauge',
          value: Math.max(0, gainDisp),
          min: 0,
          max: maxScale,
          segments: [
            { upTo: byLo, label: 'Below pace', color: '#f59e0b' },
            { upTo: byHi, label: 'On track for now', color: '#16a34a' },
            { upTo: maxScale, label: 'Above pace', color: '#ef4444' },
          ],
        },
        callout,
        rows: [
          { label: 'Pre-pregnancy BMI', value: `${fmt(bmi, 1)} (${cat})` },
          { label: `Estimated range by week ${Math.round(w)}`, value: `${fmt(byLo, 1)}–${fmt(byHi, 1)} ${unit}`, strong: true },
          { label: "You've gained so far", value: `${fmt(gainDisp, 1)} ${unit}` },
        ],
        note: 'Total ranges are the 2009 Institute of Medicine (IOM) recommendations for a single baby, by pre-pregnancy BMI. The by-week range is our estimate from the IOM’s assumed first-trimester gain and weekly rates — it is a guide, not a target for any one week. These ranges do not apply to twins or other multiples, which have different guidance. Always confirm your targets with your OB-GYN.',
      };
    },
  },

  // ============================================================
  // Fitness
  // ============================================================

  // ---- Calories Burned (METs) ----
  'calories-burned-calculator': {
    slug: 'calories-burned-calculator',
    heading: 'Calculate calories burned',
    hasSex: false,
    fields: [
      {
        key: 'activity', label: 'Activity', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'running',
        options: [
          { value: 'walking', label: 'Walking, 3.5 mph (MET 3.5)' },
          { value: 'running', label: 'Running, 6 mph (MET 9.8)' },
          { value: 'cycling', label: 'Cycling, moderate (MET 7.5)' },
          { value: 'swimming', label: 'Swimming (MET 8.0)' },
          { value: 'hiit', label: 'HIIT (MET 8.0)' },
          { value: 'yoga', label: 'Yoga (MET 3.0)' },
          { value: 'weights', label: 'Weightlifting (MET 5.0)' },
          { value: 'hiking', label: 'Hiking (MET 6.0)' },
          { value: 'rowing', label: 'Rowing (MET 7.0)' },
          { value: 'dancing', label: 'Dancing (MET 7.8)' },
          { value: 'tennis', label: 'Tennis (MET 7.3)' },
          { value: 'jumprope', label: 'Jumping rope (MET 12.3)' },
        ],
      },
      F.weight(72),
      { key: 'minutes', label: 'Duration', type: 'number', metricDefault: 45, min: 1, max: 600, suffix: 'min' },
    ],
    compute: ({ vals, selects }) => {
      const METS: Record<string, number> = {
        walking: 3.5, running: 9.8, cycling: 7.5, swimming: 8.0, hiit: 8.0, yoga: 3.0,
        weights: 5.0, hiking: 6.0, rowing: 7.0, dancing: 7.8, tennis: 7.3, jumprope: 12.3,
      };
      const met = METS[selects.activity] ?? 9.8;
      const hours = vals.minutes / 60;
      const cal = met * vals.weight * hours;
      return {
        ok: true,
        primaryLabel: `Calories burned in ${fmt(vals.minutes, 0)} min`,
        primaryValue: `${fmt(cal, 0)} kcal`,
        visual: { kind: 'none' },
        rows: [
          { label: 'Per hour', value: `${fmt(met * vals.weight, 0)} kcal`, strong: true },
          { label: 'Per 30 minutes', value: `${fmt(met * vals.weight * 0.5, 0)} kcal` },
          { label: 'MET value', value: `${met}` },
        ],
        note: 'Calories = METs × weight (kg) × hours. MET values are population averages; your real burn varies with intensity, fitness and terrain.',
      };
    },
  },

  // ---- One-Rep Max (Epley + Brzycki) ----
  'one-rep-max-calculator': {
    slug: 'one-rep-max-calculator',
    heading: 'Estimate your one-rep max',
    hasSex: false,
    fields: [
      { key: 'weight', label: 'Weight lifted', type: 'mass', metricDefault: 80, min: 1, max: 500 },
      { key: 'reps', label: 'Reps performed', type: 'number', metricDefault: 5, min: 1, max: 15, suffix: 'reps' },
    ],
    compute: ({ vals, units }) => {
      const w = vals.weight;
      const reps = Math.max(1, Math.min(15, vals.reps));
      // A completed single already records that load; do not extrapolate
      // Epley by 3.33% when reps === 1. It may not be a true maximal lift.
      const isSingle = reps === 1;
      const epley = isSingle ? w : w * (1 + reps / 30);
      const brzycki = w * 36 / (37 - reps);
      const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
      return {
        ok: true,
        primaryLabel: isSingle ? 'Weight lifted for one rep' : 'Estimated 1-rep max (Epley)',
        primaryValue: fmtMass(epley, units, 1),
        visual: { kind: 'none' },
        rows: [
          { label: 'Brzycki estimate', value: fmtMass(brzycki, units, 1) },
          ...pcts.map((p) => ({ label: `${p}% of ${isSingle ? 'recorded one-rep load' : '1RM'}`, value: fmtMass(epley * (p / 100), units, 1), strong: p === 100 })),
        ],
        note: isSingle
          ? 'One repetition: the result equals the weight you lifted. It is a recorded single-rep load, not proof of your true maximum unless the attempt was maximal. The percentage table is relative to this recorded load.'
          : 'For 2 or more repetitions, Epley: weight × (1 + reps ÷ 30); Brzycki: weight × 36 ÷ (37 − reps). Both are estimates, most useful at 10 reps or fewer.',
      };
    },
  },

  // ---- FFMI (Fat-Free Mass Index) ----
  'ffmi-calculator': {
    slug: 'ffmi-calculator',
    heading: 'Calculate your FFMI',
    hasSex: false,
    fields: [
      F.weight(72),
      F.height(175),
      { key: 'bodyfat', label: 'Body fat', type: 'number', metricDefault: 15, min: 2, max: 60, suffix: '%', help: 'Not sure? Estimate it with the Body Fat Calculator.' },
    ],
    compute: ({ vals, units }) => {
      // Keep existing FORM bounds. They are not medical reference ranges.
      const { weight, height, bodyfat } = vals;
      if (![weight, height, bodyfat].every(Number.isFinite) ||
          weight < 25 || weight > 300 || height < 120 || height > 230 ||
          bodyfat < 2 || bodyfat > 60) {
        return { ok: false, error: 'Check weight (25–300 kg), height (120–230 cm), and body fat (2–60%). These are calculator input limits, not healthy reference ranges.', primaryLabel: 'Estimated FFMI', primaryValue: '', visual: { kind: 'none' } };
      }
      const heightM = height / 100;
      const lbm = weight * (1 - bodyfat / 100);
      const ffmi = lbm / (heightM * heightM);
      // Original site/Article 43 explicitly use 6.1; Kouri's study used 6.3.
      const normalized = ffmi + 6.1 * (1.8 - heightM);
      return {
        ok: true,
        primaryLabel: 'Estimated FFMI (raw)',
        primaryValue: fmt(ffmi, 1),
        // Previous bands falsely graded all ages/sexes and clipped results
        // outside the hard-coded 14–30 scale. Keep raw values, not false grades.
        visual: { kind: 'none' },
        rows: [
          { label: 'Normalized FFMI (site formula, height-adjusted)', value: fmt(normalized, 1), strong: true },
          { label: 'Estimated fat-free mass (includes water, bone, organs)', value: fmtMass(lbm, units, 1) },
          { label: 'Estimated fat mass', value: fmtMass(weight - lbm, units, 1) },
        ],
        callout: {
          tone: 'info',
          text: 'No population grade is assigned: FFMI reference distributions vary by sex, age, population, and measurement method. Neither a high nor a low score diagnoses health or muscle mass, or proves use of anabolic steroids.',
        },
        note: 'FFMI = estimated fat-free mass ÷ height². This site preserves its published +6.1 × (1.80 − height in meters) adjustment; the original small male-athlete study used 6.3. The often-quoted value of 25 concerns normalized FFMI in that study, not a universal raw FFMI limit or a steroid test. Body-fat measurement and hydration uncertainty affect both values.',
      };
    },
  },

  // ---- Recovery Time (heuristic guidance) ----
  'recovery-time-calculator': {
    slug: 'recovery-time-calculator',
    heading: 'Estimate your recovery time',
    hasSex: false,
    fields: [
      {
        key: 'workoutType', label: 'Workout type', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'strength',
        options: [
          { value: 'strength', label: 'Strength / heavy resistance' },
          { value: 'hiit', label: 'HIIT / intervals' },
          { value: 'endurance', label: 'Endurance / steady cardio' },
          { value: 'light', label: 'Light / recovery session' },
        ],
      },
      { key: 'rpe', label: 'Effort (RPE)', type: 'number', metricDefault: 7, min: 1, max: 10, suffix: '/10', help: 'Rate of Perceived Exertion: 1 = very easy, 10 = all-out max.' },
      { key: 'duration', label: 'Duration', type: 'number', metricDefault: 60, min: 5, max: 240, suffix: 'min' },
      {
        key: 'trainingAge', label: 'Training age', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'intermediate',
        options: [
          { value: 'beginner', label: 'Beginner — < 1 yr consistent training' },
          { value: 'intermediate', label: 'Intermediate — 1–3 yrs' },
          { value: 'advanced', label: 'Advanced — 3+ yrs' },
        ],
      },
      {
        key: 'sleep', label: 'Last night\'s sleep quality', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'good',
        options: [
          { value: 'poor', label: 'Poor — restless / too short' },
          { value: 'fair', label: 'Fair' },
          { value: 'good', label: 'Good' },
          { value: 'excellent', label: 'Excellent — deep & long' },
        ],
      },
      {
        key: 'soreness', label: 'Current soreness (DOMS)', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'mild',
        options: [
          { value: 'none', label: 'None' },
          { value: 'mild', label: 'Mild' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'severe', label: 'Severe — affecting movement' },
        ],
      },
    ],
    compute: ({ vals, selects }) => {
      const workoutType = selects.workoutType || 'strength';
      const trainingAge = selects.trainingAge || 'intermediate';
      const sleep = selects.sleep || 'good';
      const soreness = selects.soreness || 'mild';
      // Significant pain that impairs ordinary movement is not a validated
      // recovery-clock input. Never imply a numeric return-to-training clearance.
      if (soreness === 'severe') {
        return {
          ok: false,
          error: 'Severe soreness affecting normal movement is outside this time estimator. Avoid another hard workout of the affected area. Get medical advice for severe or worsening pain, marked swelling, weakness, or trouble moving normally. Dark (tea- or cola-colored) urine after intense exercise needs urgent medical care.',
          primaryLabel: 'Recovery time cannot be estimated',
          primaryValue: '',
          visual: { kind: 'none' },
        };
      }
      const rpe = vals.rpe;
      const duration = vals.duration;

      // These starting values are site-defined planning assumptions, not
      // measured biological recovery times or validated by workout category.
      const BASE: Record<string, number> = {
        strength: 48,
        hiit: 36,
        endurance: 30,
        light: 18,
      };
      const base = BASE[workoutType] ?? 30;

      // RPE: linear multiplier from ×0.7 (RPE 1) to ×1.3 (RPE 10).
      const rpeMult = 0.7 + ((rpe - 1) / 9) * 0.6;

      // Duration factor.
      let durMult: number;
      if (duration < 30) durMult = 0.85;
      else if (duration <= 60) durMult = 1.0;
      else if (duration <= 90) durMult = 1.15;
      else durMult = 1.3;

      // Training history adjustment is illustrative; people of every level vary.
      const AGE_MULT: Record<string, number> = {
        beginner: 1.3,
        intermediate: 1.0,
        advanced: 0.85,
      };
      const ageMult = AGE_MULT[trainingAge] ?? 1.0;

      // Sleep-related adjustment is heuristic, not a measured tissue-repair rate.
      const SLEEP_MULT: Record<string, number> = {
        poor: 1.25,
        fair: 1.1,
        good: 1.0,
        excellent: 0.9,
      };
      const sleepMult = SLEEP_MULT[sleep] ?? 1.0;

      // Mild/moderate soreness is a planning input, not a tissue-healing assay.
      const SORENESS_MULT: Record<string, number> = {
        none: 0.9,
        mild: 1.0,
        moderate: 1.15,
        severe: 1.35,
      };
      const sorenessMult = SORENESS_MULT[soreness] ?? 1.0;

      const center = base * rpeMult * durMult * ageMult * sleepMult * sorenessMult;
      const low = Math.round(center * 0.85);
      const high = Math.round(center * 1.15);

      const useDays = high >= 48;
      const fmtWindow = (h: number) =>
        useDays ? `${fmt(h / 24, 1)} days` : `${h} hrs`;

      return {
        ok: true,
        primaryLabel: 'Illustrative recovery planning window',
        primaryValue: `${fmtWindow(low)} – ${fmtWindow(high)}`,
        visual: { kind: 'none' },
        rows: [
          { label: 'Workout type base', value: `${base} hrs`, strong: true },
          { label: `Intensity (RPE ${fmt(rpe, 0)})`, value: `×${fmt(rpeMult, 2)}` },
          { label: `Duration (${fmt(duration, 0)} min)`, value: `×${fmt(durMult, 2)}` },
          { label: 'Training age', value: `×${fmt(ageMult, 2)}` },
          { label: 'Sleep quality', value: `×${fmt(sleepMult, 2)}` },
          { label: 'Soreness level', value: `×${fmt(sorenessMult, 2)}` },
        ],
        callout: {
          tone: 'info',
          text: 'This hour range is an illustrative planning aid, not medical clearance or proof that muscles have healed. Check your movement and performance before training hard again. Stop for sharp or joint pain; seek medical advice if symptoms persist or worsen.',
        },
        cta: {
          label: 'Check your protein target for recovery →',
          href: '/tools/protein-intake-calculator',
        },
        note: 'Method: this site uses illustrative starting hours and fixed multipliers for session type, RPE, duration, training history, sleep, and mild/moderate soreness. The ±15% display margin is chosen by the model, NOT a measured confidence interval, validated biological recovery time, or a guarantee that hard exercise is safe on that day.',
      };
    },
  },

  // ---- Push-Up Test (muscular endurance norms) ----
  'push-up-test-calculator': {
    slug: 'push-up-test-calculator',
    heading: 'Score your push-up test',
    hasSex: true,
    fields: [
      F.age(30),
      { key: 'pushups', label: 'Push-ups completed', type: 'number', metricDefault: 20, min: 0, max: 200, suffix: 'reps', allowZero: true, help: 'Count strict reps: chest to fist height, body straight, full extension at the top.' },
      { key: 'plank', label: 'Plank hold (optional)', type: 'number', metricDefault: 0, min: 0, max: 600, suffix: 'sec', allowZero: true, help: 'If you also held a forearm plank, enter your time in seconds.' },
    ],
    compute: ({ vals, sex }) => {
      const age = vals.age;
      const pushups = vals.pushups;

      // Normative thresholds (inclusive max per band) by sex and age bracket.
      // Source: ACSM push-up test norms. bands = [belowAvg, avg, aboveAvg, good] upTo values.
      const NORMS: Record<Sex, Array<{ ageMax: number; bands: [number, number, number, number] }>> = {
        male: [
          { ageMax: 29, bands: [21, 28, 36, 44] },
          { ageMax: 39, bands: [16, 23, 29, 38] },
          { ageMax: 49, bands: [12, 18, 24, 30] },
          { ageMax: 59, bands: [9, 13, 18, 24] },
          { ageMax: 200, bands: [7, 10, 14, 20] },
        ],
        female: [
          { ageMax: 29, bands: [9, 14, 20, 25] },
          { ageMax: 39, bands: [7, 12, 16, 21] },
          { ageMax: 49, bands: [5, 10, 13, 17] },
          { ageMax: 59, bands: [4, 7, 10, 13] },
          { ageMax: 200, bands: [3, 5, 8, 12] },
        ],
      };

      const norms = NORMS[sex];
      const bracket = norms.find((b) => age <= b.ageMax) ?? norms[norms.length - 1];
      const [below, avg, above, good] = bracket.bands;

      const segments: Segment[] = [
        { upTo: below, label: 'Below average', color: C.red },
        { upTo: avg, label: 'Average', color: C.amber },
        { upTo: above, label: 'Above average', color: C.teal },
        { upTo: good, label: 'Good', color: C.green },
        { upTo: 200, label: 'Excellent', color: C.blue },
      ];
      const band = bandFor(pushups, segments);
      const gaugeMax = Math.max(good + 15, pushups + 5);

      const ageBracketLabel = age <= 29 ? '20–29' : age <= 39 ? '30–39' : age <= 49 ? '40–49' : age <= 59 ? '50–59' : '60+';

      const rows: ResultRow[] = [
        { label: 'Percentile band', value: band.label, strong: true },
        { label: `Norm for ${sex === 'male' ? 'men' : 'women'} aged ${ageBracketLabel}`, value: `Excellent ≥ ${good + 1} reps` },
        { label: 'Average starts at', value: `${below + 1} reps` },
      ];

      // Optional plank assessment (general guidance, no formal age/sex norms).
      if (vals.plank > 0) {
        const plankBands: Array<{ upTo: number; label: string }> = [
          { upTo: 30, label: 'Needs improvement' },
          { upTo: 45, label: 'Average' },
          { upTo: 60, label: 'Good' },
          { upTo: 90, label: 'Very good' },
        ];
        const plankBand = plankBands.find((b) => vals.plank <= b.upTo) ?? { label: 'Excellent' };
        rows.push({ label: 'Plank hold', value: `${fmt(vals.plank, 0)} sec — ${plankBand.label}`, strong: true });
      }

      return {
        ok: true,
        primaryLabel: 'Push-up score',
        primaryValue: `${fmt(pushups, 0)} reps`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: pushups, min: 0, max: gaugeMax, segments },
        rows,
        callout: {
          tone: 'info',
          text: 'Stop immediately if you feel chest pain, dizziness, or severe shortness of breath. These are red flags — seek medical care, not another rep.',
        },
        cta: {
          label: 'Build a strength program to improve →',
          href: '/tools/strength-program-builder',
        },
        note: `Norms are from the ACSM push-up test (reps to failure with proper form) for ${sex === 'male' ? 'men' : 'women'} in the ${ageBracketLabel} age bracket. Retest every 4–6 weeks under the same conditions to track progress. To improve: train push-ups or bench press 2–3× per week at 8–15 reps, progress with the Strength Program Builder, and manage recovery with the Recovery Time Calculator.`,
      };
    },
  },

  // ---- Flexibility & Mobility Score (at-home test battery) ----
  'flexibility-mobility-score': {
    slug: 'flexibility-mobility-score',
    heading: 'Score your flexibility & mobility',
    // These movement checkboxes do not use sex-dependent formulas or norms.
    hasSex: false,
    fields: [
      F.age(30),
      {
        key: 'sitReach', label: 'Sit-and-reach test', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'fingertips',
        help: 'Sit on the floor, legs straight, feet flat against a box/wall. Reach forward along your leg. Where do your fingertips reach?',
        options: [
          { value: 'short', label: "Can't reach toes" },
          { value: 'fingertips', label: 'Fingertips touch toes' },
          { value: 'past', label: 'Fingers 5+ cm past toes' },
          { value: 'palms', label: 'Palms flat on floor' },
        ],
      },
      {
        key: 'shoulder', label: 'Shoulder mobility test', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'partial',
        help: 'Reach one arm over the shoulder and the other up the back (zipper test). Can your fingertips touch?',
        options: [
          { value: 'fail', label: "Fail — can't reach" },
          { value: 'partial', label: 'Partial — close but no touch' },
          { value: 'pass', label: 'Pass — fingertips overlap' },
        ],
      },
      {
        key: 'ankle', label: 'Ankle mobility (knee-to-wall)', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'pass',
        help: 'Stand 10 cm from a wall. Keep heel down. Can your knee touch the wall? Move to 12 cm and retry.',
        options: [
          { value: 'fail', label: "Fail — can't reach at 10 cm" },
          { value: 'pass', label: 'Pass — reaches at 10 cm' },
          { value: 'good', label: 'Good — reaches at 12+ cm' },
        ],
      },
      {
        key: 'hip', label: 'Hip mobility (deep squat)', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'pass',
        help: 'Squat as low as possible with feet shoulder-width. Can you keep heels down and chest up?',
        options: [
          { value: 'fail', label: "Fail — can't reach parallel" },
          { value: 'partial', label: 'Partial — parallel but heels lift' },
          { value: 'pass', label: 'Pass — full deep squat, heels down' },
        ],
      },
    ],
    compute: ({ vals, selects }) => {
      const age = vals.age;

      // Points per test.
      const SIT_REACH: Record<string, number> = { short: 0, fingertips: 1, past: 2, palms: 3 };
      const SHOULDER: Record<string, number> = { fail: 0, partial: 1, pass: 2 };
      const ANKLE: Record<string, number> = { fail: 0, pass: 1, good: 2 };
      const HIP: Record<string, number> = { fail: 0, partial: 1, pass: 2 };

      const sitPts = SIT_REACH[selects.sitReach] ?? 1;
      const shldrPts = SHOULDER[selects.shoulder] ?? 1;
      const anklePts = ANKLE[selects.ankle] ?? 1;
      const hipPts = HIP[selects.hip] ?? 1;
      const raw = sitPts + shldrPts + anklePts + hipPts;

      // This is an educational, site-defined index, NOT standardized age/sex norms.
      // The four tasks have a raw maximum of 9 points. The age adjustment can
      // add at most 1 point, so its separate adjusted index has a maximum of 10.
      const ageBonus = age >= 50 ? 1 : age >= 40 ? 0.5 : 0;
      const rawMax = 9;
      const adjustedMax = 10;
      const adjusted = Math.min(adjustedMax, raw + ageBonus);

      const segments: Segment[] = [
        { upTo: 3, label: 'Below average', color: C.red },
        { upTo: 5, label: 'Average', color: C.amber },
        { upTo: 7, label: 'Above average', color: C.teal },
        { upTo: 9, label: 'Good', color: C.green },
        { upTo: 10, label: 'Excellent', color: C.blue },
      ];
      const band = bandFor(adjusted, segments);

      // Per-area breakdown with targeted suggestions.
      const areaColor = (pts: number, max: number): string => {
        const pct = pts / max;
        if (pct >= 0.85) return C.blue;
        if (pct >= 0.6) return C.green;
        if (pct >= 0.4) return C.teal;
        if (pct > 0) return C.amber;
        return C.red;
      };

      const SIT_LABELS: Record<string, string> = { short: "Can't reach toes", fingertips: 'Fingertips to toes', past: 'Past toes', palms: 'Palms flat' };
      const SHOULDER_LABELS: Record<string, string> = { fail: "Can't reach", partial: 'Close, no touch', pass: 'Overlap' };
      const ANKLE_LABELS: Record<string, string> = { fail: "Fail at 10 cm", pass: 'Pass at 10 cm', good: 'Good at 12+ cm' };
      const HIP_LABELS: Record<string, string> = { fail: "Can't parallel", partial: 'Parallel, heels lift', pass: 'Full squat' };

      const SUGGESTIONS: Record<string, string> = {
        sitReach: 'Seated forward fold + standing hamstring stretch. Hold 30 s × 3, daily.',
        shoulder: 'Doorway chest stretch, thread-the-needle, wall slides. 2 sets daily.',
        ankle: 'Wall calf stretch, ankle circles, foam roll calves. 2 sets daily.',
        hip: '90/90 hip stretch, deep squat hold, couch hip flexor stretch. 2 sets daily.',
      };

      const zones = [
        { label: 'Sit & reach (hamstrings)', detail: `${SIT_LABELS[selects.sitReach] ?? ''} — ${sitPts}/3`, color: areaColor(sitPts, 3) },
        { label: 'Shoulder mobility', detail: `${SHOULDER_LABELS[selects.shoulder] ?? ''} — ${shldrPts}/2`, color: areaColor(shldrPts, 2) },
        { label: 'Ankle mobility', detail: `${ANKLE_LABELS[selects.ankle] ?? ''} — ${anklePts}/2`, color: areaColor(anklePts, 2) },
        { label: 'Hip mobility', detail: `${HIP_LABELS[selects.hip] ?? ''} — ${hipPts}/2`, color: areaColor(hipPts, 2) },
      ];

      // Targeted suggestions for the weakest areas (below "good").
      const weakAreas: string[] = [];
      if (sitPts < 2) weakAreas.push(`Hamstrings: ${SUGGESTIONS.sitReach}`);
      if (shldrPts < 2) weakAreas.push(`Shoulders: ${SUGGESTIONS.shoulder}`);
      if (anklePts < 2) weakAreas.push(`Ankles: ${SUGGESTIONS.ankle}`);
      if (hipPts < 2) weakAreas.push(`Hips: ${SUGGESTIONS.hip}`);

      const suggestionText = weakAreas.length > 0
        ? `Focus areas: ${weakAreas.join('  ')}`
        : 'You scored well across all areas — maintain with 2–3 mobility sessions per week.';

      return {
        ok: true,
        primaryLabel: 'Illustrative adjusted mobility index',
        primaryValue: `${fmt(adjusted, 1)}/${adjustedMax}`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'zones', items: zones },
        rows: [
          { label: 'Four-test raw points', value: `${raw}/${rawMax}` },
          { label: 'Age adjustment', value: ageBonus > 0 ? `+${fmt(ageBonus, 1)} (age ${fmt(age, 0)})` : 'None', strong: ageBonus > 0 },
        ],
        callout: {
          tone: 'info',
          text: 'Never force a range of motion. Stretch to mild tension, not pain. Sharp pain means stop immediately — it signals strain, not progress. Mobility improves with consistent, gentle work, not aggressive forcing.',
        },
        note: `${suggestionText} Method: four tasks total up to 9 raw points (sit-reach 0–3, shoulder/ankle/hip 0–2 each). This site adds an illustrative age adjustment of +0.5 (40–49) or +1 (50+) for a separate adjusted index out of 10. The adjustment and category labels are not validated age- or sex-based population norms and do not estimate injury risk or diagnose a condition. Compare your task-level results using the same technique over time.`,
      };
    },
  },

  // ---- Vitamin D & Sun Exposure (educational estimator) ----
  'vitamin-d-sun-calculator': {
    slug: 'vitamin-d-sun-calculator',
    heading: 'Explore sun exposure conditions',
    hasSex: false,
    fields: [
      {
        key: 'skinType', label: 'Skin type (Fitzpatrick)', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'iii',
        help: 'Skin pigmentation affects UVB absorption, but skin type cannot determine a safe exposure time or vitamin D level.',
        options: [
          { value: 'i', label: 'Type I — Very fair, always burns, never tans' },
          { value: 'ii', label: 'Type II — Fair, easily burns, tans minimally' },
          { value: 'iii', label: 'Type III — Medium, burns moderately, tans gradually' },
          { value: 'iv', label: 'Type IV — Olive, burns minimally, tans well' },
          { value: 'v', label: 'Type V — Brown, rarely burns, tans darkly' },
          { value: 'vi', label: 'Type VI — Dark, never burns, tans darkly' },
        ],
      },
      {
        key: 'uvIndex', label: 'UV index at your location', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '3-5',
        help: 'Check your local UV index to plan sun protection. A higher UV index also means higher skin-damage risk.',
        options: [
          { value: '0-2', label: '0–2 (Low)' },
          { value: '3-5', label: '3–5 (Moderate)' },
          { value: '6-7', label: '6–7 (High)' },
          { value: '8-10', label: '8–10 (Very high)' },
          { value: '11+', label: '11+ (Extreme)' },
        ],
      },
      { key: 'timeOutdoors', label: 'Time outdoors midday', type: 'number', metricDefault: 15, min: 0, max: 600, suffix: 'min', allowZero: true, help: 'Enter time already spent outdoors; do not extend sun exposure to increase vitamin D.' },
      {
        key: 'skinExposed', label: 'Skin exposed', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'arms-face',
        help: 'More exposed skin can increase UV damage. Protect skin rather than exposing more to seek vitamin D.',
        options: [
          { value: 'face-hands', label: 'Face & hands only (~5%)' },
          { value: 'arms-face', label: 'Arms & face (~15%)' },
          { value: 'arms-legs', label: 'Arms & legs (~35%)' },
          { value: 'most-body', label: 'Most of body (~60%+)' },
        ],
      },
      {
        key: 'sunscreen', label: 'Sunscreen use', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'spf30',
        help: 'Do not delay sunscreen for vitamin D. Use shade, clothing, and broad-spectrum sunscreen when outdoors.',
        options: [
          { value: 'none', label: 'None' },
          { value: 'after', label: 'Applied only after initial sun exposure (not recommended)' },
          { value: 'spf30', label: 'SPF 30+ properly applied' },
        ],
      },
      {
        key: 'diet', label: 'Dietary vitamin D intake', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'occasional',
        help: 'Few foods naturally contain vitamin D. Fatty fish, fortified milk, and eggs are the main sources.',
        options: [
          { value: 'rarely', label: 'Rarely — few vitamin D foods' },
          { value: 'occasional', label: 'Occasionally — some dairy, eggs' },
          { value: 'regular', label: 'Regularly — fortified milk, eggs, weekly fish' },
          { value: 'frequent', label: 'Frequently — fatty fish 2–3×/week, fortified foods daily' },
          { value: 'supplement', label: 'Daily vitamin D supplement' },
        ],
      },
    ],
    compute: ({ vals, selects }) => {
      const skinType = selects.skinType || 'iii';
      const uvKey = selects.uvIndex || '3-5';
      const timeOutdoors = vals.timeOutdoors;
      const skinExposed = selects.skinExposed || 'arms-face';
      const sunscreen = selects.sunscreen || 'spf30';
      const diet = selects.diet || 'occasional';

      // Food frequency does not establish vitamin D intake or adequacy.
      const DIET: Record<string, string> = {
        rarely: 'Rarely reported',
        occasional: 'Occasionally reported',
        regular: 'Regularly reported',
        frequent: 'Frequently reported',
        supplement: 'Supplement reported (dose unknown)',
      };
      const dietInfo = DIET[diet] ?? DIET.occasional;

      const skinTypeLabel = `Type ${skinType.toUpperCase()}`;
      const uvLabel = uvKey;
      const sunscreenLabel = sunscreen === 'none' ? 'None reported' : sunscreen === 'after' ? 'Applied after exposure' : 'SPF 30+ reported';
      const needsProtectionReminder = sunscreen === 'none' || sunscreen === 'after';

      const dietNote = `Food-frequency answers cannot establish vitamin D intake or adequacy. Check food and supplement labels; ask a healthcare professional about your needs.`;

      return {
        ok: true,
        primaryLabel: 'Vitamin D & sun safety',
        primaryValue: 'No safe UV target',
        visual: { kind: 'none' },
        rows: [
          { label: 'Dietary vitamin D sources', value: dietInfo },
          { label: 'UV index', value: uvLabel },
          { label: 'Skin type', value: skinTypeLabel },
          { label: 'Time outdoors', value: `${fmt(timeOutdoors, 0)} min` },
          { label: 'Skin exposed', value: skinExposed.replaceAll('-', ' ') },
          { label: 'Sunscreen use', value: sunscreenLabel },
        ],
        callout: {
          tone: 'warn',
          text: `${needsProtectionReminder ? 'You reported no sunscreen or applying it only after initial exposure. Do not delay sun protection for vitamin D. ' : ''}UV exposure can damage skin. Check the local UV Index; use shade, protective clothing, and broad-spectrum sunscreen as directed. Discuss vitamin D concerns separately with a healthcare professional.`,
        },
        note: `These answers do NOT measure your vitamin D level, dose made by skin, or a safe UV duration. ${dietNote} A clinician can decide whether a 25(OH)D blood test is appropriate; routine testing is not needed for everyone.`,
      };
    },
  },

  // ---- Gut Health Score (lifestyle/diet, NOT a diagnosis) ----
  'gut-health-score': {
    slug: 'gut-health-score',
    heading: 'Score your gut habits',
    hasSex: false,
    fields: [
      {
        key: 'redFlags', label: 'Any digestive red flags?', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'none',
        help: 'If you have any of these, see a doctor — do not rely on this score.',
        options: [
          { value: 'none', label: 'None — just curious about my gut habits' },
          { value: 'blood', label: 'Blood in stool' },
          { value: 'weight', label: 'Unexplained weight loss' },
          { value: 'pain', label: 'Persistent pain or change in bowel habits' },
        ],
      },
      {
        key: 'fiber', label: 'Daily fiber intake', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'some',
        help: 'Fiber feeds gut bacteria. Aim for 25–35g/day from whole grains, veg, fruit, legumes.',
        options: [
          { value: 'low', label: 'Low — little fiber' },
          { value: 'some', label: 'Some — occasional whole grains, veg' },
          { value: 'good', label: 'Good — daily whole grains, veg, fruit' },
          { value: 'high', label: 'High — 30g+ fiber/day, lots of plants' },
        ],
      },
      {
        key: 'fermented', label: 'Fermented foods per week', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Yogurt, kefir, sauerkraut, kimchi, kombucha — these add live cultures to your gut.',
        options: [
          { value: 'rarely', label: 'Rarely' },
          { value: '1-2', label: '1–2 times/week' },
          { value: '3-5', label: '3–5 times/week' },
          { value: 'daily', label: 'Daily' },
        ],
      },
      {
        key: 'plantDiversity', label: 'Plant diversity (different plants/week)', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '10-20',
        help: 'Different plants feed different gut bacteria. Aim for 30+ types/week (grains, veg, fruit, nuts, seeds, herbs).',
        options: [
          { value: '0-10', label: '0–10 different plants' },
          { value: '10-20', label: '10–20 different plants' },
          { value: '20-30', label: '20–30 different plants' },
          { value: '30+', label: '30+ different plants' },
        ],
      },
      {
        key: 'water', label: 'Daily water intake', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Hydration keeps things moving through your digestive tract.',
        options: [
          { value: 'under-1', label: 'Under 1 L' },
          { value: '1-2', label: '1–2 L' },
          { value: '2-3', label: '2–3 L' },
          { value: '3+', label: '3+ L' },
        ],
      },
      {
        key: 'processed', label: 'Processed/ultra-processed food', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'several',
        help: 'Highly processed foods low in fiber and high in additives can disrupt gut bacteria.',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'several', label: 'Several times/week' },
          { value: 'occasionally', label: 'Occasionally' },
          { value: 'rarely', label: 'Rarely' },
        ],
      },
      {
        key: 'sleep', label: 'Sleep quality', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'fair',
        help: 'Poor sleep disrupts the gut-brain axis and gut rhythm.',
        options: [
          { value: 'poor', label: 'Poor' },
          { value: 'fair', label: 'Fair' },
          { value: 'good', label: 'Good' },
          { value: 'excellent', label: 'Excellent' },
        ],
      },
      {
        key: 'stress', label: 'Stress level', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'moderate',
        help: 'Chronic stress affects gut motility and the gut-brain connection.',
        options: [
          { value: 'high', label: 'High' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'low', label: 'Low' },
          { value: 'minimal', label: 'Minimal' },
        ],
      },
      {
        key: 'activity', label: 'Physical activity', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'light',
        help: 'Movement stimulates gut motility and is linked to a more diverse microbiome.',
        options: [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'light', label: 'Light — occasional walks' },
          { value: 'moderate', label: 'Moderate — 3–5×/week' },
          { value: 'active', label: 'Active — daily exercise' },
        ],
      },
      {
        key: 'regularity', label: 'Bowel-habit regularity', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'variable',
        help: 'General regularity only — not a clinical assessment. Regular = consistent timing and form.',
        options: [
          { value: 'irregular', label: 'Irregular — often constipated or loose' },
          { value: 'variable', label: 'Variable' },
          { value: 'fairly', label: 'Fairly regular' },
          { value: 'regular', label: 'Regular and consistent' },
        ],
      },
    ],
    compute: ({ selects }) => {
      const redFlag = selects.redFlags || 'none';

      // Points per factor. Key gut-health factors (fiber, plant diversity,
      // fermented) max 4; lifestyle factors max 3. Grand max = 30.
      const FIBER_PTS: Record<string, number> = { low: 0, some: 1, good: 2, high: 4 };
      const FERMENTED_PTS: Record<string, number> = { rarely: 0, '1-2': 1, '3-5': 2, daily: 4 };
      const PLANT_PTS: Record<string, number> = { '0-10': 0, '10-20': 1, '20-30': 2, '30+': 4 };
      const WATER_PTS: Record<string, number> = { 'under-1': 0, '1-2': 1, '2-3': 2, '3+': 3 };
      const PROCESSED_PTS: Record<string, number> = { daily: 0, several: 1, occasionally: 2, rarely: 3 };
      const SLEEP_PTS: Record<string, number> = { poor: 0, fair: 1, good: 2, excellent: 3 };
      const STRESS_PTS: Record<string, number> = { high: 0, moderate: 1, low: 2, minimal: 3 };
      const ACTIVITY_PTS: Record<string, number> = { sedentary: 0, light: 1, moderate: 2, active: 3 };
      const REGULARITY_PTS: Record<string, number> = { irregular: 0, variable: 1, fairly: 2, regular: 3 };

      const factors = [
        { name: 'Fiber intake', key: 'fiber', pts: FIBER_PTS[selects.fiber] ?? 1, max: 4, suggestion: 'Add whole grains, legumes, vegetables, and fruit. Aim for 25–35g fiber/day.' },
        { name: 'Plant diversity', key: 'plantDiversity', pts: PLANT_PTS[selects.plantDiversity] ?? 1, max: 4, suggestion: 'Eat 30+ different plants/week — nuts, seeds, herbs, and spices all count.' },
        { name: 'Fermented foods', key: 'fermented', pts: FERMENTED_PTS[selects.fermented] ?? 1, max: 4, suggestion: 'Add yogurt, kefir, sauerkraut, or kimchi 3–5×/week.' },
        { name: 'Hydration', key: 'water', pts: WATER_PTS[selects.water] ?? 1, max: 3, suggestion: 'Drink 2–3L water/day to keep digestion moving.' },
        { name: 'Processed foods (less is better)', key: 'processed', pts: PROCESSED_PTS[selects.processed] ?? 1, max: 3, suggestion: 'Swap ultra-processed snacks for whole foods.' },
        { name: 'Sleep', key: 'sleep', pts: SLEEP_PTS[selects.sleep] ?? 1, max: 3, suggestion: 'Aim for 7–9 hours — gut and brain are linked.' },
        { name: 'Stress (lower is better)', key: 'stress', pts: STRESS_PTS[selects.stress] ?? 1, max: 3, suggestion: 'Breathing, walks, or mindfulness calm the gut-brain axis.' },
        { name: 'Activity', key: 'activity', pts: ACTIVITY_PTS[selects.activity] ?? 1, max: 3, suggestion: 'Even a daily 20-minute walk improves gut motility.' },
        { name: 'Regularity', key: 'regularity', pts: REGULARITY_PTS[selects.regularity] ?? 1, max: 3, suggestion: 'Consistent meals, hydration, and movement support regularity.' },
      ];

      const total = factors.reduce((sum, f) => sum + f.pts, 0);
      const maxPts = 30;
      const score = Math.round((total / maxPts) * 100);

      const segments: Segment[] = [
        { upTo: 33, label: 'Needs improvement', color: C.red },
        { upTo: 50, label: 'Fair', color: C.amber },
        { upTo: 70, label: 'Good', color: C.teal },
        { upTo: 85, label: 'Very good', color: C.green },
        { upTo: 100, label: 'Excellent', color: C.blue },
      ];
      const band = bandFor(score, segments);

      // Per-factor zones with bars.
      const areaColor = (pts: number, max: number): string => {
        const pct = pts / max;
        if (pct >= 0.85) return C.blue;
        if (pct >= 0.6) return C.green;
        if (pct >= 0.4) return C.teal;
        if (pct > 0) return C.amber;
        return C.red;
      };

      const zones = factors.map((f) => ({
        label: f.name,
        detail: `${f.pts}/${f.max} pts`,
        color: areaColor(f.pts, f.max),
      }));

      // Top improvements: 2-3 lowest-scoring factors.
      const weakest = [...factors].sort((a, b) => a.pts / a.max - b.pts / b.max).slice(0, 3);
      const improvements = weakest.map((f) => `${f.name}: ${f.suggestion}`).join('  ');

      // Red flag label for the danger callout.
      const RED_FLAG_LABELS: Record<string, string> = {
        blood: 'Blood in stool',
        weight: 'Unexplained weight loss',
        pain: 'Persistent pain or change in bowel habits',
      };

      const hasRedFlag = redFlag !== 'none';
      const callout = hasRedFlag
        ? {
            tone: 'danger' as const,
            text: `⚠️ ${RED_FLAG_LABELS[redFlag] ?? 'Your symptom'} is a digestive red flag that needs prompt medical evaluation — do not rely on this score. See your doctor. Blood in stool, unexplained weight loss, or persistent changes in bowel habits can signal serious conditions that need clinical assessment, not lifestyle scoring.`,
          }
        : {
            tone: 'info' as const,
            text: 'Red flags that need prompt medical care: blood in stool, unexplained weight loss, persistent abdominal pain, or a lasting change in bowel habits. If you develop any of these, see a doctor — do not score them away with lifestyle changes alone.',
          };

      return {
        ok: true,
        primaryLabel: 'Gut-habits score',
        primaryValue: `${score}/100`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'zones', items: zones },
        rows: [
          { label: 'Total points', value: `${total}/${maxPts}` },
          { label: 'Top factor', value: factors.sort((a, b) => b.pts / b.max - a.pts / a.max)[0].name, strong: true },
        ],
        callout,
        note: hasRedFlag
          ? 'Your score reflects general gut-friendly habits only. Red-flag symptoms override any score — see a doctor promptly. This tool is not a microbiome test and does not diagnose any condition.'
          : `${improvements} Method: 9 factors scored on points (fiber, plant diversity, and fermented foods weighted higher at max 4; others max 3; grand max 30 → 0–100). This is a lifestyle self-check, not a microbiome test or diagnosis. Sources: Dietary Guidelines for Americans, NIH fiber recommendations.`,
      };
    },
  },

  // ---- Anti-Inflammatory Diet Score (food-frequency) ----
  'anti-inflammatory-score': {
    slug: 'anti-inflammatory-score',
    heading: 'Score your anti-inflammatory diet',
    hasSex: false,
    fields: [
      {
        key: 'vegetables', label: 'Vegetables', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '3-5',
        help: 'Leafy greens, cruciferous veg, tomatoes, peppers — rich in antioxidants and fiber.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'fruit', label: 'Fruit', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '3-5',
        help: 'Berries, citrus, apples — high in polyphenols and fiber.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'wholeGrains', label: 'Whole grains', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '3-5',
        help: 'Oats, brown rice, quinoa, whole wheat — vs refined grains.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'fattyFish', label: 'Fatty fish', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Salmon, sardines, mackerel — omega-3s (EPA/DHA) are powerfully anti-inflammatory.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'oliveOil', label: 'Olive oil', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '3-5',
        help: 'Extra virgin olive oil — oleic acid and polyphenols.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'nuts', label: 'Nuts', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Walnuts, almonds — healthy fats and antioxidants.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'legumes', label: 'Legumes', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Beans, lentils, chickpeas — fiber and plant protein.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'redMeat', label: 'Red / processed meat', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Beef, pork, bacon, sausage — high in saturated fat and inflammatory compounds. Less is better.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'refinedCarbs', label: 'Refined carbs', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'White bread, white rice, pastries — spike blood sugar. Less is better.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'sugaryDrinks', label: 'Sugary drinks', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Soda, energy drinks, sweet juice — liquid sugar drives inflammation. Less is better.',
        options: FREQ_OPTIONS,
      },
      {
        key: 'friedFood', label: 'Fried food', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Deep-fried foods — advanced glycation end products (AGEs). Less is better.',
        options: FREQ_OPTIONS,
      },
    ],
    compute: ({ selects }) => {
      // Anti-inflammatory foods: more is better (rarely=0 -> daily=3).
      // Pro-inflammatory foods: less is better (rarely=3 -> daily=0, inverse).
      const ANTI: Record<string, number> = { rarely: 0, '1-2': 1, '3-5': 2, daily: 3 };
      const PRO: Record<string, number> = { rarely: 3, '1-2': 2, '3-5': 1, daily: 0 };

      const antiFoods = [
        { name: 'Vegetables', freq: selects.vegetables, pts: ANTI[selects.vegetables] ?? 1, add: 'Add more vegetables — aim for 5+ servings/day, varied colours.' },
        { name: 'Fruit', freq: selects.fruit, pts: ANTI[selects.fruit] ?? 1, add: 'Add 2–3 fruit servings/day, especially berries and citrus.' },
        { name: 'Whole grains', freq: selects.wholeGrains, pts: ANTI[selects.wholeGrains] ?? 1, add: 'Swap refined grains for oats, brown rice, quinoa.' },
        { name: 'Fatty fish', freq: selects.fattyFish, pts: ANTI[selects.fattyFish] ?? 1, add: 'Aim for 2+ servings of fatty fish/week (salmon, sardines).' },
        { name: 'Olive oil', freq: selects.oliveOil, pts: ANTI[selects.oliveOil] ?? 1, add: 'Use extra virgin olive oil as your primary cooking fat.' },
        { name: 'Nuts', freq: selects.nuts, pts: ANTI[selects.nuts] ?? 1, add: 'A handful of nuts/day (walnuts, almonds).' },
        { name: 'Legumes', freq: selects.legumes, pts: ANTI[selects.legumes] ?? 1, add: 'Add beans or lentils 3+×/week.' },
      ];

      const proFoods = [
        { name: 'Red / processed meat', freq: selects.redMeat, pts: PRO[selects.redMeat] ?? 1, reduce: 'Limit red/processed meat to 1–2×/week; swap for fish or legumes.' },
        { name: 'Refined carbs', freq: selects.refinedCarbs, pts: PRO[selects.refinedCarbs] ?? 1, reduce: 'Replace white bread/rice with whole-grain versions.' },
        { name: 'Sugary drinks', freq: selects.sugaryDrinks, pts: PRO[selects.sugaryDrinks] ?? 1, reduce: 'Swap sugary drinks for water or unsweetened tea.' },
        { name: 'Fried food', freq: selects.friedFood, pts: PRO[selects.friedFood] ?? 1, reduce: 'Bake, grill, or air-fry instead of deep-frying.' },
      ];

      const allFoods = [...antiFoods, ...proFoods];
      const total = allFoods.reduce((sum, f) => sum + f.pts, 0);
      const maxPts = 33;
      const score = Math.round((total / maxPts) * 100);

      const segments: Segment[] = [
        { upTo: 33, label: 'Pro-inflammatory', color: C.red },
        { upTo: 50, label: 'Low anti-inflammatory', color: C.amber },
        { upTo: 70, label: 'Moderate', color: C.teal },
        { upTo: 85, label: 'Good', color: C.green },
        { upTo: 100, label: 'Strongly anti-inflammatory', color: C.blue },
      ];
      const band = bandFor(score, segments);

      // Per-food zones with bars.
      const areaColor = (pts: number): string => {
        if (pts >= 3) return C.blue;
        if (pts >= 2) return C.green;
        if (pts >= 1) return C.amber;
        return C.red;
      };

      const FREQ_LABEL: Record<string, string> = { rarely: 'Rarely', '1-2': '1-2/wk', '3-5': '3-5/wk', daily: 'Daily' };
      const zones = allFoods.map((f) => {
        const fl = FREQ_LABEL[f.freq] ?? f.freq ?? '';
        return {
          label: f.name,
          detail: `${fl} - ${f.pts}/3`,
          color: areaColor(f.pts),
        };
      });

      // Foods to ADD (anti-inflammatory, scoring 0-1) and REDUCE (pro-inflammatory, scoring 0-1).
      const toAdd = antiFoods.filter((f) => f.pts <= 1).map((f) => f.add);
      const toReduce = proFoods.filter((f) => f.pts <= 1).map((f) => f.reduce);
      const suggestions: string[] = [];
      if (toAdd.length > 0) suggestions.push(`Add: ${toAdd.join('  ')}`);
      if (toReduce.length > 0) suggestions.push(`Reduce: ${toReduce.join('  ')}`);
      const suggestionText = suggestions.length > 0
        ? suggestions.join('  ')
        : 'Your food choices are well-balanced — maintain your current pattern.';

      return {
        ok: true,
        primaryLabel: 'Anti-inflammatory diet score',
        primaryValue: `${score}/100`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'zones', items: zones },
        rows: [
          { label: 'Total points', value: `${total}/${maxPts}` },
          { label: 'Anti-inflammatory foods', value: `${antiFoods.reduce((s, f) => s + f.pts, 0)}/21`, strong: true },
          { label: 'Pro-inflammatory foods (inverted)', value: `${proFoods.reduce((s, f) => s + f.pts, 0)}/12` },
        ],
        callout: {
          tone: 'info',
          text: 'This pattern closely overlaps with the Mediterranean diet (vegetables, fruit, whole grains, fatty fish, olive oil, legumes, nuts) and the DASH diet (which additionally emphasizes low sodium for blood pressure). Following any of these patterns gives similar anti-inflammatory benefits.',
        },
        note: `${suggestionText} Method: 11 foods scored 0-3 each (anti-inflammatory foods: rarely=0->daily=3; pro-inflammatory foods: rarely=3->daily=0, inverted). Max 33 points -> 0-100 score. Inspired by published research on Mediterranean and anti-inflammatory dietary patterns - this is a transparent adherence score, not a licensed dietary index. Educational only.`,
      };
    },
  },

  // ---- Blue Light Exposure Estimator ----
  'blue-light-exposure-estimator': {
    slug: 'blue-light-exposure-estimator',
    heading: 'Score your evening light hygiene',
    hasSex: false,
    fields: [
      {
        key: 'bedtime', label: 'Usual bedtime', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '23',
        help: 'Contextual only — does not affect your score, but helps tailor tips.',
        options: [
          { value: '21', label: '9 PM' },
          { value: '22', label: '10 PM' },
          { value: '23', label: '11 PM' },
          { value: '0', label: '12 AM' },
          { value: '1', label: '1 AM' },
          { value: '2', label: '2 AM or later' },
        ],
      },
      {
        key: 'preBed', label: 'Screen time in the hour before bed', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'The hour closest to bedtime has the biggest circadian impact.',
        options: [
          { value: '0', label: 'None' },
          { value: '<30', label: 'Under 30 min' },
          { value: '30-60', label: '30-60 min' },
          { value: '1-2', label: '1-2 hours' },
          { value: '2+', label: '2+ hours' },
        ],
      },
      {
        key: 'evening', label: 'Total screen time after dinner', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '1-2',
        help: 'Includes all screens: phone, tablet, laptop, TV.',
        options: [
          { value: '0', label: 'None' },
          { value: '<1', label: 'Under 1 hour' },
          { value: '1-2', label: '1-2 hours' },
          { value: '2-3', label: '2-3 hours' },
          { value: '3+', label: '3+ hours' },
        ],
      },
      {
        key: 'device', label: 'Primary device before bed', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'phone',
        help: 'Closer and brighter screens have more impact. Phones are held nearest the eyes.',
        options: [
          { value: 'phone', label: 'Phone' },
          { value: 'tablet', label: 'Tablet' },
          { value: 'laptop', label: 'Laptop' },
          { value: 'tv', label: 'TV (across the room)' },
          { value: 'ereader', label: 'E-reader (e-ink)' },
          { value: 'none', label: 'No screen before bed' },
        ],
      },
      {
        key: 'nightMode', label: 'Night mode / blue-light filter', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'sometimes',
        help: 'Night Shift (Apple), f.lux, Twilight, or built-in warm modes.',
        options: [
          { value: 'always', label: 'Always on in the evening' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'never', label: 'Never / not aware of it' },
          { value: 'dont', label: "My device doesn't have one" },
        ],
      },
      {
        key: 'roomLight', label: 'Room lighting in the evening', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'normal',
        help: 'Warm, dim light signals evening to your circadian system.',
        options: [
          { value: 'bright', label: 'Bright overhead lights' },
          { value: 'normal', label: 'Normal room lighting' },
          { value: 'dim', label: 'Dim / warm lamps' },
          { value: 'dark', label: 'Mostly dark' },
        ],
      },
      {
        key: 'curfew', label: 'Screen-free time before bed', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'none',
        help: 'How long before bedtime do you put all screens away?',
        options: [
          { value: '60+', label: '60+ minutes' },
          { value: '30-60', label: '30-60 minutes' },
          { value: '15-30', label: '15-30 minutes' },
          { value: 'none', label: 'None — screens until bed' },
        ],
      },
    ],
    compute: ({ selects }) => {
      const PREBED: Record<string, number> = { '0': 10, '<30': 8, '30-60': 5, '1-2': 2, '2+': 0 };
      const EVENING: Record<string, number> = { '0': 8, '<1': 6, '1-2': 4, '2-3': 2, '3+': 0 };
      const DEVICE: Record<string, number> = { phone: 0, tablet: 4, laptop: 3, tv: 6, ereader: 6, none: 6 };
      const NIGHT: Record<string, number> = { always: 8, sometimes: 4, never: 0, dont: 2 };
      const ROOM: Record<string, number> = { bright: 0, normal: 2, dim: 4, dark: 5 };
      const CURFEW: Record<string, number> = { '60+': 3, '30-60': 2, '15-30': 1, none: 0 };

      const BEDTIME_LABEL: Record<string, string> = { '21': '9 PM', '22': '10 PM', '23': '11 PM', '0': '12 AM', '1': '1 AM', '2': '2 AM or later' };
      const DEVICE_LABEL: Record<string, string> = { phone: 'Phone', tablet: 'Tablet', laptop: 'Laptop', tv: 'TV', ereader: 'E-reader', none: 'No screen' };
      const btLabel = BEDTIME_LABEL[selects.bedtime] ?? 'bedtime';

      const factors = [
        { name: 'Pre-bed screen', pts: PREBED[selects.preBed] ?? 2, max: 10 },
        { name: 'Evening screen total', pts: EVENING[selects.evening] ?? 4, max: 8 },
        { name: 'Device type', pts: DEVICE[selects.device] ?? 0, max: 6 },
        { name: 'Night mode / filter', pts: NIGHT[selects.nightMode] ?? 4, max: 8 },
        { name: 'Room lighting', pts: ROOM[selects.roomLight] ?? 2, max: 5 },
        { name: 'Screen curfew', pts: CURFEW[selects.curfew] ?? 0, max: 3 },
      ];

      const total = factors.reduce((s, f) => s + f.pts, 0);
      const maxPts = 40;
      const score = Math.round((total / maxPts) * 100);

      const segments: Segment[] = [
        { upTo: 25, label: 'Poor', color: C.red },
        { upTo: 50, label: 'Below average', color: C.amber },
        { upTo: 70, label: 'Moderate', color: C.teal },
        { upTo: 85, label: 'Good', color: C.green },
        { upTo: 100, label: 'Excellent', color: C.blue },
      ];
      const band = bandFor(score, segments);

      const areaColor = (pts: number, max: number): string => {
        const r = pts / max;
        if (r >= 0.75) return C.blue;
        if (r >= 0.5) return C.green;
        if (r >= 0.25) return C.amber;
        return C.red;
      };

      const zones = factors.map((f) => ({
        label: f.name,
        detail: `${f.pts}/${f.max}`,
        color: areaColor(f.pts, f.max),
      }));

      const tips: string[] = [];
      if ((PREBED[selects.preBed] ?? 2) <= 5)
        tips.push(`Try a 30-min screen curfew before ${btLabel} — even a short break helps your wind-down.`);
      if ((DEVICE[selects.device] ?? 0) === 0)
        tips.push('Phones are held closest to the eyes — switch to a larger screen further away, or use audio-only.');
      if ((NIGHT[selects.nightMode] ?? 4) <= 2)
        tips.push(`Enable night mode or a blue-light filter (Night Shift, f.lux, Twilight) starting 2h before ${btLabel}.`);
      if ((ROOM[selects.roomLight] ?? 2) <= 2)
        tips.push('Dim overhead lights after dinner — warm lamp light signals evening to your brain.');
      if ((CURFEW[selects.curfew] ?? 0) <= 1)
        tips.push(`Build a screen curfew: aim for 30-60 min screen-free before ${btLabel}.`);
      if ((EVENING[selects.evening] ?? 4) <= 2)
        tips.push('Reduce overall evening screen time — your circadian system reads light late at night.');
      if (tips.length === 0)
        tips.push('Your evening light hygiene is solid. Maintain your current habits.');

      return {
        ok: true,
        primaryLabel: 'Evening light hygiene score',
        primaryValue: `${score}/100`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'zones', items: zones },
        rows: [
          { label: 'Total points', value: `${total}/${maxPts}` },
          { label: 'Primary device', value: DEVICE_LABEL[selects.device] ?? 'Phone', strong: true },
        ],
        callout: {
          tone: 'info',
          text: 'This is a habit score based on general circadian and sleep guidance. It does not measure melatonin suppression or circadian phase shift. Individual sensitivity to evening light varies. Educational only — not medical advice.',
        },
        note: `${tips.join('  ')} Method: 6 factors scored on points (pre-bed screen max 10, evening total max 8, device type max 6, night mode max 8, room lighting max 5, curfew max 3; grand max 40 -> 0-100). Your bedtime (${btLabel}) is contextual and does not affect the score. Sources: Harvard Health (blue light and sleep), CDC (sleep hygiene), Chang et al. (evening iPad reading).`,
      };
    },
  },

  // ---- Steps to Calories / Distance ----
  'steps-to-calories-calculator': {
    slug: 'steps-to-calories-calculator',
    heading: 'Convert your steps',
    hasSex: true,
    fields: [
      { key: 'steps', label: 'Steps taken', type: 'number', metricDefault: 8000, min: 0, max: 60000, allowZero: true, suffix: 'steps', help: 'Enter whole steps. Daily activity bands apply only to a full-day step total.' },
      F.height(170),
      F.weight(72),
    ],
    compute: ({ vals, sex, units }) => {
      // Step counts are nonnegative integers; the public input limit is 60,000.
      if (!Number.isInteger(vals.steps) || vals.steps < 0 || vals.steps > 60000) {
        return { ok: false, error: 'Enter a whole-number step count from 0 to 60,000.', primaryLabel: '', primaryValue: '', visual: { kind: 'none' } };
      }
      const strideCm = vals.height * (sex === 'female' ? 0.413 : 0.415);
      const distanceKm = (vals.steps * (strideCm / 100)) / 1000;
      const hours = distanceKm / 4.8; // assume ~moderate walking pace
      // Gross MET kcal include a 1-MET resting component; this site-defined
      // comparison is not measured active energy or an added food allowance.
      const cal = 3.5 * vals.weight * hours;
      const aboveRestCal = (3.5 - 1) * vals.weight * hours;
      const gaugeMax = Math.max(15000, Math.ceil(vals.steps / 1000) * 1000);
      // Round only the displayed distance through micro-km precision before
      // two-decimal formatting to avoid binary half-step artifacts (7.055 km
      // must display as 7.06 km). Keep the full distance for calorie math.
      const displayKm = Math.round(distanceKm * 1e6) / 1e6;
      const distStr = units === 'metric' ? `${fmt(displayKm, 2)} km` : `${fmt(displayKm * 0.621371, 2)} mi`;
      const strideStr = units === 'metric' ? `${fmt(strideCm, 0)} cm` : `${fmt(strideCm / 2.54, 1)} in`;
      // Adult pedometer bands are defined for FULL-DAY steps, not one walk.
      const segments: Segment[] = [
        { upTo: 4999, label: 'Sedentary', color: C.red },
        { upTo: 7499, label: 'Low active', color: C.amber },
        { upTo: 9999, label: 'Somewhat active', color: C.teal },
        { upTo: 12499, label: 'Active', color: C.green },
        { upTo: gaugeMax, label: 'Highly active', color: C.blue },
      ];
      const band = bandFor(vals.steps, segments);
      return {
        ok: true,
        primaryLabel: 'Estimated gross walking calories',
        primaryValue: `${fmt(cal, 0)} kcal`,
        category: { label: 'If full-day total: ' + band.label, color: band.color },
        visual: { kind: 'gauge', value: vals.steps, min: 0, max: gaugeMax, segments },
        rows: [
          { label: 'Distance walked', value: distStr, strong: true },
          { label: 'Estimated step length', value: strideStr },
          { label: 'Assumed walking time', value: fmt(hours * 60, 0) + ' min' },
          { label: 'Approx. above-rest walking energy', value: fmt(aboveRestCal, 0) + ' kcal' },
          { label: 'Optional daily goal', value: '10,000 steps' },
        ],
        note: 'Gross calories include estimated resting energy during this assumed walk. Above-rest energy uses (3.5 - 1) MET as an illustrative difference, not measured active calories or extra calories to eat. The model estimates step length as height × 0.413 (women) or 0.415 (men) and assumes every step was taken at 4.8 km/h (3 mph) on level ground at 3.5 MET. Actual pace, stride, hills, stops and terrain affect energy use. Adult daily activity-band labels apply only if these steps represent your FULL-day total, never a single walk or a health diagnosis.',
      };
    },
  },

  // ---- VO2 Max Estimator (Uth–Sørensen) ----
  'vo2-max-calculator': {
    slug: 'vo2-max-calculator',
    heading: 'Estimate your VO₂ max',
    hasSex: false,
    fields: [
      F.age(30),
      { key: 'rest', label: 'Resting heart rate', type: 'number', metricDefault: 60, min: 30, max: 120, suffix: 'bpm', help: 'Measure your pulse at rest, ideally just after waking.' },
    ],
    compute: ({ vals }) => {
      const hrMax = 220 - vals.age;
      const vo2 = 15.3 * (hrMax / vals.rest);
      const fitnessAge = Math.max(18, Math.min(90, Math.round(0.5 * vals.age + 50 - vo2)));
      const segments: Segment[] = [
        { upTo: 30, label: 'Below average', color: C.red },
        { upTo: 40, label: 'Fair', color: C.amber },
        { upTo: 50, label: 'Good', color: C.teal },
        { upTo: 60, label: 'Excellent', color: C.green },
        { upTo: 80, label: 'Superior', color: C.blue },
      ];
      const band = bandFor(vo2, segments);
      return {
        ok: true,
        primaryLabel: 'Estimated VO2 max',
        primaryValue: `${fmt(vo2, 1)} ml/kg/min`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: vo2, min: 20, max: 70, segments },
        rows: [
          { label: 'Fitness age', value: `${fmt(fitnessAge, 0)} years`, strong: true },
          { label: 'Chronological age', value: `${fmt(vals.age, 0)} years` },
          { label: 'Estimated max heart rate', value: `${fmt(hrMax, 0)} bpm` },
          { label: 'Resting heart rate', value: `${fmt(vals.rest, 0)} bpm` },
        ],
        callout: {
          tone: 'info',
          text: fitnessAge < vals.age
            ? `Your VO2 max is typical of someone about ${fitnessAge} years old — ${vals.age - fitnessAge} years younger than your actual age. This suggests above-average cardio fitness for your age.`
            : fitnessAge > vals.age
              ? `Your VO2 max is typical of someone about ${fitnessAge} years old — ${fitnessAge - vals.age} years older than your actual age. This suggests room to improve cardio fitness.`
              : `Your VO2 max is typical for your actual age (${vals.age}).`,
        },
        note: 'Uses the Uth-Sorensen estimate: VO2 max ~ 15.3 x (max HR / resting HR). Fitness age compares your VO2 max to age-normative averages (approx 50 - 0.5 x age). Both are rough estimates — healthy ranges depend on age and sex. Educational only.',
      };
    },
  },

  // ============================================================
  // Health Risk (educational, non-diagnostic)
  // ============================================================
  // None of these diagnose disease or calculate any medication dose.

  // ---- Waist-based Health Risk ----
  'waist-health-risk-calculator': {
    slug: 'waist-health-risk-calculator',
    heading: 'Check your waist-based risk',
    hasSex: false,
    fields: [F.weight(78), F.height(172), F.waist(92)],
    compute: ({ vals, units }) => {
      const m = vals.height / 100;
      const bmi = vals.weight / (m * m);
      const whtr = vals.waist / vals.height;
      const bmiScore = bmi < 25 ? 0 : bmi < 30 ? 1 : bmi < 35 ? 2 : 3;
      const whtrScore = whtr < 0.5 ? 0 : whtr < 0.6 ? 1 : 2;
      const total = bmiScore + whtrScore;
      const bands = [
        { label: 'Low', color: C.green },
        { label: 'Increased', color: C.amber },
        { label: 'High', color: C.red },
        { label: 'Very high', color: '#b91c1c' },
      ];
      const idx = total === 0 ? 0 : total <= 2 ? 1 : total <= 4 ? 2 : 3;
      const band = bands[idx];
      const lowKg = 18.5 * m * m;
      const highKg = 24.9 * m * m;
      const waistTarget = units === 'metric' ? `${fmt(vals.height / 2, 0)} cm` : `${fmt(vals.height / 2 / 2.54, 0)} in`;
      return {
        ok: true,
        primaryLabel: 'Your BMI',
        primaryValue: fmt(bmi, 1),
        category: { label: `${band.label} risk`, color: band.color },
        visual: {
          kind: 'zones',
          items: bands.map((b, i) => ({ label: `${b.label} risk`, detail: '', color: b.color, active: i === idx })),
        },
        callout: idx >= 2
          ? { tone: 'warn', text: 'Your combined measurements suggest higher health risk. This is not a diagnosis — please talk to your doctor about your weight and waist.' }
          : undefined,
        rows: [
          { label: 'Waist-to-height ratio', value: fmt(whtr, 2), strong: true },
          { label: 'Healthy weight for height', value: `${fmtMass(lowKg, units, 0)} – ${fmtMass(highKg, units, 0)}` },
          { label: 'Keep waist under', value: waistTarget },
        ],
        note: 'Combines BMI with waist-to-height ratio. This is an educational estimate, not a diagnosis — see a doctor for a proper assessment.',
      };
    },
  },

  // ---- Heart Disease Risk (educational) ----
  'heart-disease-risk-calculator': {
    slug: 'heart-disease-risk-calculator',
    heading: 'Estimate your heart disease risk',
    hasSex: false,
    fields: [
      F.age(50), F.weight(82), F.height(172),
      { key: 'smoking', label: 'Smoking', type: 'select', metricDefault: 0, min: 0, max: 0, selectDefault: '0',
        options: [{ value: '0', label: 'Never smoked' }, { value: '1', label: 'Former smoker' }, { value: '3', label: 'Current smoker' }] },
      { key: 'activity', label: 'Physical activity', type: 'select', metricDefault: 0, min: 0, max: 0, selectDefault: '1',
        options: [{ value: '0', label: 'Active most days' }, { value: '1', label: 'Moderately active' }, { value: '2', label: 'Rarely active' }] },
      { key: 'bp', label: 'Blood pressure', type: 'select', metricDefault: 0, min: 0, max: 0, selectDefault: '0',
        options: [{ value: '0', label: 'Normal (under 120/80)' }, { value: '1', label: 'Elevated' }, { value: '2', label: 'High (130/80 or above)' }] },
    ],
    compute: ({ vals, selects }) => {
      const age = vals.age;
      const bmi = vals.weight / ((vals.height / 100) ** 2);
      const ageP = age < 40 ? 0 : age < 55 ? 1 : age < 65 ? 2 : 3;
      const smokeP = parseInt(selects.smoking) || 0;
      const actP = parseInt(selects.activity) || 0;
      const bmiP = bmi < 25 ? 0 : bmi < 30 ? 1 : 2;
      const bpP = parseInt(selects.bp) || 0;
      const score = ageP + smokeP + actP + bmiP + bpP;
      const bands = [{ label: 'Lower', color: C.green }, { label: 'Moderate', color: C.amber }, { label: 'Elevated', color: C.red }];
      const idx = score <= 3 ? 0 : score <= 7 ? 1 : 2;
      const band = bands[idx];
      return {
        ok: true,
        primaryLabel: 'Educational risk score',
        primaryValue: `${score} / 12`,
        category: { label: `${band.label} risk`, color: band.color },
        visual: { kind: 'zones', items: bands.map((b, i) => ({ label: `${b.label} risk`, detail: '', color: b.color, active: i === idx })) },
        callout: { tone: idx === 2 ? 'warn' : 'info', text: 'This is an educational estimate, not a diagnosis or a clinical risk score. Talk to your doctor, who can assess your real heart disease risk and check your cholesterol and blood pressure.' },
        rows: [
          { label: 'Age', value: `+${ageP}` },
          { label: 'Smoking', value: `+${smokeP}` },
          { label: 'Activity', value: `+${actP}` },
          { label: 'BMI', value: `+${bmiP} (${fmt(bmi, 1)})` },
          { label: 'Blood pressure', value: `+${bpP}` },
        ],
        note: 'A simple lifestyle-based estimate for education only — it is not the Framingham or any clinical score. Not smoking, staying active, and managing blood pressure and weight all lower real risk. Sources: CDC and American Heart Association.',
      };
    },
  },

  // ---- Type 2 Diabetes Risk (educational) ----
  'diabetes-risk-calculator': {
    slug: 'diabetes-risk-calculator',
    heading: 'Estimate your type 2 diabetes risk',
    hasSex: false,
    fields: [
      F.age(50), F.weight(85), F.height(172), F.waist(96),
      { key: 'family', label: 'Family history of diabetes', type: 'select', metricDefault: 0, min: 0, max: 0, selectDefault: '0',
        options: [{ value: '0', label: 'No close relatives' }, { value: '5', label: 'Parent, brother or sister' }] },
      { key: 'activity', label: 'Physically active most days', type: 'select', metricDefault: 0, min: 0, max: 0, selectDefault: '0',
        options: [{ value: '0', label: 'Yes' }, { value: '2', label: 'No' }] },
    ],
    compute: ({ vals, selects }) => {
      const age = vals.age;
      const bmi = vals.weight / ((vals.height / 100) ** 2);
      const whtr = vals.waist / vals.height;
      const ageP = age < 45 ? 0 : age < 55 ? 2 : age < 65 ? 3 : 4;
      const bmiP = bmi < 25 ? 0 : bmi < 30 ? 1 : 3;
      const waistP = whtr < 0.5 ? 0 : whtr < 0.6 ? 2 : 4;
      const famP = parseInt(selects.family) || 0;
      const actP = parseInt(selects.activity) || 0;
      const score = ageP + bmiP + waistP + famP + actP;
      const bands = [{ label: 'Low', color: C.green }, { label: 'Moderate', color: C.amber }, { label: 'High', color: C.red }];
      const idx = score <= 6 ? 0 : score <= 11 ? 1 : 2;
      const band = bands[idx];
      return {
        ok: true,
        primaryLabel: 'Educational risk score',
        primaryValue: `${score} / 18`,
        category: { label: `${band.label} risk`, color: band.color },
        visual: { kind: 'zones', items: bands.map((b, i) => ({ label: `${b.label} risk`, detail: '', color: b.color, active: i === idx })) },
        callout: { tone: 'warn', text: 'This does not diagnose diabetes. Please ask your doctor about a simple blood-sugar screening test (such as HbA1c or fasting glucose) — strongly recommended if your score is moderate or high, or if you have any symptoms.' },
        rows: [
          { label: 'Age', value: `+${ageP}` },
          { label: 'BMI', value: `+${bmiP} (${fmt(bmi, 1)})` },
          { label: 'Waist-to-height', value: `+${waistP} (${fmt(whtr, 2)})` },
          { label: 'Family history', value: `+${famP}` },
          { label: 'Inactivity', value: `+${actP}` },
        ],
        note: 'An educational, non-diagnostic estimate inspired by tools like FINDRISC. Only a blood test can detect prediabetes or diabetes. Sources: CDC and American Diabetes Association.',
      };
    },
  },

  // ---- Smoking Cost Calculator ----
  'smoking-cost-calculator': {
    slug: 'smoking-cost-calculator',
    heading: 'Calculate your smoking cost',
    hasSex: false,
    fields: [
      { key: 'packs', label: 'Packs per day', type: 'number', metricDefault: 1, min: 0.1, max: 10, step: 0.5 },
      { key: 'price', label: 'Price per pack', type: 'number', metricDefault: 10, min: 1, max: 50, step: 0.5, suffix: 'your currency' },
      { key: 'years', label: 'Years smoking', type: 'number', metricDefault: 10, min: 1, max: 70, suffix: 'years' },
    ],
    compute: ({ vals }) => {
      const perYear = vals.packs * vals.price * 365;
      const total = perYear * vals.years;
      return {
        ok: true,
        primaryLabel: `Spent over ${fmt(vals.years, 0)} years (your currency)`,
        primaryValue: fmt(total, 0),
        visual: { kind: 'none' },
        callout: { tone: 'info', text: 'Quitting pays off fast: heart rate drops within 20 minutes, carbon-monoxide levels normalise within a day, and your risk of heart disease falls sharply within a year. Free help: call a quitline (US 1-800-QUIT-NOW; UK 0300 123 1044; or your national service).' },
        rows: [
          { label: 'Per year', value: fmt(perYear, 0), strong: true },
          { label: 'Per month', value: fmt(perYear / 12, 0) },
          { label: 'Per week', value: fmt(vals.packs * vals.price * 7, 0) },
          { label: 'Cigarettes/day (20 per pack)', value: fmt(vals.packs * 20, 0) },
        ],
        note: 'A simple cost estimate in your local currency. This is educational, not medical advice — your doctor or a quitline can help you stop smoking safely.',
      };
    },
  },

  // ---- Alcohol Units Calculator ----
  'alcohol-units-calculator': {
    slug: 'alcohol-units-calculator',
    heading: 'Calculate your weekly alcohol units',
    hasSex: false,
    fields: [
      { key: 'beer', label: 'Pints of beer per week', type: 'number', metricDefault: 4, min: 0, max: 100, step: 0.5, allowZero: true },
      { key: 'wine', label: 'Glasses of wine (175ml) per week', type: 'number', metricDefault: 3, min: 0, max: 100, step: 0.5, allowZero: true },
      { key: 'spirits', label: 'Single spirits (25ml) per week', type: 'number', metricDefault: 2, min: 0, max: 100, step: 0.5, allowZero: true },
    ],
    compute: ({ vals }) => {
      const units = vals.beer * 2.3 + vals.wine * 2.1 + vals.spirits * 1.0;
      const bands = [{ label: 'Low risk', color: C.green }, { label: 'Increasing risk', color: C.amber }, { label: 'High risk', color: C.red }];
      const idx = units <= 14 ? 0 : units <= 35 ? 1 : 2;
      const band = bands[idx];
      return {
        ok: true,
        primaryLabel: 'Weekly alcohol units',
        primaryValue: `${fmt(units, 1)} units`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'zones', items: bands.map((b, i) => ({ label: b.label, detail: '', color: b.color, active: i === idx })) },
        callout: idx > 0
          ? { tone: 'warn', text: 'You are drinking above the low-risk guideline. Cutting down lowers your risk — try several drink-free days a week, and speak to your doctor if you find it hard to cut back.' }
          : undefined,
        rows: [
          { label: 'From beer', value: `${fmt(vals.beer * 2.3, 1)} units` },
          { label: 'From wine', value: `${fmt(vals.wine * 2.1, 1)} units` },
          { label: 'From spirits', value: `${fmt(vals.spirits * 1.0, 1)} units` },
          { label: 'Daily average', value: `${fmt(units / 7, 1)} units`, strong: true },
        ],
        note: 'UK Chief Medical Officers advise keeping to 14 units a week or less, spread over 3+ days. (The US measures "standard drinks" of 14g instead.) This is educational only — talk to your doctor about your drinking.',
      };
    },
  },
};

export const getDef = (slug: string): CalcDef | undefined => DEFS[slug];
