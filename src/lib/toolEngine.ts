/**
 * Which calculator island powers a given tool. Mirrors the engine switch in
 * ToolPageLayout so the Wellness Hub can embed the SAME live calculator inline.
 */
import type { Tool } from '../data/tools';

export type Engine =
  | 'meal' | 'lifestyle-age' | 'strength' | 'caffeine' | 'muscle' | 'sitting'
  | 'fasting' | 'chronotype' | 'walk-it-off' | 'weight-timeline' | 'caffeine-tracker'
  | 'healthspan' | 'sleep' | 'date' | 'pace' | 'quiz' | 'breathing' | 'numeric' | 'diary' | 'hrv' | 'recipe';

const DATE_TOOLS = new Set([
  'due-date-calculator',
  'pregnancy-week-calculator',
  'ovulation-calculator',
  'period-calculator',
]);
// Every questionnaire in islands/quizzes/quiz-defs.ts must be listed here, or its
// page falls through to the numeric engine and renders no calculator at all
// (PHQ-9, GAD-7 and WHO-5 were missing from 2026-07-05 to 2026-11-14).
// tool-engine-integrity.test.mjs enforces this for every tool.
const QUIZ_TOOLS = new Set([
  'sleep-quality-check', 'stress-level-check', 'burnout-self-check',
  'phq-9-depression-screener', 'gad-7-anxiety-screener', 'who-5-wellbeing-screener',
]);

/** Slug → engine for the coded-island tools (each has its own bespoke island).
 *  Must mirror the engine switch in ToolPageLayout.astro. */
const CODED: Record<string, Engine> = {
  'meal-plan-generator': 'meal',
  'lifestyle-age-test': 'lifestyle-age',
  'strength-program-builder': 'strength',
  'caffeine-curfew-calculator': 'caffeine',
  'muscle-preservation-calculator': 'muscle',
  'sitting-disease-reversal-calculator': 'sitting',
  'intermittent-fasting-calculator': 'fasting',
  'sleep-chronotype-quiz': 'chronotype',
  'walk-it-off-calculator': 'walk-it-off',
  'weight-loss-timeline-calculator': 'weight-timeline',
  'caffeine-intake-calculator': 'caffeine-tracker',
  'healthspan-score': 'healthspan',
  'food-symptom-diary': 'diary',
  'hrv-explainer-log': 'hrv',
  'blue-light-exposure-estimator': 'numeric',
  'recipe-nutrition-analyzer': 'recipe',
};

export function getEngine(tool: Tool): Engine {
  if (CODED[tool.slug]) return CODED[tool.slug]; // coded islands win (some are category 'sleep')
  if (tool.category === 'sleep') return 'sleep';
  if (DATE_TOOLS.has(tool.slug)) return 'date';
  if (tool.slug === 'running-pace-calculator') return 'pace';
  if (QUIZ_TOOLS.has(tool.slug)) return 'quiz';
  if (tool.slug === 'box-breathing-timer') return 'breathing';
  return 'numeric';
}
