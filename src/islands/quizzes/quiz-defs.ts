/**
 * Self-reflection questionnaires. These are NOT diagnostic instruments and use
 * no clinical labels — bands are plain wellness language. Each quiz sums Likert
 * answers into a percentage of the maximum, then maps to a band (lowest % first).
 */

export interface QuizOption {
  label: string;
  value: number;
}

export interface QuizBand {
  /** Inclusive upper bound, as a percentage of the maximum score. */
  upToPct: number;
  label: string;
  color: string;
  summary: string;
  tips: string[];
}

export interface QuizDef {
  slug: string;
  heading: string;
  scale: QuizOption[];
  questions: string[];
  bands: QuizBand[];
  scoreLabel: string;
  /** Higher score is better (sleep) vs higher is more concern (stress/burnout). */
  higherIsBetter: boolean;
  /** Distress topic → show a crisis-resources line in the result. */
  crisis: boolean;
}

const FREQ: QuizOption[] = [
  { label: 'Never', value: 0 },
  { label: 'Sometimes', value: 1 },
  { label: 'Often', value: 2 },
  { label: 'Almost always', value: 3 },
];

export const QUIZZES: Record<string, QuizDef> = {
  'sleep-quality-check': {
    slug: 'sleep-quality-check',
    heading: 'Sleep quality self-check',
    higherIsBetter: true,
    crisis: false,
    scoreLabel: 'Sleep quality score',
    scale: [
      { label: 'Never', value: 0 },
      { label: 'Rarely', value: 1 },
      { label: 'Often', value: 2 },
      { label: 'Always', value: 3 },
    ],
    questions: [
      'I fall asleep within about 30 minutes of going to bed.',
      'I sleep through the night without long awakenings.',
      'I wake up feeling refreshed rather than groggy.',
      'I get roughly 7–9 hours of sleep.',
      'I keep fairly consistent sleep and wake times.',
      'I wind down without screens in the hour before bed.',
    ],
    bands: [
      { upToPct: 25, label: 'Often disrupted', color: '#ef4444', summary: 'Your answers suggest your sleep is frequently disrupted. Small, consistent changes to your routine can make a real difference over a few weeks.', tips: ['Keep the same wake-up time every day, including weekends.', 'Make your bedroom dark, quiet and cool.', 'Avoid caffeine after early afternoon.', 'Build a screen-free wind-down routine before bed.'] },
      { upToPct: 50, label: 'Could be better', color: '#f59e0b', summary: 'Your sleep has some good nights and some rough ones. Tightening a couple of habits could tip the balance toward more restful sleep.', tips: ['Aim for a consistent bedtime within a 30-minute window.', 'Get daylight in the morning to anchor your body clock.', 'Limit long daytime naps to 20 minutes.', 'Reserve the bed for sleep, not work or scrolling.'] },
      { upToPct: 75, label: 'Fairly restful', color: '#14b8a6', summary: 'You sleep fairly well most of the time. A few small tweaks could help you feel even more refreshed.', tips: ['Protect your wind-down time on busy days.', 'Keep caffeine and big meals away from bedtime.', 'Stay active during the day to deepen sleep.'] },
      { upToPct: 100, label: 'Restful', color: '#16a34a', summary: 'Your answers point to consistently restful sleep — great. Keep doing what works for you.', tips: ['Maintain your consistent schedule.', 'Keep your wind-down routine even when life gets busy.'] },
    ],
  },

  'stress-level-check': {
    slug: 'stress-level-check',
    heading: 'Stress level self-check',
    higherIsBetter: false,
    crisis: true,
    scoreLabel: 'Stress self-check score',
    scale: FREQ,
    questions: [
      'I feel overwhelmed by my responsibilities.',
      'I find it hard to relax or switch off.',
      'I feel irritable or short-tempered.',
      'Worries make it hard to concentrate.',
      'I feel tired even after resting.',
      'I notice physical tension, like headaches or tight shoulders.',
    ],
    bands: [
      { upToPct: 33, label: 'Lower', color: '#16a34a', summary: 'Your answers suggest your stress feels fairly manageable right now. It’s still worth keeping habits that protect your wellbeing.', tips: ['Keep up the routines that help you unwind.', 'Stay connected with people you trust.', 'Protect time for movement and rest.'] },
      { upToPct: 66, label: 'Moderate', color: '#f59e0b', summary: 'Your answers suggest a moderate level of stress. This is common, and small coping steps can help you feel more in control.', tips: ['Try slow breathing or a short walk when tension builds.', 'Break big tasks into smaller steps.', 'Set gentle boundaries on your time and energy.', 'Talk things through with someone you trust.'] },
      { upToPct: 100, label: 'Higher', color: '#ef4444', summary: 'Your answers suggest stress is weighing on you heavily at the moment. You don’t have to manage this alone — support can really help.', tips: ['Prioritise sleep, movement and regular meals.', 'Share how you’re feeling with someone close to you.', 'Consider speaking with a doctor or counsellor.', 'Be kind to yourself — reaching out is a strength.'] },
    ],
  },

  'burnout-self-check': {
    slug: 'burnout-self-check',
    heading: 'Burnout self-check',
    higherIsBetter: false,
    crisis: true,
    scoreLabel: 'Burnout self-check score',
    scale: FREQ,
    questions: [
      'I feel emotionally drained by my work or daily demands.',
      'I feel detached or cynical about things I once cared about.',
      'I struggle to find the energy to start tasks.',
      'I feel I’m getting less done than I’d like.',
      'I wake up already dreading the day ahead.',
      'Time off doesn’t leave me feeling recharged.',
    ],
    bands: [
      { upToPct: 33, label: 'Coping well', color: '#16a34a', summary: 'Your answers suggest you’re coping well and feel reasonably energised. Keep protecting the habits and boundaries that sustain you.', tips: ['Keep protecting your downtime and boundaries.', 'Notice early what drains and what refuels you.', 'Stay connected with supportive people.'] },
      { upToPct: 66, label: 'Showing some strain', color: '#f59e0b', summary: 'Your answers point to some early signs of strain. This is a good moment to ease the load before it builds.', tips: ['Take real breaks during the day, away from screens.', 'Hand off or pause non-essential tasks where you can.', 'Reconnect with parts of life that energise you.', 'Talk with a manager, friend or professional about the pressure.'] },
      { upToPct: 100, label: 'Running low', color: '#ef4444', summary: 'Your answers suggest you’re running low and carrying a heavy load. Please don’t push through alone — reaching out for support is a sign of strength, not weakness.', tips: ['Give yourself permission to rest and recover.', 'Talk to someone you trust about how you’re feeling.', 'Consider speaking with your doctor or a counsellor.', 'Step back from what you can, even temporarily.'] },
    ],
  },
};

export const getQuiz = (slug: string): QuizDef | undefined => QUIZZES[slug];
