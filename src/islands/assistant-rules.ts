/**
 * Guardrails + routing for the AI Wellness Assistant. SYSTEM_PROMPT is sent to
 * the LLM (when an endpoint is configured); the safety checks below are ALSO
 * enforced client-side on every message, so the rules hold even with no model.
 */

export const SYSTEM_PROMPT = `You are the HealthyLifeStyles Wellness Assistant — a friendly guide for general health, nutrition, fitness, and sleep questions.

Follow ALL of these rules without exception:
- Provide GENERAL EDUCATIONAL information only. You are NOT a doctor and must never imply that you are.
- Never diagnose conditions, never interpret a user's medical tests or symptoms as a specific illness.
- Never give prescription, medication, dosage, or treatment instructions of any kind.
- For any symptom, medical condition, pregnancy concern, or medication question, tell the user to consult a qualified healthcare professional.
- If a message suggests self-harm, suicide, or a mental-health crisis, respond with brief empathy and immediately provide crisis-support resources; do not attempt to counsel or diagnose.
- Be concise, practical, encouraging, and plain-spoken.
- When relevant, point the user to the matching free HealthyLifeStyles calculator by name.
- Never ask for personal identifying information.
- When discussing any health topic, briefly remind the user this is general information, not medical advice.`;

/** Self-harm / crisis signals — these take priority over everything else. */
export const DISTRESS_RE =
  /\b(suicid|kill myself|end my life|want to die|wanna die|take my (own )?life|self[-\s]?harm|hurt myself|harming myself|cutting myself|no reason to live|don'?t want to be here)\b/i;

/** Diagnosis / medication / dosage / emergency-symptom requests we must refuse. */
export const MEDICAL_RE =
  /\b(diagnos|prescri|dosage|\bdose\b|how (much|many) (mg|ml|insulin|medication|medicine|pills?|ibuprofen|paracetamol|acetaminophen)|do i have (cancer|diabetes|covid|a tumou?r|an? std|an? infection)|is (this|it) (cancer|a heart attack|a stroke|an? infection)|chest pain|can'?t breathe|overdose|drug interaction|treat my|cure my)\b/i;

export const CRISIS_REPLY =
  'I’m really sorry you’re feeling this way — you deserve support, and you don’t have to face this alone. Please reach out right now to people trained to help:\n\n• US & Canada: call or text 988 (Suicide & Crisis Lifeline)\n• UK & Ireland: call Samaritans on 116 123\n• Australia: call Lifeline on 13 11 14\n\nIf you’re in immediate danger, please call your local emergency number. If you can, talk to someone you trust today.';

export const MEDICAL_REPLY =
  'I can share general wellness information, but I can’t help with diagnosis, symptoms, medications, or dosages — that needs a qualified professional who knows your situation. Please talk to your doctor, pharmacist, or a local health service about this. I’m happy to explain general concepts or point you to a relevant calculator instead.';

export interface ToolLink { slug: string; title: string; }

interface Suggestion { match: RegExp; intro: string; tools: ToolLink[]; }

const SUGGESTIONS: Suggestion[] = [
  { match: /calorie|deficit|lose weight|maintenance|tdee/i, intro: 'For exact daily calorie targets, these calculators do the math for you:', tools: [{ slug: 'calorie-calculator', title: 'Calorie Calculator' }, { slug: 'calorie-deficit-calculator', title: 'Calorie Deficit Calculator' }, { slug: 'macro-calculator', title: 'Macro Calculator' }] },
  { match: /protein/i, intro: 'Here’s how to dial in your protein:', tools: [{ slug: 'protein-intake-calculator', title: 'Protein Intake Calculator' }, { slug: 'macro-calculator', title: 'Macro Calculator' }] },
  { match: /macro|carb|keto|low.?carb/i, intro: 'These split your calories into protein, carbs, and fat:', tools: [{ slug: 'macro-calculator', title: 'Macro Calculator' }, { slug: 'keto-calculator', title: 'Keto Calculator' }] },
  { match: /\bbmi\b|body fat|ideal weight|waist|overweight/i, intro: 'For body-composition numbers, try:', tools: [{ slug: 'bmi-calculator', title: 'BMI Calculator' }, { slug: 'body-fat-calculator', title: 'Body Fat Calculator' }, { slug: 'waist-to-height-ratio-calculator', title: 'Waist-to-Height Ratio' }] },
  { match: /water|hydrat|drink/i, intro: 'Here’s how to find your daily water target:', tools: [{ slug: 'water-intake-calculator', title: 'Water Intake Calculator' }] },
  { match: /sleep|bedtime|nap|tired|insomnia|rest/i, intro: 'These help with sleep timing and quality:', tools: [{ slug: 'sleep-calculator', title: 'Sleep Calculator' }, { slug: 'sleep-debt-calculator', title: 'Sleep Debt Calculator' }, { slug: 'sleep-quality-check', title: 'Sleep Quality Self-Check' }] },
  { match: /run|pace|marathon|5k|10k|jog/i, intro: 'For running, these are the ones to use:', tools: [{ slug: 'running-pace-calculator', title: 'Running Pace Calculator' }, { slug: 'vo2-max-calculator', title: 'VO₂ Max Calculator' }, { slug: 'calories-burned-calculator', title: 'Calories Burned Calculator' }] },
  { match: /heart rate|cardio|zone|vo2|resting pulse/i, intro: 'These cover heart-rate training:', tools: [{ slug: 'target-heart-rate-calculator', title: 'Target Heart Rate Calculator' }, { slug: 'max-heart-rate-calculator', title: 'Max Heart Rate Calculator' }] },
  { match: /blood pressure|\bbp\b|hypertension/i, intro: 'You can check a reading’s category here (not a diagnosis):', tools: [{ slug: 'blood-pressure-checker', title: 'Blood Pressure Checker' }] },
  { match: /stress|anxious|overwhelm|burn ?out|calm|breathe|breathing/i, intro: 'For stress and recovery, these may help:', tools: [{ slug: 'stress-level-check', title: 'Stress Self-Check' }, { slug: 'box-breathing-timer', title: 'Box Breathing Timer' }, { slug: 'burnout-self-check', title: 'Burnout Self-Check' }] },
  { match: /pregnan|due date|ovulation|period|fertile|cycle/i, intro: 'These cover pregnancy and cycle tracking:', tools: [{ slug: 'due-date-calculator', title: 'Due Date Calculator' }, { slug: 'ovulation-calculator', title: 'Ovulation Calculator' }, { slug: 'period-calculator', title: 'Period Calculator' }] },
  { match: /steps|walk|pedometer/i, intro: 'Turn your steps into distance and calories:', tools: [{ slug: 'steps-to-calories-calculator', title: 'Steps to Calories Calculator' }] },
  { match: /1rm|one.?rep|max lift|strength|bench|squat|deadlift/i, intro: 'Estimate your max safely from a lighter set:', tools: [{ slug: 'one-rep-max-calculator', title: 'One-Rep Max Calculator' }] },
  { match: /smoking|quit|cigarette|alcohol|drink/i, intro: 'These put lifestyle habits in perspective:', tools: [{ slug: 'smoking-cost-calculator', title: 'Smoking Cost Calculator' }, { slug: 'alcohol-units-calculator', title: 'Alcohol Units Calculator' }] },
];

const POPULAR: ToolLink[] = [
  { slug: 'calorie-calculator', title: 'Calorie Calculator' },
  { slug: 'bmi-calculator', title: 'BMI Calculator' },
  { slug: 'sleep-calculator', title: 'Sleep Calculator' },
];

/** Build the offline (no-endpoint) reply: general nudge + the right calculators. */
export function guidedReply(message: string): { text: string; tools: ToolLink[] } {
  const hit = SUGGESTIONS.find((s) => s.match.test(message));
  if (hit) {
    return { text: hit.intro, tools: hit.tools };
  }
  return {
    text:
      'I can point you to the right free calculator for most wellness, nutrition, fitness, and sleep questions. Try rephrasing, or start with one of these popular tools:',
    tools: POPULAR,
  };
}
