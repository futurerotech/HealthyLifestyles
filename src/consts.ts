/**
 * Sitewide constants — single source of truth for brand, nav, and metadata.
 */

export const SITE = {
  name: 'HealthyLifeStyles',
  tagline: 'Trusted Wellness',
  /** Used in <title> suffix and OG site name. */
  shortName: 'HealthyLifeStyles',
  description:
    'Free, instant, and accurate health calculators built on peer-reviewed scientific formulas. No signup, no data stored — just trustworthy wellness insights.',
  /** Default social share image (lives in /public). */
  ogImage: '/og-default.png',
  twitter: '@healthylifestyles',
  locale: 'en_US',
  themeColor: '#16a34a',
} as const;

/**
 * Analytics & verification.
 */
export const ANALYTICS = {
  /** GA4 Measurement ID */
  ga4Id: 'G-JCHJMQRZZZ',
  /** Google Search Console HTML tag verification token */
  searchConsoleVerification: 'iRrHUR8SUPd0LyPdHYbF8iLYfwrzYs4F3nLw7p-yo1c',
  /** Bing Webmaster Tools verification token */
  bingVerification: '',
} as const;

/**
 * Email newsletter.
 */
export const NEWSLETTER = {
  endpoint: '',
  emailField: 'email',
} as const;

/**
 * Contact form.
 */
export const CONTACT = {
  endpoint: '',
  email: 'hello@healthylifesstyles.com',
} as const;

/**
 * E-E-A-T
 */
export const EDITORIAL = {
  reviewerName: 'HealthyLifeStyles Medical Review Team',
  reviewerCredential: 'Licensed clinicians & registered dietitians',
  lastReviewed: '2026-06-01',
} as const;

/**
 * Advertising.
 *
 * Slot IDs and the publisher ID are sourced exclusively from the Payload CMS
 * AdManagement global. If the CMS fetch fails at build time, no ads render.
 * There is no static fallback.
 */
export const ADS = {
  publisherId: process.env.ADSENSE_PUBLISHER_ID ?? null,
} as const;

/**
 * AI Assistant.
 */
export const ASSISTANT = {
  endpoint: '',
} as const;

/**
 * Meal Plan Generator.
 */
export const MEAL_PLAN = {
  endpoint: '',
} as const;

/** Primary navigation shown in the header. */
export const NAV_LINKS = [
  { label: 'Calculators & Tools', href: '/tools' },
  { label: 'Wellness Hub', href: '/wellness-hub' },
  { label: 'Health Score', href: '/health-score' },
  { label: 'AI Assistant', href: '/ai-assistant' },
  { label: 'About', href: '/about' },
] as const;

/** Footer link groups. */
export const FOOTER_LEGAL = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
] as const;

export const FOOTER_COMPANY = [
  { label: 'About Us', href: '/about' },
  { label: 'Editorial Policy', href: '/editorial-policy' },
  { label: 'Methodology', href: '/methodology' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Contact', href: '/contact' },
  { label: 'All Tools', href: '/tools' },
  { label: 'Wellness Hub', href: '/wellness-hub' },
] as const;

export const SOCIAL_NETWORKS = {
  x: { label: 'X', color: '#000000' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  pinterest: { label: 'Pinterest', color: '#BD081C' },
  reddit: { label: 'Reddit', color: '#FF4500' },
} as const;

export type SocialNetwork = keyof typeof SOCIAL_NETWORKS;

export const SOCIAL_FOLLOW: { network: SocialNetwork; href: string }[] = [
  { network: 'facebook', href: 'https://www.facebook.com/healthylifestyles' },
  { network: 'x', href: 'https://x.com/healthylifestyles' },
  { network: 'pinterest', href: 'https://www.pinterest.com/healthylifestyles' },
  { network: 'linkedin', href: 'https://www.linkedin.com/company/healthylifestyles' },
];
