/**
 * Self-reflection questionnaires and validated screeners.
 *
 * The first three (sleep, stress, burnout) are NOT diagnostic instruments —
 * bands use plain wellness language.
 *
 * PHQ-9, GAD-7, and WHO-5 are validated public-domain screeners with standard
 * scoring bands. They still do not diagnose — only a qualified professional
 * can diagnose depression, anxiety, or any condition.
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

  // ── Validated screeners (public domain) ──────────────────────────────
  // PHQ-9: Patient Health Questionnaire (9 items). Pfizer public domain.
  // Max raw = 27. Band cutoffs: 0-4, 5-9, 10-14, 15-19, 20-27.
  'phq-9-depression-screener': {
    slug: 'phq-9-depression-screener',
    heading: 'PHQ-9 Depression Screener',
    higherIsBetter: false,
    crisis: true,
    scoreLabel: 'PHQ-9 score',
    scale: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling asleep, staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading or watching television',
      'Moving or speaking so slowly that others could have noticed — or the opposite, being so fidgety or restless that you move more than usual',
      'Thoughts that you would be better off dead, or of hurting yourself in some way',
    ],
    bands: [
      { upToPct: 15, label: 'Minimal', color: '#16a34a', summary: 'Your score suggests minimal depression symptoms. If you notice any item that concerns you, it is still worth talking to your doctor.', tips: ['Keep up the habits that protect your mood — sleep, movement, connection.', 'Notice early if things change and reach out if they do.'] },
      { upToPct: 34, label: 'Mild', color: '#f59e0b', summary: 'Your score suggests mild depression symptoms. This is common. Small, consistent steps can help, and talking to someone is a good idea.', tips: ['Talk things through with someone you trust.', 'Keep a daily routine with movement, daylight, and regular meals.', 'Limit alcohol — it can worsen low mood.', 'If this persists, mention it to your doctor.'] },
      { upToPct: 52, label: 'Moderate', color: '#f97316', summary: 'Your score suggests moderate depression symptoms. Please consider speaking with a doctor or mental health professional — you do not have to manage this alone.', tips: ['Make an appointment with your doctor or a therapist.', 'Share how you are feeling with someone close to you.', 'Keep daily basics going: sleep, food, movement, daylight.', 'If you indicated any thoughts of self-harm (question 9), contact a crisis line or your doctor now.'] },
      { upToPct: 71, label: 'Moderately severe', color: '#ef4444', summary: 'Your score suggests moderately severe depression symptoms. Please reach out to a healthcare professional — effective treatment is available.', tips: ['Contact your doctor or a mental health professional this week.', 'Do not wait — depression is treatable and you deserve support.', 'Share how you are feeling with someone close to you.', 'If you indicated any thoughts of self-harm (question 9), contact a crisis line or your doctor immediately.'] },
      { upToPct: 100, label: 'Severe', color: '#dc2626', summary: 'Your score suggests severe depression symptoms. Please seek professional help as soon as possible — you do not have to go through this alone.', tips: ['Contact your doctor, a mental health professional, or a crisis line today.', 'Do not delay — severe depression is treatable.', 'Let someone close to you know you are struggling.', 'If you indicated any thoughts of self-harm (question 9), contact emergency services or a crisis line immediately.'] },
    ],
  },

  // GAD-7: Generalized Anxiety Disorder 7-item. Spitzer et al. public domain.
  // Max raw = 21. Band cutoffs: 0-4, 5-9, 10-14, 15-21.
  'gad-7-anxiety-screener': {
    slug: 'gad-7-anxiety-screener',
    heading: 'GAD-7 Anxiety Screener',
    higherIsBetter: false,
    crisis: true,
    scoreLabel: 'GAD-7 score',
    scale: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
    questions: [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid as if something awful might happen',
    ],
    bands: [
      { upToPct: 19, label: 'Minimal', color: '#16a34a', summary: 'Your score suggests minimal anxiety. Occasional worry is normal — keep up the habits that help you stay steady.', tips: ['Keep up routines that ground you — sleep, movement, connection.', 'Notice if worry starts to feel more frequent or intense.'] },
      { upToPct: 43, label: 'Mild', color: '#f59e0b', summary: 'Your score suggests mild anxiety. This is common. Simple coping strategies can help you feel more in control.', tips: ['Try slow breathing or short mindful pauses during the day.', 'Limit caffeine if you notice it heightens jitteriness.', 'Talk things through with someone you trust.', 'If worry persists or interferes, mention it to your doctor.'] },
      { upToPct: 67, label: 'Moderate', color: '#f97316', summary: 'Your score suggests moderate anxiety. Please consider speaking with a doctor or mental health professional — effective support is available.', tips: ['Make an appointment with your doctor or a therapist.', 'Share how you are feeling with someone close to you.', 'Keep daily basics going: sleep, food, movement, daylight.', 'Limit caffeine and alcohol — both can worsen anxiety.'] },
      { upToPct: 100, label: 'Severe', color: '#ef4444', summary: 'Your score suggests severe anxiety. Please reach out to a healthcare professional — you do not have to manage this alone.', tips: ['Contact your doctor or a mental health professional this week.', 'Do not wait — anxiety is treatable and you deserve support.', 'Let someone close to you know you are struggling.', 'If you feel overwhelmed or in crisis, contact a crisis line now.'] },
    ],
  },

  // WHO-5 Well-Being Index. WHO public domain. 5 items, 0-5 scale.
  // Max raw = 25. Raw ≤13 → poor wellbeing, further screening recommended.
  'who-5-wellbeing-screener': {
    slug: 'who-5-wellbeing-screener',
    heading: 'WHO-5 Well-Being Index',
    higherIsBetter: true,
    crisis: true,
    scoreLabel: 'WHO-5 well-being score',
    scale: [
      { label: 'At no time', value: 0 },
      { label: 'Some of the time', value: 1 },
      { label: 'Less than half of the time', value: 2 },
      { label: 'More than half of the time', value: 3 },
      { label: 'Most of the time', value: 4 },
      { label: 'All of the time', value: 5 },
    ],
    questions: [
      'I have felt cheerful and in good spirits',
      'I have felt calm and relaxed',
      'I have felt active and vigorous',
      'I woke up feeling fresh and rested',
      'My daily life has been filled with things that interest me',
    ],
    bands: [
      { upToPct: 52, label: 'Poor well-being', color: '#ef4444', summary: 'Your score suggests poor well-being over the past two weeks. The WHO-5 guideline recommends further screening for depression when the raw score is 13 or below. Please consider talking to your doctor or a mental health professional.', tips: ['Talk to your doctor — ask about a depression screen if you have not had one.', 'Share how you are feeling with someone you trust.', 'Small daily basics help: daylight, movement, regular meals, sleep.', 'If you are in crisis or having thoughts of self-harm, contact a crisis line now.'] },
      { upToPct: 72, label: 'Moderate well-being', color: '#f59e0b', summary: 'Your score suggests moderate well-being. Some days are good and some are harder. Small changes can lift the overall pattern.', tips: ['Notice what makes your better days better — and protect those things.', 'Stay connected with people who lift you.', 'Build in movement, daylight, and things you enjoy.', 'If well-being stays low for two more weeks, consider talking to your doctor.'] },
      { upToPct: 100, label: 'Good well-being', color: '#16a34a', summary: 'Your score suggests good well-being. Keep doing what sustains you, and notice if things shift.', tips: ['Keep up the habits and connections that support your well-being.', 'Notice early if your mood or energy dips — and reach out if it does.'] },
    ],
  },
};

export const getQuiz = (slug: string): QuizDef | undefined => QUIZZES[slug];
