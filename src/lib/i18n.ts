/**
 * P15-P6 — i18n rails (single registry, SD4).
 *
 * en is canonical and unprefixed; es/ar are enabled but produce routes ONLY
 * for content that genuinely exists in that locale (the CMS is queried with
 * fallback-locale=none and untranslated docs are skipped) — no empty shells,
 * no fabricated translations, ever (SD3).
 *
 * Deliberate design decision: we do NOT use Astro's `i18n` config block. These
 * are plain SSG dynamic routes ([locale]/...) — fully deterministic, zero
 * framework routing magic, compatible with output:'static'.
 */
export const DEFAULT_LOCALE = 'en' as const;
export const LOCALES = ['en', 'es', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const NON_DEFAULT_LOCALES = LOCALES.filter((l): l is Exclude<Locale, 'en'> => l !== DEFAULT_LOCALE);

const RTL_LOCALES: readonly Locale[] = ['ar'];

/** Open Graph locale identifiers per locale. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  ar: 'ar_AR',
};

export const dirFor = (locale: string): 'ltr' | 'rtl' =>
  RTL_LOCALES.includes(locale as Locale) ? 'rtl' : 'ltr';

export const ogLocaleFor = (locale: string): string => OG_LOCALE[locale as Locale] || OG_LOCALE.en;

/** Prefix a site-absolute path for a locale (default locale stays unprefixed). */
export const localePath = (locale: string, path: string): string =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path.startsWith('/') ? '' : '/'}${path}`;

export interface HreflangAlternate {
  hreflang: string;
  href: string;
}

/**
 * Reciprocal hreflang set for a route available in `locales` (must include
 * the default). Returns [] when only one locale exists — a single-language
 * page must emit NO hreflang (a lone tag is an unpaired return-tag error).
 * x-default always targets the canonical English equivalent.
 */
export function hreflangSet(origin: string, path: string, locales: string[]): HreflangAlternate[] {
  const unique = [...new Set([DEFAULT_LOCALE as string, ...locales])];
  if (unique.length < 2) return [];
  const abs = (l: string) => `${origin}${localePath(l, path)}`;
  return [
    ...unique.map((l) => ({ hreflang: l, href: abs(l) })),
    { hreflang: 'x-default', href: abs(DEFAULT_LOCALE) },
  ];
}
