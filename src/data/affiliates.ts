/**
 * Tasteful, relevant affiliate recommendations per tool. Links are placeholder
 * search URLs — replace `href` with your real affiliate-tagged links. The FTC
 * disclosure is rendered by ToolPageLayout wherever a section appears.
 * Keep these genuinely useful and never let them crowd out the tool/content.
 */
export interface AffiliateItem {
  name: string;
  blurb: string;
  href: string;
}
export interface AffiliateSection {
  heading: string;
  intro?: string;
  items: AffiliateItem[];
}

const az = (q: string): string => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;

export const AFFILIATES: Record<string, AffiliateSection> = {
  'meal-plan-generator': {
    heading: 'Make your meal plan easier',
    intro: 'Handy picks for prepping and shopping your week.',
    items: [
      { name: 'Grocery delivery', blurb: 'Get your plan’s ingredients delivered — skip the store run.', href: az('grocery delivery') },
      { name: 'Protein powder', blurb: 'An easy way to top up protein on high-target days.', href: az('protein powder') },
      { name: 'Meal-prep container set', blurb: 'Portion and store the week so the plan actually sticks.', href: az('meal prep containers') },
    ],
  },
  'protein-intake-calculator': {
    heading: 'Recommended protein sources',
    intro: 'Convenient ways to hit your daily protein target.',
    items: [
      { name: 'Whey protein powder', blurb: 'A fast, complete protein — handy post-workout or to top up your day.', href: az('whey protein powder') },
      { name: 'Plant-based protein', blurb: 'Pea or soy blends for a complete amino profile without dairy.', href: az('vegan protein powder') },
      { name: 'Protein bars', blurb: 'Portable 15–20 g servings for busy days.', href: az('high protein bars') },
    ],
  },
  'macro-calculator': {
    heading: 'Tools for tracking your macros',
    items: [
      { name: 'Digital kitchen scale', blurb: 'Weigh portions accurately so your macro targets actually land.', href: az('digital kitchen food scale') },
      { name: 'Meal-prep containers', blurb: 'Portion meals ahead to stay consistent through the week.', href: az('meal prep containers') },
    ],
  },
  'calorie-calculator': {
    heading: 'Helpful for hitting your calorie goal',
    items: [
      { name: 'Food scale', blurb: 'The single most useful tool for accurate calorie tracking.', href: az('digital kitchen food scale') },
      { name: 'Reusable water bottle', blurb: 'Staying hydrated helps manage appetite and energy.', href: az('reusable water bottle') },
    ],
  },
  'keto-calculator': {
    heading: 'Keto kitchen helpers',
    items: [
      { name: 'Ketone test strips', blurb: 'Check whether you’ve reached ketosis.', href: az('ketone test strips') },
      { name: 'MCT oil', blurb: 'A popular keto-friendly fat source for energy.', href: az('MCT oil') },
    ],
  },
  'water-intake-calculator': {
    heading: 'Stay on top of hydration',
    items: [
      { name: 'Time-marked water bottle', blurb: 'Hourly markers make your daily target easy to hit.', href: az('time marker water bottle') },
      { name: 'Insulated bottle', blurb: 'Keeps water cold so you actually drink it.', href: az('insulated water bottle') },
    ],
  },
  'bmi-calculator': {
    heading: 'Track your progress at home',
    items: [
      { name: 'Smart bathroom scale', blurb: 'Logs weight and BMI trends over time.', href: az('smart body weight scale') },
      { name: 'Body tape measure', blurb: 'Pair BMI with waist measurements for a fuller picture.', href: az('body measuring tape') },
    ],
  },
  'body-fat-calculator': {
    heading: 'Measure more accurately',
    items: [
      { name: 'Body tape measure', blurb: 'A retractable tape makes the Navy method measurements easy.', href: az('body measuring tape') },
      { name: 'Body-fat calipers', blurb: 'An inexpensive way to cross-check your estimate.', href: az('body fat calipers') },
    ],
  },
  'one-rep-max-calculator': {
    heading: 'Train your lifts safely',
    items: [
      { name: 'Lifting belt', blurb: 'Support for heavier compound lifts.', href: az('weightlifting belt') },
      { name: 'Wrist wraps', blurb: 'Extra wrist stability under load.', href: az('lifting wrist wraps') },
    ],
  },
  'running-pace-calculator': {
    heading: 'Gear for your next run',
    items: [
      { name: 'GPS running watch', blurb: 'Track pace and splits in real time.', href: az('gps running watch') },
      { name: 'Running shoes', blurb: 'The right pair makes hitting your pace easier on your joints.', href: az('running shoes') },
    ],
  },
  'sleep-calculator': {
    heading: 'Sleep better tonight',
    items: [
      { name: 'Blackout sleep mask', blurb: 'Block light to fall asleep faster and stay asleep.', href: az('contoured sleep mask') },
      { name: 'White-noise machine', blurb: 'Mask disruptions for more consistent sleep.', href: az('white noise machine') },
    ],
  },
};

export const getAffiliates = (slug: string): AffiliateSection | undefined => AFFILIATES[slug];
