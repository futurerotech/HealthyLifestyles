/**
 * Calculator definitions: field schemas + pure compute functions for every
 * Body & Weight tool. All maths is in metric base units (kg, cm, years); the
 * island converts imperial input → metric before calling compute(), and compute
 * formats any mass output back into the active unit system.
 *
 * Formula sources are cited on each tool page (see body-weight-content.ts).
 */
import { fmt, fmtMass, kgToLb, massUnitLabel, round, type Sex, type UnitSystem } from '../../lib/units.ts';

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
  | { kind: 'range'; min: number; max: number; low: number; high: number; unit: string; label?: string; upperExclusive?: boolean }
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

const PROTEIN_OPTIONS: SelectOption[] = [
  { value: '0.8', label: 'Adult RDA reference — not a universal target (0.8 g/kg)' },
  { value: '1.2', label: 'Higher-intake adult example (1.2 g/kg)' },
  { value: '1.6', label: 'Resistance training example (1.6 g/kg)' },
  { value: '2.0', label: 'Healthy exercising adult example (2.0 g/kg)' },
  { value: '2.2', label: 'Higher training example — not a maximum (2.2 g/kg)' },
];

// The existing activity numbers are illustrative increments, NOT measured
// sweat loss or validated fluid requirements for a given exercise duration.
const WATER_ACTIVITY_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Little / no exercise — +0 L example' },
  { value: '500', label: 'Moderate (30–60 min/day) — +0.5 L example' },
  { value: '1000', label: 'Active (1–2 h/day) — +1.0 L example' },
  { value: '1500', label: 'Very active (>2 h/day) — +1.5 L example' },
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

/** Simplified Mifflin-St Jeor predicted resting energy expenditure (REE, kcal/day). */
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
  // ---- 1. BMI (CDC adult screening categories) ----
  'bmi-calculator': {
    slug: 'bmi-calculator',
    heading: 'Calculate your BMI',
    hasSex: false,
    fields: [F.weight(72), F.height(175)],
    compute: ({ vals, units }) => {
      // BMI = kg/m²; metric base units reach this function after display conversion.
      const { weight, height } = vals;
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Your BMI',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (![weight, height].every((v) => Number.isFinite(v) && v > 0)) {
        return fail('Enter valid positive weight and height measurements.');
      }
      // Mirror the existing form's supported input ranges in the pure formula.
      if (weight < 25 || weight > 300 || height < 120 || height > 230) {
        return fail('Check weight (25–300 kg) and height (120–230 cm) are within the supported input range.');
      }
      const meters = height / 100;
      const bmi = weight / (meters * meters);
      if (!Number.isFinite(bmi) || bmi <= 0) {
        return fail('These measurements cannot produce a valid BMI.');
      }

      // CDC adult boundaries are lower-inclusive: 18.5, 25 and 30
      // must enter the new band. Classify raw BMI, not a rounded display.
      const category = bmi < 18.5
        ? { label: 'Underweight', color: C.blue }
        : bmi < 25
          ? { label: 'Healthy weight', color: C.green }
          : bmi < 30
            ? { label: 'Overweight', color: C.amber }
            : { label: 'Obesity', color: C.red };
      // The gauge has continuous ranges; the categorical result above uses
      // strict threshold comparisons, not bandFor's inclusive upper bound.
      const gaugeMax = Math.max(40, Math.ceil(bmi / 5) * 5);
      const segments: Segment[] = [
        { upTo: 18.5, label: 'Underweight', color: C.blue },
        { upTo: 25, label: 'Healthy weight', color: C.green },
        { upTo: 30, label: 'Overweight', color: C.amber },
        { upTo: gaugeMax, label: 'Obesity', color: C.red },
      ];
      // Near a category edge, expand display precision so a rounded 25.0
      // does not normally appear alongside the preceding category.
      const cutoffs = [18.5, 25, 30];
      let precision = cutoffs.some((c) => Math.abs(bmi - c) < 0.05) ? 2 : 1;
      while (precision < 6 && cutoffs.some((c) => bmi < c && round(bmi, precision) >= c)) {
        precision++;
      }

      // Healthy adult BMI interval is 18.5 <= BMI < 25, not <= 24.9.
      // Rounded weight endpoints are illustrative, not personal targets.
      const lowKg = 18.5 * meters * meters;
      const exclusiveHighKg = 25 * meters * meters;
      return {
        ok: true,
        primaryLabel: 'Your BMI',
        primaryValue: fmt(bmi, precision),
        category,
        visual: { kind: 'gauge', value: bmi, min: 0, max: gaugeMax, segments },
        rows: [
          {
            label: 'Approximate BMI reference weight (18.5 to below 25)',
            value: fmtMass(lowKg, units, 1) + ' to under ' + fmtMass(exclusiveHighKg, units, 1),
            strong: true,
          },
        ],
        note: 'These CDC screening categories are for adults age 20 and older, not children or teens. BMI is not a diagnosis and cannot separate fat from muscle or show fat location. The weight interval is an approximate BMI reference, not a personal goal; interpretation also depends on health history and other measures.',
      };
    },
  },

  // ---- 2. BMR calculator: Mifflin-St Jeor predicts resting energy (REE) ----
  'bmr-calculator': {
    slug: 'bmr-calculator',
    heading: 'Estimate your resting energy (BMR calculator)',
    hasSex: true,
    fields: [
      F.weight(72),
      F.height(175),
      {
        ...F.age(30),
        min: 19,
        help: 'For adults age 19 or older. The original equation was derived in adults ages 19–78; estimates at older ages are less certain.',
      },
    ],
    compute: ({ vals, sex }) => {
      const { weight, height, age } = vals;
      const fail = (error: string): CalcResult => ({
        ok: false, error,
        primaryLabel: 'Estimated resting energy (REE)',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (![weight, height, age].every((v) => Number.isFinite(v) && v > 0) ||
          (sex !== 'male' && sex !== 'female')) {
        return fail('Enter valid weight, height, age and sex.');
      }
      if (weight < 25 || weight > 300 || height < 120 || height > 230 ||
          !Number.isInteger(age) || age < 19 || age > 100) {
        return fail('Check weight (25–300 kg), height (120–230 cm) and whole-year age (19–100).');
      }

      // Original simplified Mifflin-St Jeor sex coefficients (1990):
      // weight in kg, height in cm, age in years, predicted REE in kcal/day.
      const ree = mifflin(weight, height, age, sex);
      if (!Number.isFinite(ree) || ree <= 0) {
        return fail('These measurements cannot produce a valid resting-energy estimate.');
      }
      const levels: [string, number][] = [
        ['Sedentary (×1.2)', 1.2],
        ['Lightly active (×1.375)', 1.375],
        ['Moderately active (×1.55)', 1.55],
        ['Active (×1.725)', 1.725],
        ['Very active (×1.9)', 1.9],
      ];
      return {
        ok: true,
        primaryLabel: 'Estimated resting energy (REE)',
        primaryValue: fmt(ree, 0) + ' kcal/day',
        visual: { kind: 'none' },
        rows: levels.map(([label, factor]) => ({
          label: 'Illustrative TDEE — ' + label,
          value: fmt(ree * factor, 0) + ' kcal/day',
        })),
        note: 'Mifflin–St Jeor predicts resting energy expenditure (REE), which is related to but not identical to measured basal metabolic rate (BMR). TDEE rows are illustrative REE × activity-factor scenarios, not measured expenditure or calorie prescriptions. The original study included adults ages 19–78; accuracy may be lower for other ages or health conditions.',
      };
    },
  },

  // ---- 3. BMI reference interval + historical Devine dosing-weight equation ----
  'ideal-weight-calculator': {
    slug: 'ideal-weight-calculator',
    heading: 'Explore BMI reference weights',
    hasSex: true,
    fields: [F.height(175)],
    compute: ({ vals, sex, units }) => {
      const height = vals.height;
      const fail = (error: string): CalcResult => ({
        ok: false, error,
        primaryLabel: 'Adult BMI reference weight interval',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (!Number.isFinite(height) || height <= 0 ||
          (sex !== 'male' && sex !== 'female')) {
        return fail('Enter a valid positive height and a supported equation sex.');
      }
      if (height < 120 || height > 230) {
        return fail('Check the height is within the supported 120–230 cm range.');
      }

      const meters = height / 100;
      // CDC adult healthy-weight category: 18.5 <= BMI < 25 (upper exclusive).
      const lowKg = 18.5 * meters * meters;
      const upperExclusiveKg = 25 * meters * meters;
      const inches = height / 2.54;

      // Devine (1974): 50kg male / 45.5kg female plus 2.3kg per inch
      // over five feet. The historic over-5-ft formula is not validated
      // below 60 inches. Do not clamp all shorter heights to the 5-ft value.
      const devineApplicable = height >= 152.4;
      const devineKg = devineApplicable
        ? (sex === 'male' ? 50 : 45.5) + 2.3 * (inches - 60)
        : null;

      const lowerDisplay = fmtMass(lowKg, units, 1);
      const upperDisplay = fmtMass(upperExclusiveKg, units, 1);
      const unit = units === 'metric' ? 'kg' : 'lb';
      return {
        ok: true,
        primaryLabel: 'Adult BMI reference weight interval',
        primaryValue: lowerDisplay + ' to under ' + upperDisplay,
        visual: {
          kind: 'range',
          min: round(massScale(lowKg, units) - 12, 0),
          max: round(massScale(upperExclusiveKg, units) + 12, 0),
          low: round(massScale(lowKg, units), 1),
          high: round(massScale(upperExclusiveKg, units), 1),
          unit,
          label: 'BMI reference (not a goal)',
          upperExclusive: true,
        },
        rows: [{
          label: 'Devine historical dosing-weight reference',
          value: devineKg === null
            ? 'Not provided below 5 ft (152.4 cm)'
            : fmtMass(devineKg, units, 1),
          strong: devineKg !== null,
        }],
        note: devineKg === null
          ? 'The BMI interval is an approximate adult screening reference, not a personal weight goal. The historical Devine formula is stated in inches above 5 ft; no Devine value is provided for shorter heights rather than silently repeating the 5-ft value. This calculator cannot determine drug doses or diagnose health.'
          : 'The BMI interval (18.5 to below 25) is an approximate adult screening reference, not a personal weight goal. Devine was developed as a dosing-weight reference, not an individual fitness target; do not use it to determine medication or ventilator settings. These estimates do not account for age, body composition or medical history.',
      };
    },
  },

  // ---- 4. Body Fat % (historical US Navy circumference equations) ----
  'body-fat-calculator': {
    slug: 'body-fat-calculator',
    heading: 'Estimate your body fat',
    hasSex: true,
    fields: [
      F.height(175),
      F.neck(),
      {
        ...F.waist(88),
        label: 'Abdomen / waist circumference',
        help: 'Men: measure at the navel, not the narrowest waist. Women: measure at the narrowest natural waist. Breathe out normally; keep the tape level and snug.',
      },
      { ...F.hip(), showIf: ({ sex }) => sex === 'female' },
    ],
    compute: ({ vals, sex }) => {
      // Hodgdon-Beckett body-density equations require centimetres; the island
      // converts imperial length inputs with the exact 2.54 cm/in factor.
      const { height, neck, waist } = vals;
      const hip = vals.hip;
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Body fat', primaryValue: '—', visual: { kind: 'none' },
      });
      if (![height, neck, waist].every((v) => Number.isFinite(v) && v > 0) ||
          (sex === 'female' && !(Number.isFinite(hip) && hip > 0))) {
        return fail('Enter valid, positive height and circumference measurements.');
      }

      const circumference = sex === 'male' ? waist - neck : waist + hip - neck;
      if (!(circumference > 0)) {
        return fail(sex === 'male'
          ? 'Abdomen must be larger than neck. Re-check your measurements.'
          : 'Waist plus hip must exceed neck. Re-check your measurements.');
      }
      const density = sex === 'male'
        ? 1.0324 - 0.19077 * Math.log10(circumference) + 0.15456 * Math.log10(height)
        : 1.29579 - 0.35004 * Math.log10(circumference) + 0.22100 * Math.log10(height);
      if (!Number.isFinite(density) || density <= 0) {
        return fail('These measurements do not produce a usable body-fat estimate.');
      }
      // Do not silently turn an impossible estimate into 2% or 60%.
      const bf = round(495 / density - 450, 1);
      if (!Number.isFinite(bf) || bf <= 0 || bf >= 100) {
        return fail('These measurements produce an implausible body-fat estimate. Recheck tape placement and units.');
      }

      // General *fitness* reference bands, not diagnoses or Navy BCA standards.
      // Classify the same one-decimal percentage that is actually displayed.
      const segments: Segment[] = sex === 'male'
        ? [
            { upTo: 1.9, label: 'Below reference chart', color: C.blue },
            { upTo: 5.9, label: 'Essential fat', color: C.blue },
            { upTo: 13.9, label: 'Athletic', color: C.green },
            { upTo: 17.9, label: 'Fitness', color: C.teal },
            { upTo: 24.9, label: 'Average', color: C.amber },
            { upTo: 100, label: 'Higher reference range', color: C.red },
          ]
        : [
            { upTo: 9.9, label: 'Below reference chart', color: C.blue },
            { upTo: 13.9, label: 'Essential fat', color: C.blue },
            { upTo: 20.9, label: 'Athletic', color: C.green },
            { upTo: 24.9, label: 'Fitness', color: C.teal },
            { upTo: 31.9, label: 'Average', color: C.amber },
            { upTo: 100, label: 'Higher reference range', color: C.red },
          ];
      const band = bandFor(bf, segments);
      return {
        ok: true,
        primaryLabel: 'Estimated body fat',
        primaryValue: fmt(bf, 1) + '%',
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: bf, min: 0, max: 100, segments },
        note: 'This tape-based estimate is not a diagnosis or personal target. The fitness labels are illustrative, not age-adjusted. This historical formula is not the current official U.S. Navy BCA.',
      };
    },
  },

  // ---- 5. Lean Body Mass (Boer) ----
  'lean-body-mass-calculator': {
    slug: 'lean-body-mass-calculator',
    heading: 'Estimate your lean body mass',
    hasSex: true,
    fields: [F.weight(72), F.height(175)],
    compute: ({ vals, sex, units }) => {
      // Boer (1984): weight in kg, height in cm. Never clamp an impossible
      // lean/fat mass prediction to a credible-looking zero-fat result.
      const { weight, height } = vals;
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Estimated lean body mass',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (![weight, height].every((v) => Number.isFinite(v) && v > 0)) {
        return fail('Enter valid positive weight and height measurements.');
      }

      const lbm = sex === 'male'
        ? 0.407 * weight + 0.267 * height - 19.2
        : 0.252 * weight + 0.473 * height - 48.3;
      const fatMass = weight - lbm;
      if (!Number.isFinite(lbm) || !(lbm > 0) || !(fatMass > 0)) {
        return fail('These measurements imply an impossible lean/fat mass split. Recheck weight, height and units; this equation may not fit your body proportions.');
      }

      const unit = massUnitLabel(units);
      return {
        ok: true,
        primaryLabel: 'Estimated lean body mass',
        primaryValue: fmtMass(lbm, units, 1),
        visual: {
          kind: 'split',
          aLabel: 'Estimated lean mass',
          aValue: round(massScale(lbm, units), 1),
          bLabel: 'Estimated fat mass',
          bValue: round(massScale(fatMass, units), 1),
          aColor: C.green,
          bColor: C.amber,
          unit,
        },
        rows: [
          { label: 'Derived fat mass (not measured)', value: fmtMass(fatMass, units, 1) },
          { label: 'Estimated lean share of body weight', value: fmt((lbm / weight) * 100, 1) + '%', strong: true },
        ],
        note: 'Boer predicts lean body mass from weight, height and sex; it does not measure muscle or fat. The fat portion is a mathematical remainder, not a scan result. Do not use this estimate to diagnose health, prescribe treatment or calculate medication doses.',
      };
    },
  },

  // ---- 6. Waist-to-Height Ratio (NICE central-adiposity reference bands) ----
  'waist-to-height-ratio-calculator': {
    slug: 'waist-to-height-ratio-calculator',
    heading: 'Calculate your waist-to-height ratio',
    hasSex: false,
    fields: [
      {
        ...F.waist(85),
        help: 'Measure halfway between your lowest rib and the top of your hip bone (just above your navel). Keep the tape level and breathe out normally.',
      },
      F.height(175),
    ],
    compute: ({ vals }) => {
      const { waist, height } = vals;
      if (![waist, height].every((v) => Number.isFinite(v) && v > 0)) {
        return {
          ok: false, error: 'Enter valid positive waist and height measurements.',
          primaryLabel: 'Waist-to-height ratio', primaryValue: '—',
          visual: { kind: 'none' },
        };
      }
      // Both inputs are centimetres, even when the display is imperial.
      const ratio = waist / height;
      if (!Number.isFinite(ratio) || !(ratio > 0)) {
        return {
          ok: false, error: 'These measurements cannot produce a valid ratio.',
          primaryLabel: 'Waist-to-height ratio', primaryValue: '—',
          visual: { kind: 'none' },
        };
      }

      // NICE reference bands are stated to 2 decimals. Classify the same
      // 2-decimal number shown to the user, including at 0.40/0.50/0.60.
      const shown = round(ratio, 2);
      const gaugeMax = Math.max(0.8, Math.ceil(shown * 10) / 10);
      const segments: Segment[] = [
        { upTo: 0.39, label: 'Below reference range', color: C.blue },
        { upTo: 0.49, label: 'Within reference range', color: C.green },
        { upTo: 0.59, label: 'Increased central adiposity', color: C.amber },
        { upTo: gaugeMax, label: 'High central adiposity', color: C.red },
      ];
      const band = bandFor(shown, segments);
      return {
        ok: true,
        primaryLabel: 'Waist-to-height ratio',
        primaryValue: fmt(shown, 2),
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: shown, min: 0, max: gaugeMax, segments },
        note: 'Reference bands are based on the displayed, rounded ratio; near a boundary, small tape differences may change the band. NICE uses these adult bands alongside BMI (particularly BMI below 35). This is a screening estimate, not a diagnosis; a ratio under 0.5 does not rule out other health risks.',
      };
    },
  },

  // ---- 7. Waist-to-Hip Ratio (WHO-referenced sex-specific cutoffs) ----
  'waist-to-hip-ratio-calculator': {
    slug: 'waist-to-hip-ratio-calculator',
    heading: 'Calculate your waist-to-hip ratio',
    hasSex: true,
    fields: [
      {
        ...F.waist(85),
        help: 'Measure halfway between the bottom of the last palpable rib and the top of the hip bone. Breathe out normally; keep the tape horizontal and snug, not tight.',
      },
      {
        ...F.hip(),
        help: 'Measure around the widest part of the buttocks, keeping the tape horizontal and snug, not tight.',
      },
    ],
    compute: ({ vals, sex }) => {
      const { waist, hip } = vals;
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Waist-to-hip ratio',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (![waist, hip].every((v) => Number.isFinite(v) && v > 0)) {
        return fail('Enter valid positive waist and hip measurements.');
      }

      // Both measurements arrive in centimeters. The ratio is dimensionless.
      const ratio = waist / hip;
      if (!Number.isFinite(ratio) || !(ratio > 0)) {
        return fail('These measurements cannot produce a valid waist-to-hip ratio.');
      }

      // Annex A, Table A1 of WHO 2008 consultation (published 2011) prints
      // >= 0.90 for men and >= 0.85 for women. The consultation did not
      // establish new universal diagnostic cutoffs or a three-tier WHO scale.
      // Compare the unrounded value so 0.8996 is not misclassified as >=0.90.
      const cutoff = sex === 'male' ? 0.90 : 0.85;
      const atOrAbove = ratio >= cutoff;
      const gaugeMax = Math.max(1.2, Math.ceil(ratio * 10) / 10);
      const segments: Segment[] = [
        { upTo: cutoff, label: 'Below reference cutoff', color: C.green },
        { upTo: gaugeMax, label: 'At/above reference cutoff', color: C.amber },
      ];
      // Near the threshold, show extra digits so a rounded 0.90 does not
      // ordinarily conceal an underlying value just below the cutoff.
      const shownPrecision = Math.abs(ratio - cutoff) < 0.005 ? 4 : 2;
      return {
        ok: true,
        primaryLabel: 'Waist-to-hip ratio',
        primaryValue: fmt(ratio, shownPrecision),
        category: atOrAbove
          ? { label: 'At/above reference cutoff', color: C.amber }
          : { label: 'Below reference cutoff', color: C.green },
        visual: { kind: 'gauge', value: ratio, min: 0, max: gaugeMax, segments },
        rows: [
          { label: sex === 'male' ? 'Male reference cutoff' : 'Female reference cutoff',
            value: (sex === 'male' ? '≥0.90' : '≥0.85') },
        ],
        note: 'WHO’s 2008 consultation reproduced these commonly cited reference cutoffs but did not set definitive universal diagnostic limits. Categories use the unrounded ratio; tape placement and rounding can matter near a cutoff. This is not a direct measurement of visceral fat or an individual disease-risk diagnosis.',
      };
    },
  },

  // ---- 8. Weight Change Percentage (baseline = starting weight) ----
  'weight-loss-percentage-calculator': {
    slug: 'weight-loss-percentage-calculator',
    heading: 'Calculate your weight change percentage',
    hasSex: false,
    fields: [
      { key: 'start', label: 'Starting weight', type: 'mass', metricDefault: 90, min: 25, max: 350 },
      { key: 'current', label: 'Current weight', type: 'mass', metricDefault: 82, min: 25, max: 350 },
    ],
    compute: ({ vals, units }) => {
      const { start, current } = vals;
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Weight change',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (![start, current].every((v) => Number.isFinite(v) && v > 0)) {
        return fail('Enter valid positive starting and current weights.');
      }
      if ([start, current].some((v) => v < 25 || v > 350)) {
        return fail('Check both weights are within the supported 25–350 kg input range.');
      }

      // The starting weight is the denominator for both directions of change:
      // loss = positive; gain = negative. Do not divide by the current weight.
      const differenceKg = start - current;
      const percentLost = (differenceKg / start) * 100;
      if (!Number.isFinite(percentLost)) {
        return fail('These weights cannot produce a valid percentage.');
      }
      const gained = differenceKg < 0;
      const unchanged = differenceKg === 0;
      const absPercent = Math.abs(percentLost);
      // Keep numeric classification based on raw percentage, not a rounded
      // value that can incorrectly promote 4.96% to the 5% milestone.
      const nearMilestone = !gained && !unchanged &&
        [5, 10].some((point) => Math.abs(percentLost - point) < 0.05);
      const percentPrecision = nearMilestone ? 4 : 1;
      let category: { label: string; color: string };
      if (gained) category = { label: 'Weight increased', color: C.amber };
      else if (unchanged) category = { label: 'No weight change', color: C.slate };
      else if (percentLost >= 10) category = { label: '10%+ decrease (reference milestone)', color: C.green };
      else if (percentLost >= 5) category = { label: '5%+ decrease (reference milestone)', color: C.teal };
      else category = { label: 'Weight decreased', color: C.blue };
      const note = gained
        ? 'This is a comparison with your starting weight, not a diagnosis or evidence of a harmful change. Weight changes can reflect fluid, fat, muscle, pregnancy or other factors. Discuss unexplained changes with a clinician.'
        : unchanged
          ? 'Your recorded starting and current weights are equal. This comparison alone does not assess health, body composition or changes between measurements.'
          : '5–10% weight loss may improve some health measures in adults with overweight or obesity when appropriate and sustained; benefits are not automatic and these are not personal targets. This tool does not measure fat loss, rate of change or health outcomes. Consult a clinician about unexpected or rapid changes.';
      return {
        ok: true,
        primaryLabel: gained ? 'Weight gained' : unchanged ? 'Weight unchanged' : 'Weight lost',
        primaryValue: fmt(absPercent, percentPrecision) + '%',
        category,
        visual: { kind: 'none' },
        rows: [
          {
            label: gained ? 'Total gained' : unchanged ? 'Absolute change' : 'Total lost',
            value: fmtMass(Math.abs(differenceKg), units, 1),
            strong: true,
          },
        ],
        note,
      };
    },
  },

  // ============================================================
  // Nutrition
  // ============================================================

  // ---- Calorie Calculator: predicted REE and illustrative TDEE ----
  'calorie-calculator': {
    slug: 'calorie-calculator',
    heading: 'Estimate your daily energy expenditure',
    hasSex: true,
    fields: [
      F.weight(72),
      F.height(175),
      {
        ...F.age(30),
        min: 19,
        help: 'For adults age 19 or older. The original Mifflin–St Jeor study included ages 19–78; older-age predictions are extrapolations.',
      },
      {
        ...activityField(),
        help: 'Choose an illustrative activity multiplier. Days of exercise alone cannot measure your actual daily expenditure.',
      },
    ],
    compute: ({ vals, selects, sex }) => {
      const { weight, height, age } = vals;
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Estimated daily expenditure (TDEE)',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (![weight, height, age].every((v) => Number.isFinite(v) && v > 0) ||
          (sex !== 'male' && sex !== 'female')) {
        return fail('Enter valid positive weight, height, whole-year age and an equation sex.');
      }
      if (weight < 25 || weight > 300 || height < 120 || height > 230 ||
          !Number.isInteger(age) || age < 19 || age > 100) {
        return fail('Check weight (25–300 kg), height (120–230 cm) and whole-year age (19–100).');
      }
      // Accept only the existing selectable multiplier, never arbitrary input
      // or parseFloat's permissive partial strings or silent fallbacks.
      const activity = ACTIVITY_OPTIONS.find((option) => option.value === selects.activity);
      if (!activity) return fail('Choose one of the listed activity levels.');

      const ree = mifflin(weight, height, age, sex);
      const factor = Number(activity.value);
      const tdee = ree * factor;
      if (![ree, factor, tdee].every((v) => Number.isFinite(v) && v > 0)) {
        return fail('These measurements cannot produce a valid daily-energy estimate.');
      }

      const lessExample = tdee - 500;
      const moreExample = tdee + 500;
      // NIDDK's Body Weight Planner flags intakes under 1,000 kcal/day for
      // nutrient-adequacy concerns. This is only a display-withholding guard,
      // NOT a universal safe intake floor or a personalized prescription.
      const displayExamples = tdee >= 1000;
      const displayLess = displayExamples && lessExample >= 1000;
      const displayMore = displayExamples && moreExample >= 1000;
      const sampleValue = (value: number, show: boolean) =>
        show ? fmt(value, 0) + ' kcal/day' : 'Not shown';
      const commonSub = 'Arithmetic illustration, not an intake target';
      const callout: NonNullable<CalcResult['callout']> = !displayExamples
        ? {
            tone: 'warn',
            text: 'This model predicts unusually low daily expenditure. Check your measurements; do not use this number to plan food intake. Seek individualized advice from a qualified clinician or registered dietitian.',
          }
        : !displayLess
          ? {
              tone: 'warn',
              text: 'A 500-kcal subtraction would be below 1,000 kcal/day, so that example is withheld. NIDDK flags nutrient-adequacy concerns below this level; 1,000 is NOT a universal safe minimum, and amounts above it are not automatically appropriate.',
            }
          : {
              tone: 'info',
              text: 'The 500-kcal differences are mathematical illustrations only. They do not establish safe food-intake goals or predict a fixed weekly rate of weight loss or gain.',
            };

      return {
        ok: true,
        primaryLabel: 'Estimated daily expenditure (TDEE)',
        primaryValue: fmt(tdee, 0) + ' kcal/day',
        visual: { kind: 'none' },
        cards: [
          {
            label: '500 kcal less (example)',
            value: sampleValue(lessExample, displayLess),
            sub: commonSub,
            tone: 'warn',
          },
          {
            label: 'Estimated maintenance expenditure',
            value: fmt(tdee, 0) + ' kcal/day',
            sub: 'Model estimate, not a measured intake requirement',
            tone: 'neutral',
          },
          {
            label: '500 kcal more (example)',
            value: sampleValue(moreExample, displayMore),
            sub: commonSub,
            tone: 'neutral',
          },
        ],
        callout,
        rows: [
          { label: 'Predicted resting energy (REE)', value: fmt(ree, 0) + ' kcal/day' },
          { label: 'Assumed activity multiplier', value: '×' + activity.value + ' (' + activity.label + ')' },
        ],
        note: 'Mifflin–St Jeor predicts resting energy expenditure (REE), not a measured BMR. TDEE is an estimate made by multiplying REE by a selected activity factor. Actual expenditure varies and changes over time; a fixed 500-kcal difference does not guarantee a weekly weight change. This calculator is for adult education, not a calorie prescription during pregnancy, breastfeeding, illness or individual nutritional care.',
      };
    },
  },

  // ---- Macro Calculator: illustrative TDEE and internally consistent macro shares ----
  'macro-calculator': {
    slug: 'macro-calculator',
    heading: 'Explore estimated daily macros',
    hasSex: true,
    fields: [
      F.weight(72),
      F.height(175),
      {
        ...F.age(30),
        min: 19,
        help: 'For adults age 19 or older. The Mifflin–St Jeor study included ages 19–78; results above that age are extrapolations.',
      },
      {
        ...activityField(),
        help: 'Choose an illustrative activity multiplier. This selection does not measure your true daily energy expenditure.',
      },
      {
        key: 'goal', label: 'Illustrative scenario', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'maintain',
        options: [
          { value: 'cut', label: 'Cut — lower energy example' },
          { value: 'maintain', label: 'Maintain — estimated TDEE' },
          { value: 'bulk', label: 'Bulk — higher energy example' },
        ],
      },
    ],
    compute: ({ vals, selects, sex }) => {
      const { weight, height, age } = vals;
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Illustrative macro energy',
        primaryValue: '—', visual: { kind: 'none' },
      });
      if (![weight, height, age].every((v) => Number.isFinite(v) && v > 0) ||
          (sex !== 'male' && sex !== 'female')) {
        return fail('Enter valid positive weight, height, whole-year age and an equation sex.');
      }
      if (weight < 25 || weight > 300 || height < 120 || height > 230 ||
          !Number.isInteger(age) || age < 19 || age > 100) {
        return fail('Check weight (25–300 kg), height (120–230 cm) and whole-year age (19–100).');
      }
      // Match the existing activity choices exactly; do not parse partial
      // strings or silently assume the default when input is missing.
      const activity = ACTIVITY_OPTIONS.find((option) => option.value === selects.activity);
      if (!activity) return fail('Choose one of the listed activity levels.');
      const goal = selects.goal;
      if (goal !== 'cut' && goal !== 'maintain' && goal !== 'bulk') {
        return fail('Choose one of the listed macro scenarios.');
      }

      // The original Mifflin helper already predicts REE in kcal/day.
      const ree = mifflin(weight, height, age, sex);
      const factor = Number(activity.value);
      const tdee = ree * factor;
      if (![ree, factor, tdee].every((v) => Number.isFinite(v) && v > 0)) {
        return fail('These measurements cannot produce a valid energy estimate.');
      }
      // Preserve the existing illustrative energy shifts and per-kg macro
      // coefficients; they are examples, NOT validated dietary prescriptions.
      const offset = goal === 'cut' ? -500 : goal === 'bulk' ? 300 : 0;
      const goalLabel = goal === 'cut' ? 'Cut' : goal === 'bulk' ? 'Bulk' : 'Maintain';
      const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'bulk' ? 1.6 : 1.8;
      const fatPerKg = goal === 'cut' ? 0.8 : goal === 'bulk' ? 1.0 : 0.9;
      const energy = tdee + offset;

      // Withhold invalid low-energy demonstrations rather than declaring the
      // former sex-dependent 1200/1500-kcal clamp universally safe. NIDDK's
      // 1000-kcal guard is a display limit, NOT an approved personal minimum.
      if (tdee < 1000 || energy < 1000) {
        return fail('This example would use an unusually low modeled energy budget (under 1,000 kcal/day). No macro split or meal-plan handoff is shown. The NIDDK nutrient-adequacy warning is not a universal safe-calorie threshold; discuss appropriate intake with a qualified clinician or registered dietitian.');
      }

      const proteinG = proteinPerKg * weight;
      const fatG = fatPerKg * weight;
      const proteinKcal = proteinG * 4;
      const fatKcal = fatG * 9;
      const remainingKcal = energy - proteinKcal - fatKcal;

      // Never substitute zero carbohydrate after the other two macros have
      // already exceeded the energy budget: it would show an impossible total.
      if (!Number.isFinite(remainingKcal) || remainingKcal < 0) {
        return fail('The selected protein and fat illustrations already exceed the estimated energy budget; a consistent carbohydrate remainder cannot be calculated. Try a different scenario or activity level, or seek individualized nutrition guidance. No inaccurate split is shown.');
      }

      const carbsG = remainingKcal / 4;
      return {
        ok: true,
        primaryLabel: 'Illustrative macro energy (' + goalLabel + ')',
        primaryValue: fmt(energy, 0) + ' kcal/day',
        visual: macroDonut(proteinG, carbsG, fatG),
        rows: [
          { label: 'Protein (illustrative)', value: fmt(proteinG, 0) + ' g · ' + fmt(proteinKcal, 0) + ' kcal', strong: true },
          { label: 'Carbohydrate (remainder)', value: fmt(carbsG, 0) + ' g · ' + fmt(remainingKcal, 0) + ' kcal' },
          { label: 'Fat (illustrative)', value: fmt(fatG, 0) + ' g · ' + fmt(fatKcal, 0) + ' kcal' },
          { label: 'Predicted resting energy (REE)', value: fmt(ree, 0) + ' kcal/day' },
          { label: 'Illustrative TDEE', value: fmt(tdee, 0) + ' kcal/day (×' + activity.value + ')' },
          { label: 'Energy scenario offset', value: (offset > 0 ? '+' : '') + offset + ' kcal/day' },
        ],
        callout: {
          tone: 'info',
          text: 'This split is a mathematical illustration, not a safe calorie target or individualized protein, fat or carbohydrate prescription. Macro grams are rounded for display and may not sum to the displayed calories exactly. There is no guaranteed weight-change rate.',
        },
        note: 'REE comes from the Mifflin–St Jeor adult prediction, not a measured BMR; TDEE assumes the selected activity multiplier. This example uses ' + proteinPerKg + ' g/kg protein and ' + fatPerKg + ' g/kg fat, then assigns the remaining energy to carbohydrate (4, 4 and 9 kcal/g). These coefficients may not fit individual health or dietary needs. No fixed calorie floor or macro ratio is universally safe; pregnancy, illness and clinical diets require personal guidance.',
        cta: {
          label: 'Preview these estimates in the existing meal planner →',
          href: '/tools/meal-plan-generator?calories=' + Math.round(energy) +
            '&protein=' + Math.round(proteinG) +
            '&carbs=' + Math.round(carbsG) +
            '&fat=' + Math.round(fatG),
        },
      };
    },
  },

  // ---- Protein Intake: weight-based illustrations for generally healthy adults ----
  'protein-intake-calculator': {
    slug: 'protein-intake-calculator',
    heading: 'Explore daily protein amounts',
    hasSex: false,
    fields: [
      F.weight(72),
      {
        key: 'goal', label: 'Protein reference / training example', type: 'select',
        metricDefault: 0, min: 0, max: 0,
        selectDefault: '1.6',
        options: PROTEIN_OPTIONS,
        help: 'These are reference or illustrative g/kg values for generally healthy adults, not prescribed targets or safe upper limits.',
      },
    ],
    compute: ({ vals, selects, units }) => {
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Illustrative daily protein amount',
        primaryValue: '—', visual: { kind: 'none' },
      });
      const weight = vals.weight;
      if (!Number.isFinite(weight) || weight < 25 || weight > 300) {
        return fail('Enter a finite body weight between 25 and 300 kg (about 55–661 lb).');
      }
      if (units !== 'metric' && units !== 'imperial') {
        return fail('Choose a supported unit system.');
      }
      // Exact select matching prevents partial numeric strings, missing choices
      // or silent fallback to the default 1.6 g/kg example.
      const choice = PROTEIN_OPTIONS.find((option) => option.value === selects.goal);
      if (!choice) return fail('Choose one of the listed protein examples.');
      const gPerKg = Number(choice.value);
      const proteinG = gPerKg * weight;
      const proteinKcal = proteinG * 4;
      if (!Number.isFinite(proteinG) || !Number.isFinite(proteinKcal)) {
        return fail('This input cannot produce a finite protein estimate.');
      }
      return {
        ok: true,
        primaryLabel: 'Illustrative daily protein amount',
        primaryValue: fmt(proteinG, 0) + ' g/day',
        visual: { kind: 'none' },
        rows: [
          { label: 'Selected illustration', value: fmt(gPerKg, 1) + ' g per kg body weight', strong: true },
          { label: 'If divided evenly among 4 meals', value: fmt(proteinG / 4, 0) + ' g/meal (example)' },
          { label: 'Approximate energy from protein', value: fmt(proteinKcal, 0) + ' kcal/day (4 kcal/g)' },
        ],
        callout: {
          tone: 'info',
          text: 'Not a personal prescription. Kidney disease, pregnancy, breastfeeding, adolescence, frailty, clinical illness, and substantial weight or body-composition differences call for individualized nutrition advice.',
        },
        note: 'The longstanding US adult RDA is 0.8 g/kg/day, while the 2025–2030 Dietary Guidelines describe 1.2–1.6 g/kg/day food-pattern goals and exercise guidance commonly describes 1.4–2.0 g/kg/day for healthy exercising adults. The 2.2 option is an example, not a maximum or a guarantee of benefit. Even four-way meal division and 4-kcal/g energy are illustrative, not meal prescriptions or total calorie needs.',
      };
    },
  },

  // ---- Water Intake: PR #54's high-weight rule + strict input safety ----
  'water-intake-calculator': {
    slug: 'water-intake-calculator',
    heading: 'Explore a daily total-water example',
    hasSex: false,
    fields: [
      F.weight(72),
      {
        key: 'activity', label: 'Illustrative activity adjustment',
        type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: '500',
        options: WATER_ACTIVITY_OPTIONS,
        help: 'The optional fixed increments are simple examples, not estimates of your sweat loss or a drinking prescription.',
      },
    ],
    compute: ({ vals, selects, units }) => {
      const fail = (error: string): CalcResult => ({
        ok: false, error, primaryLabel: 'Illustrative daily total water',
        primaryValue: '—', visual: { kind: 'none' },
      });
      const weight = vals.weight;
      if (!Number.isFinite(weight) || weight < 25 || weight > 300) {
        return fail('Enter a finite weight between 25 and 300 kg (about 55–661 lb).');
      }
      if (units !== 'metric' && units !== 'imperial') {
        return fail('Choose metric or imperial units.');
      }
      // The original UI's allowed increments must match EXACTLY. Do not
      // silently map missing, partial or malformed values to the zero example.
      const activity = WATER_ACTIVITY_OPTIONS.find(option => option.value === selects.activity);
      if (!activity) return fail('Choose one of the listed activity examples.');

      // Reuse the existing PR #54 review correction: 35 mL/kg is held above
      // 100 kg rather than being extrapolated into a 6–12 L/day "recommendation".
      // This 100-kg boundary is an ENGINEERING display guard, not a clinical
      // upper intake limit, validated cutoff, or individualized dose.
      const SCALING_LIMIT_KG = 100;
      const held = weight > SCALING_LIMIT_KG;
      const baselineMl = 35 * Math.min(weight, SCALING_LIMIT_KG);
      const extraMl = Number(activity.value);
      const totalMl = baselineMl + extraMl;
      const ML_PER_US_FL_OZ = 29.5735295625;
      const totalOz = totalMl / ML_PER_US_FL_OZ;
      // Rough illustrative split based on historical US population surveys.
      const drinksMl = totalMl * 0.8;
      if (![baselineMl, extraMl, totalMl, totalOz, drinksMl]
          .every(value => Number.isFinite(value) && value >= 0)) {
        return fail('The inputs cannot produce a valid total-water example.');
      }
      return {
        ok: true,
        primaryLabel: 'Illustrative total water (drinks + food)',
        primaryValue: fmt(totalMl / 1000, 1) + ' L/day',
        visual: { kind: 'none' },
        callout: held ? {
          tone: 'info',
          text: 'For body weight above 100 kg (220 lb), this example holds the 35-mL/kg baseline at its 100-kg value rather than continuing to scale it. This is a formula display limit, NOT a maximum intake. It is not a validated clinical cutoff. Actual needs may be higher or lower.',
        } : undefined,
        rows: [
          { label: 'Total-water equivalent (US fluid ounces)', value: fmt(totalOz, 0) + ' US fl oz', strong: true },
          { label: 'Total-water equivalent (8-US-fl-oz cups)', value: fmt(totalOz / 8, 0) + ' cups' },
          { label: 'Illustrative activity addition', value: '+' + fmt(extraMl / 1000, 1) + ' L (not measured sweat loss)' },
          { label: 'If about 80% comes from drinks', value: fmt(drinksMl / 1000, 2) + ' L · ' + fmt(drinksMl / ML_PER_US_FL_OZ, 0) + ' US fl oz' },
          { label: held ? 'Formula baseline (35 mL/kg, held at 100 kg)' : 'Formula baseline (35 mL/kg)', value: fmt(baselineMl / 1000, 2) + ' L' },
          { label: 'U.S. adult adequate-intake references (total water)', value: '3.7 L men · 2.7 L women (food + drinks)' },
        ],
        note: 'This is arithmetic for generally healthy adults, not a personal water or beverage prescription. The 35 mL/kg rule and 0–1.5 L exercise additions do not measure individual needs or sweat losses. The National Academies adequate-intake references describe total water from drinks AND food in healthy adults in temperate climates; they are neither targets for everyone nor upper limits. Roughly 80% from drinks is a survey average, not an individual rule. If pregnant or breastfeeding, ill, very active, in hot weather, or living with heart, kidney or liver disease or prescribed fluid restrictions, use individualized professional guidance. Excessive rapid drinking can cause dangerous hyponatremia; do not force fluids to meet this example.',
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
      const rpe = vals.rpe;
      const duration = vals.duration;

      // Base recovery (hours) by workout type — general sports-science guidance:
      // heavy resistance needs ~48-72h per muscle group; HIIT/endurance less.
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

      // Training age: beginners need more recovery; advanced recover faster.
      const AGE_MULT: Record<string, number> = {
        beginner: 1.3,
        intermediate: 1.0,
        advanced: 0.85,
      };
      const ageMult = AGE_MULT[trainingAge] ?? 1.0;

      // Sleep quality: poor sleep impairs muscle repair and recovery.
      const SLEEP_MULT: Record<string, number> = {
        poor: 1.25,
        fair: 1.1,
        good: 1.0,
        excellent: 0.9,
      };
      const sleepMult = SLEEP_MULT[sleep] ?? 1.0;

      // Soreness (DOMS): more soreness = more recovery needed.
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
        primaryLabel: 'Suggested recovery window',
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
          text: 'Listen to your body. These are general guidance ranges from sports-science principles, not a prescription. If you\'re still sore, fatigued, or your performance is down, rest longer. Sharp or joint pain is never normal — stop and see a qualified professional.',
        },
        cta: {
          label: 'Check your protein target for recovery →',
          href: '/tools/protein-intake-calculator',
        },
        note: 'Method: a transparent heuristic. We start from a base recovery time for your workout type (e.g. ~48h for heavy resistance training, per the general 48–72h guideline), then adjust it up or down for intensity (RPE), duration, training age, sleep quality, and current soreness. The ±15% window reflects individual variation. This is general fitness guidance, not medical advice.',
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
    hasSex: true,
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
    compute: ({ vals, sex, selects }) => {
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

      // Age bonus — flexibility naturally declines with age, so older adults
      // get a small upward adjustment (transparent, not a penalty).
      const ageBonus = age >= 50 ? 1 : age >= 40 ? 0.5 : 0;
      const adjusted = Math.min(10, raw + ageBonus);
      const maxScore = 9;

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
        primaryLabel: 'Mobility score',
        primaryValue: `${fmt(adjusted, 1)}/${maxScore}`,
        category: { label: band.label, color: band.color },
        visual: { kind: 'zones', items: zones },
        rows: [
          { label: 'Raw score', value: `${raw}/${maxScore}` },
          { label: 'Age adjustment', value: ageBonus > 0 ? `+${fmt(ageBonus, 1)} (age ${fmt(age, 0)})` : 'None', strong: ageBonus > 0 },
        ],
        callout: {
          tone: 'info',
          text: 'Never force a range of motion. Stretch to mild tension, not pain. Sharp pain means stop immediately — it signals strain, not progress. Mobility improves with consistent, gentle work, not aggressive forcing.',
        },
        note: `${suggestionText} Method: each test scores points (sit-reach 0–3, shoulder/ankle/hip 0–2 each, max 9). An age bonus of +0.5 (40–49) or +1 (50+) adjusts for natural flexibility decline. This is a general self-assessment, not a clinical range-of-motion measurement.`,
      };
    },
  },

  // ---- Vitamin D & Sun Exposure (educational estimator) ----
  'vitamin-d-sun-calculator': {
    slug: 'vitamin-d-sun-calculator',
    heading: 'Estimate your vitamin D potential',
    hasSex: false,
    fields: [
      F.age(30),
      {
        key: 'skinType', label: 'Skin type (Fitzpatrick)', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'iii',
        help: 'Darker skin (higher type) needs more sun to make the same vitamin D — melanin absorbs UVB.',
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
        help: 'Check your local UV index on a weather app. Higher UV = more vitamin D potential, but also more skin risk.',
        options: [
          { value: '0-2', label: '0–2 (Low)' },
          { value: '3-5', label: '3–5 (Moderate)' },
          { value: '6-7', label: '6–7 (High)' },
          { value: '8-10', label: '8–10 (Very high)' },
          { value: '11+', label: '11+ (Extreme)' },
        ],
      },
      { key: 'timeOutdoors', label: 'Time outdoors midday', type: 'number', metricDefault: 15, min: 0, max: 600, suffix: 'min', allowZero: true, help: 'Minutes spent outdoors around midday (10am–3pm), when UVB is strongest.' },
      {
        key: 'skinExposed', label: 'Skin exposed', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'arms-face',
        help: 'More skin exposed = more vitamin D — but also more UV risk.',
        options: [
          { value: 'face-hands', label: 'Face & hands only (~5%)' },
          { value: 'arms-face', label: 'Arms & face (~15%)' },
          { value: 'arms-legs', label: 'Arms & legs (~35%)' },
          { value: 'most-body', label: 'Most of body (~60%+)' },
        ],
      },
      {
        key: 'sunscreen', label: 'Sunscreen use', type: 'select', metricDefault: 0, min: 0, max: 0,
        selectDefault: 'after',
        help: 'Sunscreen blocks UVB — the rays that make vitamin D. A short unprotected exposure before applying is a common compromise.',
        options: [
          { value: 'none', label: 'None' },
          { value: 'after', label: 'Applied after initial sun exposure' },
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
      const age = vals.age;
      const skinType = selects.skinType || 'iii';
      const uvKey = selects.uvIndex || '3-5';
      const timeOutdoors = vals.timeOutdoors;
      const skinExposed = selects.skinExposed || 'arms-face';
      const sunscreen = selects.sunscreen || 'after';
      const diet = selects.diet || 'occasional';

      // Transparent points system (0–4 per factor, max 20). Avoids the
      // over-penalisation that comes from multiplying five sub-1 factors.
      const UV_PTS: Record<string, number> = { '0-2': 0, '3-5': 2, '6-7': 3, '8-10': 4, '11+': 4 };
      const SKIN_PTS: Record<string, number> = { i: 4, ii: 3.5, iii: 3, iv: 2.5, v: 2, vi: 1.5 };
      const EXPOSED_PTS: Record<string, number> = { 'face-hands': 1, 'arms-face': 2, 'arms-legs': 3, 'most-body': 4 };
      const SCREEN_PTS: Record<string, number> = { none: 4, after: 3, spf30: 1 };

      let timePts: number;
      if (timeOutdoors < 10) timePts = 1;
      else if (timeOutdoors <= 20) timePts = 2;
      else if (timeOutdoors <= 30) timePts = 3;
      else timePts = 4;

      const uvPts = UV_PTS[uvKey] ?? 2;
      const skinPts = SKIN_PTS[skinType] ?? 3;
      const exposedPts = EXPOSED_PTS[skinExposed] ?? 2;
      const screenPts = SCREEN_PTS[sunscreen] ?? 3;

      const ageAdj = age >= 70 ? -2 : 0;
      const total = Math.max(0, uvPts + skinPts + timePts + exposedPts + screenPts + ageAdj);
      const maxPts = 20;
      const gaugeVal = (total / maxPts) * 10;

      const segments: Segment[] = [
        { upTo: 3.3, label: 'Low', color: C.red },
        { upTo: 6.6, label: 'Moderate', color: C.amber },
        { upTo: 10, label: 'Good', color: C.green },
      ];
      const band = bandFor(gaugeVal, segments);

      // Dietary intake estimate (qualitative vs general RDA target).
      const DIET: Record<string, { label: string; pts: number }> = {
        rarely: { label: 'Well below target', pts: 0 },
        occasional: { label: 'Below target', pts: 1 },
        regular: { label: 'Near target', pts: 2 },
        frequent: { label: 'Meets target', pts: 3 },
        supplement: { label: 'Above target (from supplement)', pts: 4 },
      };
      const dietInfo = DIET[diet] ?? DIET.occasional;

      const skinTypeLabel = `Type ${skinType.toUpperCase()}`;
      const uvLabel = uvKey;

      let dietNote = `NIH RDA is ~600 IU/day (800 if 70+). You appear to be: ${dietInfo.label}.`;
      if (diet === 'supplement') {
        dietNote += ' Do not exceed 4,000 IU/day from all sources without medical supervision — the safe upper limit for adults.';
      }

      return {
        ok: true,
        primaryLabel: 'Sun synthesis potential',
        primaryValue: band.label,
        category: { label: band.label, color: band.color },
        visual: { kind: 'gauge', value: gaugeVal, min: 0, max: 10, segments },
        rows: [
          { label: 'Dietary intake', value: dietInfo.label, strong: true },
          { label: 'UV index', value: uvLabel },
          { label: 'Skin type', value: skinTypeLabel },
          { label: 'Time outdoors', value: `${fmt(timeOutdoors, 0)} min` },
          { label: 'Age adjustment', value: ageAdj < 0 ? `Reduced (70+)` : 'None', strong: ageAdj < 0 },
        ],
        callout: {
          tone: 'warn',
          text: 'Balance sun for vitamin D with skin-cancer protection. The same UVB that makes vitamin D also damages skin and raises cancer risk. Never sunburn. If UV is high (6+), limit unprotected exposure to a few minutes and then apply SPF 30+. Check the EPA UV Index forecast for your area.',
        },
        note: `This tool estimates synthesis likelihood qualitatively — it does NOT measure your blood vitamin D level. ${dietNote} If you are concerned about deficiency, ask your doctor for a 25(OH)D blood test. Only a blood test can confirm your actual vitamin D status.`,
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
