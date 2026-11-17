/**
 * Health Reality Lab — offline, deterministic prototype.
 * Gentle wellness suggestions, not a clinical assessment or prescribed exercise.
 * No server calls, storage, user accounts, prices, medical claims, or identifiers.
 */
export const DEFAULTS = Object.freeze({
  goal: 'movement',
  minutes: 10,
  sessions: 3,
  energy: 'low',
  mobility: 'any',
  shift: 'rotating',
  budget: 'no-spend',
});

const DAYS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const OPTIONS = Object.freeze({
  goal: ['movement', 'food', 'sleep', 'calm'],
  energy: ['low', 'moderate', 'high'],
  mobility: ['any', 'seated'],
  shift: ['day', 'night', 'rotating'],
  budget: ['no-spend', 'flexible'],
});
const ENERGY = Object.freeze({ low: 1, moderate: 2, high: 3 });

// A small, curated menu of optional activities requiring no purchases.
// Food actions explicitly depend on ingredients already available.
const ACTIVITIES = Object.freeze([
  { id: 'seated-mobility', goal: 'movement', minutes: 5, energy: 1, seated: true, label: 'Try five minutes of comfortable seated movement' },
  { id: 'comfortable-movement', goal: 'movement', minutes: 5, energy: 1, seated: false, label: 'Take a comfortable movement break at your own pace' },
  { id: 'indoor-movement', goal: 'movement', minutes: 10, energy: 2, seated: false, label: 'Move gently indoors, at a pace that feels manageable' },
  { id: 'outdoor-break', goal: 'movement', minutes: 15, energy: 2, seated: false, label: 'Consider a relaxed outdoor walk if conditions allow' },
  { id: 'pantry-check', goal: 'food', minutes: 5, energy: 1, seated: true, label: 'Review foods you already have and choose one simple option' },
  { id: 'familiar-meals', goal: 'food', minutes: 10, energy: 1, seated: true, label: 'Write down two realistic meals using available ingredients' },
  { id: 'food-prep', goal: 'food', minutes: 15, energy: 2, seated: false, label: 'Prepare one familiar food from ingredients already on hand' },
  { id: 'compare-options', goal: 'food', minutes: 10, energy: 1, seated: true, budget: 'flexible', label: 'Compare prices of familiar staples; no purchase is required' },
  { id: 'sleep-reset', goal: 'sleep', minutes: 5, energy: 1, seated: true, label: 'Make your main sleep space a little quieter or darker' },
  { id: 'sleep-winddown', goal: 'sleep', minutes: 10, energy: 1, seated: true, label: 'Try a quiet wind-down before your main sleep period' },
  { id: 'sleep-transition', goal: 'sleep', minutes: 15, energy: 1, seated: true, label: 'Choose a screen-free, relaxing activity before main sleep' },
  { id: 'quiet-pause', goal: 'calm', minutes: 5, energy: 1, seated: true, label: 'Take a short, comfortable quiet pause' },
  { id: 'gentle-hobby', goal: 'calm', minutes: 10, energy: 1, seated: true, label: 'Spend a few minutes on a familiar, low-pressure activity' },
  { id: 'settle-in', goal: 'calm', minutes: 15, energy: 1, seated: true, label: 'Make room for a longer restful break, without a performance goal' },
]);

function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Choose the planner options first.');
  }
  const result = {};
  for (const [key, values] of Object.entries(OPTIONS)) {
    if (!values.includes(input[key])) {
      throw new RangeError('Unsupported selection for ' + key + '.');
    }
    result[key] = input[key];
  }
  for (const [key, minimum, maximum] of [['minutes', 5, 60], ['sessions', 1, 7]]) {
    if (!Number.isInteger(input[key]) || input[key] < minimum || input[key] > maximum) {
      throw new RangeError(key + ' must be a whole number between ' + minimum + ' and ' + maximum + '.');
    }
    result[key] = input[key];
  }
  const allowed = input.availableDays === undefined ? DAYS : input.availableDays;
  if (!Array.isArray(allowed) || allowed.length < result.sessions ||
      allowed.length > 7 || new Set(allowed).size !== allowed.length ||
      allowed.some((day) => !DAYS.includes(day))) {
    throw new RangeError('Choose distinct valid weekdays for every planned session.');
  }
  result.availableDays = DAYS.filter((day) => allowed.includes(day));
  return result;
}

function timing(goal, shift) {
  if (goal === 'sleep') return 'Before your main sleep period (not necessarily at night)';
  if (shift !== 'day') return 'After waking or during a convenient break';
  return 'At a convenient time during your day';
}

export function buildWeekPlan(rawInput) {
  const input = validate(rawInput);
  const suitable = ACTIVITIES.filter((activity) =>
    activity.goal === input.goal &&
    activity.minutes <= input.minutes &&
    activity.energy <= ENERGY[input.energy] &&
    (input.mobility !== 'seated' || activity.seated) &&
    (!activity.budget || activity.budget === input.budget)
  );
  if (!suitable.length) {
    // A 5-minute, seated option exists for every goal. A future change that
    // removes this invariant must fail explicitly rather than invent advice.
    throw new Error('No safe option fits these constraints.');
  }
  const choices = [...suitable].sort((a, b) => a.minutes - b.minutes || a.id.localeCompare(b.id));
  const schedule = Array.from({ length: input.sessions }, (_, i) => {
    const dayIndex = Math.floor((i * input.availableDays.length) / input.sessions);
    const activity = choices[(i + choices.length - 1) % choices.length];
    return Object.freeze({
      day: input.availableDays[dayIndex],
      when: timing(input.goal, input.shift),
      title: activity.label,
      minutes: activity.minutes,
      id: activity.id,
    });
  });
  const totalMinutes = schedule.reduce((total, slot) => total + slot.minutes, 0);
  // Keep the complete week visible: days without a chosen activity are free,
  // not a failure to meet a goal.
  const week = DAYS.map((day) => {
    const activity = schedule.find((slot) => slot.day === day);
    return activity || Object.freeze({
      day,
      rest: true,
      title: 'Open day — rest or choose freely',
      minutes: 0,
      when: 'No activity scheduled',
      id: 'rest',
    });
  });
  const alternatives = choices.filter((a) => !schedule.some((slot) => slot.id === a.id))
    .slice(0, 2).map((a) => a.label);
  return Object.freeze({
    schedule: Object.freeze(schedule),
    week: Object.freeze(week),
    totalMinutes,
    summary: input.sessions + ' optional sessions across seven days, using ' +
      totalMinutes + ' minutes in total. No purchase is required.',
    alternatives: Object.freeze(alternatives),
    notes: Object.freeze([
      'Adjust, skip, or stop any activity that causes discomfort. Rest is a valid choice.',
      'This is a practical planning aid, not medical care, a diagnosis, or a promised result.',
      'No precise food prices or health outcomes have been estimated.',
    ]),
  });
}

/**
 * Portable text export; includes no email, location, name or user-entered notes.
 * Formatting stays local in the browser; the caller chooses whether to save it.
 */
export function formatWeekPlan(plan) {
  if (!plan || !Array.isArray(plan.week) || plan.week.length !== 7 ||
      typeof plan.summary !== 'string' || !Array.isArray(plan.notes)) {
    throw new TypeError('A completed weekly plan is required.');
  }
  return [
    'Health Reality Lab — your flexible week',
    '',
    plan.summary,
    '',
    ...plan.week.map((entry) => entry.rest
      ? entry.day + ': Open day — rest or choose freely'
      : entry.day + ': ' + entry.title + ' (' + entry.minutes + ' min; ' + entry.when + ')'),
    '',
    'Keep it flexible:',
    ...plan.notes.map((note) => '- ' + note),
  ].join('\n') + '\n';
}
