/**
 * Authors & reviewers for E-E-A-T bylines and /author/[slug] pages.
 *
 * HONESTY NOTE: these are organizational entities, not invented individuals.
 * Add a named person only after verifying their identity and credentials.
 */
import { SOCIAL_FOLLOW, SOCIAL_NETWORKS } from '../consts';

export interface AuthorLink {
  network: keyof typeof SOCIAL_NETWORKS | 'website';
  href: string;
}

export interface Author {
  slug: string;
  name: string;
  /** Short role line, e.g. "Research & Editorial". */
  role: string;
  /** Professional credential (reviewers). Shown after the name in bylines. */
  credential?: string;
  /** 1–3 sentence bio (honest, no invented claims). */
  bio: string;
  /** Monogram shown in the avatar (1–2 chars). */
  initials: string;
  /** Avatar background (brand gradient key handled in Avatar.astro). */
  color: string;
  /** Schema.org type — Organization for our teams; Person for named individuals. */
  schemaType: 'Organization' | 'Person';
  links?: AuthorLink[];
}

const SITE_LINKS: AuthorLink[] = SOCIAL_FOLLOW.map((s) => ({ network: s.network, href: s.href }));

export const AUTHORS: Author[] = [
  {
    slug: 'editorial-team',
    name: 'HealthyLifeStyles Editorial Team',
    role: 'Research & Writing',
    bio: 'Our editorial team researches and writes every calculator explainer and Wellness Hub guide. We ground each one in peer-reviewed studies and primary sources (CDC, WHO, ACOG, AHA, and the published literature), link those sources openly, and revisit articles as the evidence changes.',
    initials: 'HE',
    color: '#16a34a',
    schemaType: 'Organization',
    links: SITE_LINKS,
  },
];

// Canonical roles used across the site.
export const DEFAULT_AUTHOR_SLUG = 'editorial-team';

export const getAuthor = (slug: string): Author | undefined =>
  AUTHORS.find((a) => a.slug === slug);

/** Resolve an author by slug OR by display name (articles store the name). */
export const resolveAuthor = (nameOrSlug: string): Author => {
  const bySlug = getAuthor(nameOrSlug);
  if (bySlug) return bySlug;
  const byName = AUTHORS.find((a) => a.name === nameOrSlug);
  return byName ?? getAuthor(DEFAULT_AUTHOR_SLUG)!;
};
