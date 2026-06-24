/**
 * Muscle Preservation Calculator — pure logic (UI-free, testable).
 *
 * General, evidence-based nutrition guidance for keeping muscle while losing
 * weight in a calorie deficit. The whole model is three levers: enough protein
 * (~1.6–2.4 g/kg), resistance training, and a sustainable loss rate.
 *
 * RESPONSIBLE SCOPE: this gives NO advice about any medication — not whether to
 * use one, nor any dose or timing. It applies to anyone in a deficit, including
 * people on a medically supervised program, who should follow their prescriber
 * and dietitian. The risk output is a QUALITATIVE band (Low/Moderate/Higher),
 * never a fake precise percentage.
 */

export type Training = 'none' | 'some' | 'regular'; // none / 1–2 / 3+ days per week
export type AgeBand = 'under40' | '40to59' | '60plus';

export interface MusclePreservationInputs {
  weightKg: number;
  weeklyLossKg: number;
  proteinG: number;
  training: Training;
  age: AgeBand;
}

export interface RiskDriver {
  key: 'pace' | 'protein' | 'training';
  label: string;
  status: 'good' | 'watch' | 'risk';
  points: number;
  text: string;
}

export type RiskBand = 'Low' | 'Moderate' | 'Higher';

export interface MusclePreservationResult {
  ok: boolean;
  weightKg: number;
  /** Protein target in g/kg (1.6–2.4). */
  perKg: number;
  /** Daily protein target in grams. */
  targetGrams: number;
  currentProtein: number;
  /** Extra grams/day needed to reach target (0 if met). */
  gapGrams: number;
  proteinMet: boolean;
  /** Weekly loss as a % of body weight. */
  weeklyLossPct: number;
  rapid: boolean;
  /** ~1%/week of body weight, the upper edge of a sustainable pace. */
  safeWeeklyKg: number;
  drivers: RiskDriver[];
  riskBand: RiskBand;
  riskScore: number;
  checklist: string[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

export function computeMusclePreservation(i: MusclePreservationInputs): MusclePreservationResult {
  const weightKg = Math.max(1, i.weightKg);
  const weeklyLossKg = Math.max(0, i.weeklyLossKg);
  const proteinG = Math.max(0, i.proteinG);

  const weeklyLossPct = round((weeklyLossKg / weightKg) * 100, 2);
  const rapid = weeklyLossPct > 1;
  const safeWeeklyKg = round(weightKg * 0.01, 1);

  // Protein target: 1.6–2.4 g/kg, higher for rapid loss and older users.
  let perKg = 1.6;
  if (rapid) perKg += 0.4;
  if (i.age === '60plus') perKg += 0.4;
  else if (i.age === '40to59') perKg += 0.2;
  perKg = round(clamp(perKg, 1.6, 2.4), 1);

  const targetGrams = Math.round(perKg * weightKg);
  const gapGrams = Math.max(0, Math.round(targetGrams - proteinG));
  const proteinMet = gapGrams <= 0;
  const proteinRatio = targetGrams > 0 ? proteinG / targetGrams : 0;

  // ---- Risk drivers (qualitative) ----
  const drivers: RiskDriver[] = [];

  // Pace
  if (weeklyLossPct <= 0.5) {
    drivers.push({ key: 'pace', label: 'Loss rate', status: 'good', points: 0, text: `A gentle pace (${weeklyLossPct}% of body weight/week) is easy on muscle.` });
  } else if (weeklyLossPct <= 1) {
    drivers.push({ key: 'pace', label: 'Loss rate', status: 'watch', points: 1, text: `A moderate pace (${weeklyLossPct}%/week) — fine with enough protein and training.` });
  } else {
    drivers.push({ key: 'pace', label: 'Loss rate', status: 'risk', points: 2, text: `A fast pace (${weeklyLossPct}%/week) pulls more of your loss from muscle.` });
  }

  // Protein
  if (proteinRatio >= 1) {
    drivers.push({ key: 'protein', label: 'Protein intake', status: 'good', points: 0, text: `You're at or above the ${targetGrams} g/day target that protects muscle.` });
  } else if (proteinRatio >= 0.7) {
    drivers.push({ key: 'protein', label: 'Protein intake', status: 'watch', points: 1, text: `A bit short of the ${targetGrams} g/day target — close the gap.` });
  } else {
    drivers.push({ key: 'protein', label: 'Protein intake', status: 'risk', points: 2, text: `Well below the ${targetGrams} g/day needed to hold muscle in a deficit.` });
  }

  // Training
  if (i.training === 'regular') {
    drivers.push({ key: 'training', label: 'Resistance training', status: 'good', points: 0, text: 'Training 3+ days/week is the strongest signal to keep muscle.' });
  } else if (i.training === 'some') {
    drivers.push({ key: 'training', label: 'Resistance training', status: 'watch', points: 1, text: '1–2 days/week helps — 2–3 is the sweet spot.' });
  } else {
    drivers.push({ key: 'training', label: 'Resistance training', status: 'risk', points: 2, text: 'Without resistance training, more of the weight lost tends to be muscle.' });
  }

  const riskScore = drivers.reduce((s, d) => s + d.points, 0); // 0–6
  const riskBand: RiskBand = riskScore <= 1 ? 'Low' : riskScore <= 3 ? 'Moderate' : 'Higher';

  // ---- Action checklist ----
  const checklist: string[] = [];
  checklist.push(
    proteinMet
      ? `Keep protein around ${targetGrams} g/day (about ${perKg} g/kg).`
      : `Add about ${gapGrams} g of protein a day to reach ${targetGrams} g (about ${perKg} g/kg).`,
  );
  checklist.push(
    i.training === 'regular'
      ? 'Keep up your 3+ resistance-training sessions a week.'
      : 'Do resistance training 2–3 times a week — even bodyweight or bands count.',
  );
  checklist.push(
    rapid
      ? `Ease your pace toward about ${safeWeeklyKg} kg/week (≤1% of body weight), and discuss the pace with your provider.`
      : 'Keep your loss around or below 1% of body weight per week.',
  );
  checklist.push('Spread protein across 3–4 meals and prioritize whole-food sources.');

  return {
    ok: true,
    weightKg,
    perKg,
    targetGrams,
    currentProtein: proteinG,
    gapGrams,
    proteinMet,
    weeklyLossPct,
    rapid,
    safeWeeklyKg,
    drivers,
    riskBand,
    riskScore,
    checklist,
  };
}
