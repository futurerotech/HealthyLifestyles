/** Unified lookup across all category content files. */
import type { ToolContent } from './content-types';
import { BODY_WEIGHT_CONTENT } from './body-weight-content';
import { NUTRITION_CONTENT } from './nutrition-content';
import { SLEEP_CONTENT } from './sleep-content';
import { HEART_CONTENT } from './heart-content';
import { WOMENS_CONTENT } from './womens-content';
import { FITNESS_CONTENT } from './fitness-content';
import { RISK_CONTENT } from './risk-content';
import { MENTAL_CONTENT } from './mental-content';
import { METABOLIC_CONTENT } from './metabolic-content';

const ALL_CONTENT: Record<string, ToolContent> = {
  ...BODY_WEIGHT_CONTENT,
  ...NUTRITION_CONTENT,
  ...SLEEP_CONTENT,
  ...HEART_CONTENT,
  ...WOMENS_CONTENT,
  ...FITNESS_CONTENT,
  ...RISK_CONTENT,
  ...MENTAL_CONTENT,
  ...METABOLIC_CONTENT,
};

export const getToolContent = (slug: string): ToolContent | undefined =>
  ALL_CONTENT[slug];
