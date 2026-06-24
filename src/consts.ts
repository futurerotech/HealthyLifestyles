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
 * Analytics & verification. Replace the placeholders with your real values.
 * Until `ga4Id` is a real `G-XXXXXXXXXX` id, Google Analytics stays OFF
 * (the loader is inert), so no tracking happens with the placeholder.
 */
export const ANALYTICS = {
  /** Your GA4 Measurement ID, e.g. 'G-AB12CD34EF'. Placeholder = analytics disabled. */
  ga4Id: 'G-XXXXXXXXXX',
  /** Google Search Console "HTML tag" token (the content="…" value). Empty = no tag. */
  searchConsoleVerification: '',
  /** Bing Webmaster Tools verification token (the content of the msvalidate.01 meta). Empty = no tag. */
  bingVerification: '',
} as const;

/**
 * Email newsletter. Paste the POST endpoint from your provider (Buttondown,
 * ConvertKit, Mailchimp embedded form action, etc.). While empty, the signup
 * block still renders but submits to a mailto: fallback so no email is lost.
 */
export const NEWSLETTER = {
  /** Form POST action URL from your ESP. Empty = mailto fallback. */
  endpoint: '',
  /** The form field name your ESP expects for the email (e.g. 'email', 'EMAIL'). */
  emailField: 'email',
} as const;

/**
 * Contact form. Paste a form-handler endpoint (Formspree, Web3Forms, your own
 * serverless function). While empty, the form falls back to a mailto: to the
 * address below. (Contact-form backend wiring is part of the next batch.)
 */
export const CONTACT = {
  /** Form POST action URL. Empty = mailto fallback. */
  endpoint: '',
  /** Public contact email (also shown on the Contact page). */
  email: 'hello@healthylifestyles.com',
} as const;

/**
 * E-E-A-T: who creates and reviews the content. Replace the reviewer name and
 * credentials with a real, named, qualified professional before launch.
 */
export const EDITORIAL = {
  reviewerName: 'HealthyLifeStyles Medical Review Team',
  reviewerCredential: 'Licensed clinicians & registered dietitians',
  /** ISO date the health content was last reviewed (used in MedicalWebPage JSON-LD). */
  lastReviewed: '2026-06-01',
} as const;

/**
 * Advertising. Build the slots now, fill ads after AdSense approval. While
 * `client` is empty, every <AdSlot> just reserves its fixed space and shows a
 * placeholder (no layout shift, no network calls). Set `client` + per-slot ids
 * to go live; ads then lazy-load and only after the visitor accepts cookies.
 */
export const ADS = {
  /** AdSense publisher id, e.g. 'ca-pub-1234567890123456'. Empty = placeholders only. */
  client: '',
  /** data-ad-slot ids per placement (create in AdSense after approval). */
  slots: { afterResult: '', midContent: '', sidebar: '' },
} as const;

/**
 * AI Assistant. Optional URL of YOUR serverless endpoint that proxies an LLM
 * (so the API key stays server-side). It should accept POST { system, messages }
 * and return JSON { reply }. While empty, the assistant runs in a safe guided
 * mode (no model call) that still enforces every guardrail below.
 */
export const ASSISTANT = {
  endpoint: '',
} as const;

/**
 * Meal Plan Generator. The generator works fully offline from the curated
 * recipe database. Optionally, set `endpoint` to YOUR serverless proxy that
 * calls the Anthropic API: it should accept POST { targets, diet, mealsPerDay,
 * excludeAllergens, excludeText } and return JSON { days: [...] }. Results are
 * validated against the macro math and cached; on any failure or mismatch the
 * generator silently falls back to the local algorithm. Empty = local only.
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

/**
 * Social networks — brand label + accent, used by both the article <ShareBar>
 * and the footer "Follow us" row. Keys match the glyph names in SocialIcon.astro.
 */
export const SOCIAL_NETWORKS = {
  x: { label: 'X', color: '#000000' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  pinterest: { label: 'Pinterest', color: '#BD081C' },
  reddit: { label: 'Reddit', color: '#FF4500' },
} as const;

export type SocialNetwork = keyof typeof SOCIAL_NETWORKS;

/**
 * The brand's OWN profiles for the footer "Follow us" row.
 * TODO: replace these placeholder hrefs with your real profile URLs before launch.
 */
export const SOCIAL_FOLLOW: { network: SocialNetwork; href: string }[] = [
  { network: 'facebook', href: 'https://www.facebook.com/healthylifestyles' },
  { network: 'x', href: 'https://x.com/healthylifestyles' },
  { network: 'pinterest', href: 'https://www.pinterest.com/healthylifestyles' },
  { network: 'linkedin', href: 'https://www.linkedin.com/company/healthylifestyles' },
];
