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
      const baselineMl = 35 * vals.weight;
      const extraMl = parseFloat(selects.activity) || 0;
      const totalMl = baselineMl + extraMl;
      const liters = totalMl / 1000;
      const oz = totalMl / 29.5735;
      return {
        ok: true,
        primaryLabel: 'Recommended water intake',
        primaryValue: `${fmt(liters, 1)} L/day`,
        visual: { kind: 'none' },
        rows: [
          { label: 'In fluid ounces', value: `${fmt(oz, 0)} oz`, strong: true },
          { label: 'Roughly in cups (8 oz)', value: `${fmt(oz / 8, 0)} cups` },
          { label: 'Baseline (35 ml/kg)', value: `${fmt(baselineMl / 1000, 1)} L` },
        ],
        note: 'Based on ~35 ml per kg of body weight plus an activity adjustment. Drink more in heat, illness or pregnancy; food provides roughly 20% of your fluids.',
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
      F.age(30),
      { key: 'rest', label: 'Resting heart rate', type: 'number', metricDefault: 65, min: 30, max: 120, suffix: 'bpm', help: 'Your pulse at rest, ideally measured first thing in the morning.' },
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
      const Z = ['#3b82f6', '#14b8a6', '#16a34a', '#f59e0b', '#ef4444'];
      const bands = [
        { lo: 0.5, hi: 0.6, name: 'Zone 1 · Very light', desc: 'Warm-up & recovery' },
        { lo: 0.6, hi: 0.7, name: 'Zone 2 · Light', desc: 'Fat burning' },
        { lo: 0.7, hi: 0.8, name: 'Zone 3 · Moderate', desc: 'Aerobic endurance' },
        { lo: 0.8, hi: 0.9, name: 'Zone 4 · Hard', desc: 'Anaerobic threshold' },
        { lo: 0.9, hi: 1.0, name: 'Zone 5 · Maximum', desc: 'Peak effort' },
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
        primaryLabel: 'Maximum heart rate',
        primaryValue: `${fmt(hrMax, 0)} bpm`,
        visual: { kind: 'zones', items },
        rows: [
          { label: 'Resting heart rate', value: `${fmt(rest, 0)} bpm` },
          { label: 'Heart-rate reserve', value: `${fmt(reserve, 0)} bpm` },
          { label: 'Method', value: formula === 'tanaka' ? 'Tanaka (208 − 0.7 × age)' : '220 − age' },
        ],
        note: 'Zones use the Karvonen method: target = ((max − resting) × intensity) + resting. These are estimates; your true maximum can vary by 10–12 bpm.',
      };
    },
  },

  // ---- Max Heart Rate ----
  'max-heart-rate-calculator': {
    slug: 'max-heart-rate-calculator',
    heading: 'Estimate your maximum heart rate',
    hasSex: false,
    fields: [
      F.age(30),
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
      return {
        ok: true,
        primaryLabel: 'Estimated maximum heart rate',
        primaryValue: `${fmt(hrMax, 0)} bpm`,
        visual: { kind: 'none' },
        rows: [
          { label: '220 − age', value: `${fmt(standard, 0)} bpm`, strong: formula !== 'tanaka' },
          { label: 'Tanaka (208 − 0.7 × age)', value: `${fmt(tanaka, 0)} bpm`, strong: formula === 'tanaka' },
        ],
        note: 'The simple 220 − age formula is widely used but has a wide error margin (±10–12 bpm). The Tanaka equation is often more accurate, especially for older adults.',
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
        { key: 'crisis', label: 'Hypertensive crisis', color: '#b91c1c', detail: 'Over 180 / over 120 mmHg' },
      ];
      let key: string;
      if (s > 180 || d > 120) key = 'crisis';
      else if (s >= 140 || d >= 90) key = 'stage2';
      else if (s >= 130 || d >= 80) key = 'stage1';
      else if (s >= 120) key = 'elevated';
      else key = 'normal';
      const cat = cats.find((c) => c.key === key)!;
      const items = cats.map((c) => ({ label: c.label, detail: c.detail, color: c.color, active: c.key === key }));
      let callout: CalcResult['callout'];
      if (key === 'crisis') {
        callout = { tone: 'danger', text: 'A reading this high may be a hypertensive crisis. If you also have chest pain, shortness of breath, weakness, or trouble speaking, call emergency services now. Otherwise, wait 5 minutes, take it again, and contact your doctor urgently.' };
      } else if (key === 'stage2') {
        callout = { tone: 'warn', text: 'Stage 2 high blood pressure usually needs medical treatment. Please see your doctor to discuss these readings.' };
      }
      return {
        ok: true,
        primaryLabel: 'Your reading',
        primaryValue: `${fmt(s, 0)}/${fmt(d, 0)} mmHg`,
        category: { label: cat.label, color: cat.color },
        visual: { kind: 'zones', items },
        callout,
        note: 'Categories follow American Heart Association guidelines. A single reading is not a diagnosis — blood pressure varies through the day, so take several readings while seated and at rest.',
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
      F.age(30),
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
      const sexAdj = sex === 'female' ? 4 : 0;
      const ageAdj = vals.age >= 65 ? 2 : vals.age >= 45 ? 1 : 0;
      const t = (b: number) => b + sexAdj + ageAdj;
      const segments: Segment[] = [
        { upTo: t(55), label: 'Athlete', color: C.blue },
        { upTo: t(61), label: 'Excellent', color: C.green },
        { upTo: t(65), label: 'Good', color: C.teal },
        { upTo: t(73), label: 'Average', color: C.amber },
        { upTo: 110, label: 'Below average', color: C.red },
      ];
      let cat: { label: string; color: string };
      if (rhr <= t(55)) cat = { label: 'Athlete', color: C.blue };
      else if (rhr <= t(61)) cat = { label: 'Excellent', color: C.green };
      else if (rhr <= t(65)) cat = { label: 'Good', color: C.teal };
      else if (rhr <= t(73)) cat = { label: 'Average', color: C.amber };
      else cat = { label: 'Below average', color: C.red };
      const meanings: Record<string, string> = {
        Athlete: 'Typical of well-trained endurance athletes — a very efficient heart.',
        Excellent: 'Excellent cardiovascular fitness.',
        Good: 'Good fitness — better than the average adult.',
        Average: 'Within the normal adult range (60–100 bpm).',
        'Below average': 'Higher than ideal; regular aerobic exercise usually brings it down over time.',
      };
      let callout: CalcResult['callout'];
      if (rhr < 40) callout = { tone: 'warn', text: 'A resting heart rate under 40 bpm is unusual unless you are a trained athlete. If you also feel dizzy, faint or breathless, see a doctor.' };
      else if (rhr > 100) callout = { tone: 'warn', text: 'A resting rate persistently above 100 bpm (tachycardia) is worth checking with a doctor — especially alongside palpitations, dizziness or chest discomfort.' };
      const fit = selects.fitness;
      const fitNote = fit === 'athlete' ? ' As a highly trained athlete, a low resting rate is expected and healthy.'
        : fit === 'sedentary' ? ' Building regular cardio is the most reliable way to lower a resting heart rate.' : '';
      return {
        ok: true,
        primaryLabel: 'Your resting heart rate',
        primaryValue: `${fmt(rhr, 0)} bpm`,
        category: cat,
        visual: { kind: 'gauge', value: Math.min(rhr, 110), min: 40, max: 110, segments },
        callout,
        rows: [
          { label: 'General normal adult range', value: '60–100 bpm', strong: true },
          { label: 'Well-trained athletes', value: '~40–60 bpm' },
          { label: `Your benchmark (${sex === 'female' ? 'women' : 'men'}${vals.age >= 45 ? `, ${vals.age >= 65 ? '65+' : '45–64'}` : ''})`, value: `Athlete ≤${t(55)} · Average ${t(66)}–${t(73)}` },
        ],
        note: `${meanings[cat.label] ?? ''}${fitNote} Resting heart rate is informational only — a persistently very low or high rate, or symptoms such as dizziness or palpitations, means see a doctor. Ranges per the American Heart Association and Mayo Clinic.`,
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
      let cat: string; let loLb: number; let hiLb: number; let rLo: number; let rHi: number; let color: string;
      if (bmi < 18.5) { cat = 'Underweight'; loLb = 28; hiLb = 40; rLo = 1.0; rHi = 1.3; color = '#3b82f6'; }
      else if (bmi < 25) { cat = 'Normal weight'; loLb = 25; hiLb = 35; rLo = 0.8; rHi = 1.0; color = '#16a34a'; }
      else if (bmi < 30) { cat = 'Overweight'; loLb = 15; hiLb = 25; rLo = 0.5; rHi = 0.7; color = '#f59e0b'; }
      else { cat = 'Obese'; loLb = 11; hiLb = 20; rLo = 0.4; rHi = 0.6; color = '#ef4444'; }
      const w = Math.max(1, Math.min(42, vals.week));
      const firstLo = 1.1; const firstHi = 4.4;
      const byLoLb = w <= 13 ? firstLo * (w / 13) : firstLo + rLo * (w - 13);
      const byHiLb = w <= 13 ? firstHi * (w / 13) : firstHi + rHi * (w - 13);
      const toDisp = (lb: number) => (units === 'metric' ? lb * 0.45359237 : lb);
      const gainKg = vals.current - vals.weight;
      const gainDisp = units === 'metric' ? gainKg : kgToLb(gainKg);
      const unit = massUnitLabel(units);
      const totalLo = toDisp(loLb); const totalHi = toDisp(hiLb);
      const byLo = toDisp(byLoLb); const byHi = toDisp(byHiLb);
      const maxScale = totalHi * 1.3;
      let callout: CalcResult['callout'];
      if (gainDisp < byLo * 0.9) callout = { tone: 'info', text: `You're tracking below the recommended gain for week ${Math.round(w)}. Week-to-week gain varies — your OB-GYN can confirm whether you're on track.` };
      else if (gainDisp > byHi * 1.1) callout = { tone: 'warn', text: `You're tracking above the recommended gain for week ${Math.round(w)}. It's worth discussing your weight gain with your OB-GYN.` };
      return {
        ok: true,
        primaryLabel: 'Recommended total gain',
        primaryValue: `${fmt(totalLo, 0)}–${fmt(totalHi, 0)} ${unit}`,
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
          { label: `Recommended by week ${Math.round(w)}`, value: `${fmt(byLo, 1)}–${fmt(byHi, 1)} ${unit}`, strong: true },
          { label: "You've gained so far", value: `${fmt(gainDisp, 1)} ${unit}` },
        ],
        note: 'Ranges follow Institute of Medicine (IOM) guidance for single pregnancies and depend on your starting BMI. Always confirm your targets with your OB-GYN.',
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
      const epley = w * (1 + reps / 30);
      const brzycki = w * 36 / (37 - reps);
      const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
      return {
        ok: true,
        primaryLabel: 'Estimated 1-rep max (Epley)',
        primaryValue: fmtMass(epley, units, 1),
        visual: { kind: 'none' },
        rows: [
          { label: 'Brzycki estimate', value: fmtMass(brzycki, units, 1) },
          ...pcts.map((p) => ({ label: `${p}% of 1RM`, value: fmtMass(epley * (p / 100), units, 1), strong: p === 100 })),
        ],
        note: 'Epley: weight × (1 + reps ÷ 30). Brzycki: weight × 36 ÷ (37 − reps). Most accurate at 10 reps or fewer.',
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
      const heightM = vals.height / 100;
      const lbm = vals.weight * (1 - vals.bodyfat / 100);
      const ffmi = lbm / (heightM * heightM);
      const normalized = ffmi + 6.1 * (1.8 - heightM);
      const segments: Segment[] = [
        { upTo: 18, label: 'Below average', color: C.blue },
        { upTo: 20, label: 'Average', color: C.green },
        { upTo: 22, label: 'Above average', color: C.teal },
        { upTo: 25, label: 'High', color: C.amber },
        { upTo: 30, label: 'Very high', color: C.red },
      ];
      const band = bandFor(ffmi, segments);
      return {
        ok: true,
        primaryLabel: 'Your FFMI',
        primaryValue: fmt(ffmi, 1),
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: ffmi, min: 14, max: 30, segments },
        rows: [
          { label: 'Normalized FFMI (height-adjusted)', value: fmt(normalized, 1), strong: true },
          { label: 'Lean body mass (LBM)', value: fmtMass(lbm, units, 1) },
          { label: 'Body fat mass', value: fmtMass(vals.weight - lbm, units, 1) },
        ],
        note: 'FFMI = lean body mass ÷ height². Normalized FFMI adds a height correction so shorter and taller lifters can be compared fairly. Values above ~25 are uncommon for natural athletes and often point to a body-fat measurement error — treat extreme numbers as a prompt to re-check your input, not as a judgment.',
      };
    },
  },

  // ---- Steps to Calories / Distance ----
  'steps-to-calories-calculator': {
    slug: 'steps-to-calories-calculator',
    heading: 'Convert your steps',
    hasSex: true,
    fields: [
      { key: 'steps', label: 'Steps taken', type: 'number', metricDefault: 8000, min: 100, max: 60000, suffix: 'steps' },
      F.height(170),
      F.weight(72),
    ],
    compute: ({ vals, sex, units }) => {
      const strideCm = vals.height * (sex === 'female' ? 0.413 : 0.415);
      const distanceKm = (vals.steps * (strideCm / 100)) / 1000;
      const hours = distanceKm / 4.8; // assume ~moderate walking pace
      const cal = 3.5 * vals.weight * hours;
      const distStr = units === 'metric' ? `${fmt(distanceKm, 2)} km` : `${fmt(distanceKm * 0.621371, 2)} mi`;
      const strideStr = units === 'metric' ? `${fmt(strideCm, 0)} cm` : `${fmt(strideCm / 2.54, 1)} in`;
      const segments: Segment[] = [
        { upTo: 5000, label: 'Sedentary', color: C.red },
        { upTo: 7500, label: 'Low active', color: C.amber },
        { upTo: 10000, label: 'Somewhat active', color: C.teal },
        { upTo: 12000, label: 'Active', color: C.green },
      ];
      const band = bandFor(vals.steps, segments);
      return {
        ok: true,
        primaryLabel: 'Calories burned',
        primaryValue: `${fmt(cal, 0)} kcal`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: vals.steps, min: 0, max: 12000, segments },
        rows: [
          { label: 'Distance walked', value: distStr, strong: true },
          { label: 'Your stride length', value: strideStr },
          { label: 'Daily goal', value: '10,000 steps' },
        ],
        note: 'Stride length is estimated as height × 0.413 (women) or 0.415 (men). Calories assume a moderate walking pace and will vary with speed and terrain.',
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
        primaryLabel: 'Estimated VO₂ max',
        primaryValue: `${fmt(vo2, 1)} ml/kg/min`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: vo2, min: 20, max: 70, segments },
        rows: [
          { label: 'Estimated max heart rate', value: `${fmt(hrMax, 0)} bpm` },
          { label: 'Resting heart rate', value: `${fmt(vals.rest, 0)} bpm` },
        ],
        note: 'Uses the Uth–Sørensen estimate: VO₂ max ≈ 15.3 × (max HR ÷ resting HR). Healthy ranges depend on age and sex — treat the category as a general guide.',
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
