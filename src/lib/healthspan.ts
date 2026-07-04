/**
 * Healthspan Score — a transparent, educational points model over everyday
 * habits associated with more healthy, disease-free years.
 *
 * NOT a lifespan prediction, biological-age measure, or diagnosis. Every point
 * value below is a simple, documented heuristic anchored to public guidance on
 * MODIFIABLE lifestyle risk factors:
 *   - WHO physical activity fact sheet (150–300 min moderate activity/week)
 *   - WHO healthy diet fact sheet (≥400 g ≈ 5 servings fruit & veg/day)
 *   - CDC physical activity guidelines for adults
 *   - Dietary Guidelines for Americans (alcohol: ≤1 drink/day women, ≤2 men;
 *     less is better)
 *   - CDC sleep guidance (adults need 7+ hours)
 *
 * The model is deliberately explainable: each factor contributes a visible
 * earned/max pair rendered as a bar, and the score is just the sum (rescaled
 * to 0–100 when the optional waist-to-height factor is skipped).
 */

export type Sex = 'female' | 'male';
export type Smoking = 'never' | 'former' | 'current';
export type Stress = 'low' | 'moderate' | 'high';
export type Social = 'strong' | 'some' | 'limited';
export type Upf = 'rarely' | 'sometimes' | 'daily';

export interface HealthspanInput {
  age: number;
  sex: Sex;
  /** Moderate-intensity physical activity, minutes per week. */
  activityMinutes: number;
  /** Fruit + vegetable servings per day. */
  fruitVeg: number;
  /** How often ultra-processed food features in a typical day. */
  ultraProcessed: Upf;
  smoking: Smoking;
  /** Standard drinks per week. */
  drinksPerWeek: number;
  sleepHours: number;
  stress: Stress;
  social: Social;
  /** Waist ÷ height (same units). Optional — pass null to skip the factor. */
  waistToHeight: number | null;
}

export interface Factor {
  key: string;
  label: string;
  earned: number;
  max: number;
  /** One-line action shown when this factor is among the top improvements. */
  tip: string;
}

export type Band = 'needs-attention' | 'good' | 'excellent';

export interface HealthspanResult {
  /** 0–100 habits score (rescaled if waist-to-height was skipped). */
  score: number;
  band: Band;
  bandLabel: string;
  factors: Factor[];
  /** The 2–3 factors with the most points left on the table. */
  improvements: Factor[];
  usedWaist: boolean;
  /** Rough life-expectancy estimate if current habits continued (years). */
  lifeEstimate?: number;
  /** Careful framing text for the life-expectancy number. */
  lifeNote?: string;
}

const round = (n: number) => Math.round(n);

export function computeHealthspan(input: HealthspanInput): HealthspanResult {
  const factors: Factor[] = [];

  // Physical activity — 20 pts. Full credit at the WHO 150 min/week floor.
  factors.push({
    key: 'activity',
    label: 'Physical activity',
    max: 20,
    earned: round((Math.min(Math.max(input.activityMinutes, 0), 150) / 150) * 20),
    tip: 'Build up to at least 150 minutes of moderate activity a week (WHO) — brisk walking counts.',
  });

  // Fruit & vegetables — 12 pts. Full credit at 5 servings (~400 g, WHO).
  factors.push({
    key: 'fruitveg',
    label: 'Fruit & vegetables',
    max: 12,
    earned: round((Math.min(Math.max(input.fruitVeg, 0), 5) / 5) * 12),
    tip: 'Work toward 5 servings (~400 g) of fruit and vegetables a day.',
  });

  // Ultra-processed food — 8 pts.
  factors.push({
    key: 'upf',
    label: 'Ultra-processed food',
    max: 8,
    earned: input.ultraProcessed === 'rarely' ? 8 : input.ultraProcessed === 'sometimes' ? 4 : 0,
    tip: 'Swap some ultra-processed meals and snacks for whole-food options.',
  });

  // Smoking — 15 pts. Quitting at any age improves healthy-year odds.
  factors.push({
    key: 'smoking',
    label: 'Smoking',
    max: 15,
    earned: input.smoking === 'never' ? 15 : input.smoking === 'former' ? 10 : 0,
    tip:
      input.smoking === 'current'
        ? 'Quitting smoking is the single highest-impact change on this list — support doubles your odds.'
        : 'Stay smoke-free.',
  });

  // Alcohol — 10 pts. DGA: ≤1/day women, ≤2/day men; drinking less is better.
  const d = Math.max(input.drinksPerWeek, 0);
  factors.push({
    key: 'alcohol',
    label: 'Alcohol',
    max: 10,
    earned: d === 0 ? 10 : d <= 7 ? 8 : d <= 14 ? (input.sex === 'male' ? 5 : 2) : 0,
    tip: 'Trim weekly drinks — for health, less alcohol is always the better direction.',
  });

  // Sleep — 15 pts. 7–9 h is the adult sweet spot (CDC: 7+).
  const s = input.sleepHours;
  factors.push({
    key: 'sleep',
    label: 'Sleep',
    max: 15,
    earned: s >= 7 && s <= 9 ? 15 : (s >= 6 && s < 7) || (s > 9 && s <= 10) ? 9 : 3,
    tip: 'Protect a consistent 7–9 hour sleep window — it underpins every other habit here.',
  });

  // Stress — 6 pts (self-rated).
  factors.push({
    key: 'stress',
    label: 'Stress',
    max: 6,
    earned: input.stress === 'low' ? 6 : input.stress === 'moderate' ? 3 : 0,
    tip: 'Schedule daily decompression — movement, breathing exercises, or time outdoors all count.',
  });

  // Social connection — 4 pts (self-rated).
  factors.push({
    key: 'social',
    label: 'Social connection',
    max: 4,
    earned: input.social === 'strong' ? 4 : input.social === 'some' ? 2 : 0,
    tip: 'Invest in regular contact with people you care about — connection tracks with healthy years.',
  });

  // Waist-to-height — 10 pts, optional. <0.5 is the common healthy guide.
  const usedWaist = typeof input.waistToHeight === 'number' && Number.isFinite(input.waistToHeight);
  if (usedWaist) {
    const r = input.waistToHeight as number;
    factors.push({
      key: 'waist',
      label: 'Waist-to-height',
      max: 10,
      earned: r < 0.5 ? 10 : r <= 0.6 ? 5 : 0,
      tip: 'Aim for a waist below half your height — central fat is the strongest body-shape signal.',
    });
  }

  // Weights sum to exactly 100 with the optional waist factor, 90 without —
  // so with all factors answered, the visible points literally add up to the
  // score (that's the "no black box" promise).
  const maxTotal = factors.reduce((a, f) => a + f.max, 0); // 100 or 90
  const earnedTotal = factors.reduce((a, f) => a + f.earned, 0);
  const score = Math.max(0, Math.min(100, round((earnedTotal / maxTotal) * 100)));

  const band: Band = score >= 80 ? 'excellent' : score >= 50 ? 'good' : 'needs-attention';
  const bandLabel = band === 'excellent' ? 'Excellent' : band === 'good' ? 'Good' : 'Needs attention';

  const improvements = [...factors]
    .filter((f) => f.max - f.earned > 0)
    .sort((a, b) => b.max - b.earned - (a.max - a.earned))
    .slice(0, 3);

  // Rough life-expectancy estimate: base average +/- score adjustment.
  // Framed as a statistical estimate, never a personal prediction.
  const baseLE = input.sex === 'male' ? 77 : 82;
  const adj = Math.round((score - 50) * 0.12); // +-6 years at extremes
  const lifeEstimate = Math.max(45, Math.min(95, baseLE + adj));
  const lifeNote =
    `If your current habits stayed the same, your healthspan score is consistent with an estimated life expectancy of roughly ${lifeEstimate} years. `
    + `This is a statistical estimate based on general population data, not a personal prediction. `
    + `Genetics, access to healthcare, and many other factors influence actual lifespan. `
    + `Changing any single habit does not guarantee a specific outcome.`;

  return { score, band, bandLabel, factors, improvements, usedWaist, lifeEstimate, lifeNote };
}
