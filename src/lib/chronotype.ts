/**
 * Sleep Chronotype Quiz — pure logic (UI-free). Each answer points to one of
 * four chronotypes (Lion / Bear / Wolf / Dolphin); the highest tally wins.
 * Educational / for-fun — a real circadian assessment is clinical.
 */

export type TypeKey = 'lion' | 'bear' | 'wolf' | 'dolphin';

export interface QuizOption {
  label: string;
  type: TypeKey;
}
export interface QuizQuestion {
  q: string;
  options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Left to your own schedule, when do you naturally wake?',
    options: [
      { label: 'Very early (before 6:30), wide awake', type: 'lion' },
      { label: 'Around 7, ready after a bit', type: 'bear' },
      { label: 'Late — mornings are rough', type: 'wolf' },
      { label: 'Early but unrefreshed; I’m a light sleeper', type: 'dolphin' },
    ],
  },
  {
    q: 'When is your mental focus at its best?',
    options: [
      { label: 'Early morning', type: 'lion' },
      { label: 'Late morning to midday', type: 'bear' },
      { label: 'Late afternoon and evening', type: 'wolf' },
      { label: 'It comes and goes unpredictably', type: 'dolphin' },
    ],
  },
  {
    q: 'How do you feel about mornings?',
    options: [
      { label: 'My favorite part of the day', type: 'lion' },
      { label: 'Fine once I get going', type: 'bear' },
      { label: 'I dread them', type: 'wolf' },
      { label: 'Anxious / groggy', type: 'dolphin' },
    ],
  },
  {
    q: 'When would you choose to do hard exercise?',
    options: [
      { label: 'First thing in the morning', type: 'lion' },
      { label: 'Midday or after work', type: 'bear' },
      { label: 'Evening — I’m strongest then', type: 'wolf' },
      { label: 'Whenever I can muster it', type: 'dolphin' },
    ],
  },
  {
    q: 'How is your sleep usually?',
    options: [
      { label: 'Solid; I’m out early and up early', type: 'lion' },
      { label: 'Pretty good and regular', type: 'bear' },
      { label: 'I fall asleep late and sleep deeply', type: 'wolf' },
      { label: 'Light and easily disturbed', type: 'dolphin' },
    ],
  },
  {
    q: 'At a 7 a.m. meeting, you’d be…',
    options: [
      { label: 'Sharp and prepared', type: 'lion' },
      { label: 'Okay with coffee', type: 'bear' },
      { label: 'Barely functional', type: 'wolf' },
      { label: 'Awake but frazzled', type: 'dolphin' },
    ],
  },
  {
    q: 'Which describes your energy across the day?',
    options: [
      { label: 'High early, fades by evening', type: 'lion' },
      { label: 'Steady, gentle midday dip', type: 'bear' },
      { label: 'Slow start, builds into the night', type: 'wolf' },
      { label: 'Up and down, hard to predict', type: 'dolphin' },
    ],
  },
];

export interface ScheduleItem {
  time: string;
  label: string;
}
export interface ChronotypeInfo {
  key: TypeKey;
  name: string;
  emoji: string;
  tagline: string;
  share: number; // approx % of population
  description: string;
  tips: string[];
  schedule: ScheduleItem[];
}

export const TYPES: Record<TypeKey, ChronotypeInfo> = {
  lion: {
    key: 'lion', name: 'Lion', emoji: '🦁', tagline: 'Early riser, morning powerhouse', share: 15,
    description: 'You wake early and naturally, with your best energy and focus in the first half of the day. Evenings wind down fast — and that’s fine. Lean into mornings for your most important work.',
    tips: ['Tackle your hardest task before noon.', 'Protect an early, consistent bedtime.', 'Schedule social plans earlier in the evening.'],
    schedule: [
      { time: '5:30–6:00 AM', label: 'Wake naturally' },
      { time: '6:30–11:00 AM', label: 'Peak focus — deep work' },
      { time: '7:00 AM', label: 'Best time to exercise' },
      { time: '9:00 PM', label: 'Wind down' },
      { time: '9:30–10:00 PM', label: 'Bedtime' },
    ],
  },
  bear: {
    key: 'bear', name: 'Bear', emoji: '🐻', tagline: 'Solar-cycle, the most common type', share: 55,
    description: 'Your clock follows the sun. You do well on a conventional 9-to-5, with focus peaking late morning to midday and a natural dip in the early afternoon. Most people are Bears.',
    tips: ['Front-load deep work between mid-morning and noon.', 'Use the post-lunch dip for lighter tasks or a short walk.', 'Keep a steady wake time to feel your best.'],
    schedule: [
      { time: '7:00 AM', label: 'Wake' },
      { time: '10:00 AM–12:00 PM', label: 'Peak focus' },
      { time: '12:00–1:00 PM', label: 'Lunch + short walk' },
      { time: '6:00 PM', label: 'Best time to exercise' },
      { time: '10:30 PM', label: 'Wind down' },
      { time: '11:00 PM', label: 'Bedtime' },
    ],
  },
  wolf: {
    key: 'wolf', name: 'Wolf', emoji: '🐺', tagline: 'Night owl, evening creative', share: 15,
    description: 'Mornings are hard and your engine really starts in the afternoon, peaking into the evening. Where you can, shift demanding work later and protect your morning from early commitments.',
    tips: ['Schedule creative or hard work for late afternoon/evening.', 'Ease into mornings with light and a slow start.', 'Set a firm wind-down so a late peak doesn’t become a 2 a.m. bedtime.'],
    schedule: [
      { time: '7:30–9:00 AM', label: 'Wake (reluctantly) — get bright light' },
      { time: '1:00 PM', label: 'Focus starts to build' },
      { time: '5:00–9:00 PM', label: 'Peak focus & creativity' },
      { time: '7:00 PM', label: 'Best time to exercise' },
      { time: '12:00 AM', label: 'Wind down' },
      { time: '12:30–1:00 AM', label: 'Bedtime' },
    ],
  },
  dolphin: {
    key: 'dolphin', name: 'Dolphin', emoji: '🐬', tagline: 'Light, alert sleeper', share: 10,
    description: 'You’re a light sleeper who can wake easily and often feels unrefreshed. A calm, consistent routine and good sleep hygiene help most — your focus tends to be best in the late morning.',
    tips: ['Keep a strict, calming wind-down and wake time.', 'Reserve late morning for your most important work.', 'Limit caffeine after midday and keep the bedroom cool and dark.'],
    schedule: [
      { time: '6:30 AM', label: 'Wake — get light, avoid snoozing' },
      { time: '10:00 AM–12:00 PM', label: 'Peak focus' },
      { time: '3:30 PM', label: 'Best time to (gently) exercise' },
      { time: '10:00 PM', label: 'Strict wind-down — no screens' },
      { time: '11:30 PM', label: 'Bedtime' },
    ],
  },
};

/** Tally option types; return the winning chronotype (Bear breaks ties — most common). */
export function computeChronotype(answers: (TypeKey | null)[]): TypeKey {
  const tally: Record<TypeKey, number> = { lion: 0, bear: 0, wolf: 0, dolphin: 0 };
  for (const a of answers) if (a) tally[a]++;
  const order: TypeKey[] = ['bear', 'lion', 'wolf', 'dolphin']; // tie-break priority
  let best: TypeKey = 'bear';
  let bestN = -1;
  for (const k of order) {
    if (tally[k] > bestN) { bestN = tally[k]; best = k; }
  }
  return best;
}
