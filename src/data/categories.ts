/**
 * Tool categories. `accent` is a CSS custom-property name defined in global.css;
 * `color` is the raw hex for inline use (SVG fills, JSON-LD, etc.).
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Short tagline shown on cards. */
  blurb: string;
  /** Icon key resolved by <Icon name=.. />. */
  icon: string;
  accent: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'nutrition',
    name: 'Nutrition',
    slug: 'nutrition',
    blurb: 'Calories, macros, and daily intake targets.',
    icon: 'leaf',
    accent: 'var(--c-nutrition)',
    color: '#f97316',
  },
  {
    id: 'body-weight',
    name: 'Body & Weight',
    slug: 'body-weight',
    blurb: 'BMI, body fat, and healthy weight ranges.',
    icon: 'scale',
    accent: 'var(--c-body)',
    color: '#3b82f6',
  },
  {
    id: 'fitness',
    name: 'Fitness',
    slug: 'fitness',
    blurb: 'Training pace, strength, and performance.',
    icon: 'dumbbell',
    accent: 'var(--c-fitness)',
    color: '#8b5cf6',
  },
  {
    id: 'heart-vitals',
    name: 'Heart Health',
    slug: 'heart-health',
    blurb: 'Heart rate zones, max HR, and blood pressure.',
    icon: 'heart-pulse',
    accent: 'var(--c-heart)',
    color: '#ef4444',
  },
  {
    id: 'metabolic',
    name: 'Metabolic Health',
    slug: 'metabolic',
    blurb: 'Hydration, metabolism, and energy use.',
    icon: 'droplet',
    accent: 'var(--c-metabolic)',
    color: '#14b8a6',
  },
  {
    id: 'sleep',
    name: 'Sleep & Recovery',
    slug: 'sleep',
    blurb: 'Sleep cycles, naps, and sleep debt.',
    icon: 'moon',
    accent: 'var(--c-sleep)',
    color: '#6366f1',
  },
  {
    id: 'womens-health',
    name: "Women's Health",
    slug: 'womens-health',
    blurb: 'Cycle, ovulation, and pregnancy tools.',
    icon: 'sparkle',
    accent: 'var(--c-women)',
    color: '#ec4899',
  },
  {
    id: 'health-risk',
    name: 'Health Risk',
    slug: 'health-risk',
    blurb: 'Educational risk estimates — not a diagnosis.',
    icon: 'gauge',
    accent: 'var(--c-risk)',
    color: '#d97706',
  },
  {
    id: 'mental-wellness',
    name: 'Mental Wellness',
    slug: 'mental-wellness',
    blurb: 'Self-reflection check-ins and calming tools.',
    icon: 'smile',
    accent: 'var(--c-mind)',
    color: '#0ea5e9',
  },
];

export const getCategory = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id || c.slug === id);
