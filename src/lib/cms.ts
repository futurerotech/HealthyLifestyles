/**
 * CMS data client (Astro build-time).
 *
 * Reads published content from the Payload CMS REST API and normalizes it into
 * the SAME shapes the site already uses (`Tool`, `Category`, `Article`), so
 * pages can move from `import { TOOLS }` to `await getTools()` with no
 * downstream changes.
 *
 * If the CMS is unreachable, misconfigured, or returns nothing, every getter
 * falls back to the local `src/data/*` files. This keeps the site building even
 * with no CMS running — the CMS is an enhancement, not a hard dependency.
 *
 * Configure with CMS_URL (defaults to http://localhost:3000). Set CMS_DISABLE=1
 * to force local data (useful for CI / offline builds).
 */

import { TOOLS as LOCAL_TOOLS, getPopularTools as localPopularTools, getToolsByCategory as localToolsByCat, getRelatedTools as localRelatedTools, getLiveTools as localLiveTools, type Tool } from '../data/tools';
import { CATEGORIES as LOCAL_CATEGORIES, type Category } from '../data/categories';
import { ARTICLES as LOCAL_ARTICLES, ARTICLE_CATEGORIES as LOCAL_ARTICLE_CATEGORIES, ARTICLES_PER_PAGE, type Article, type ArticleCategory, type ArticleBlock } from '../data/articles';
import { AUTHORS as LOCAL_AUTHORS, resolveAuthor as localResolveAuthor, type Author } from '../data/authors';
import { SITE as LOCAL_SITE, NAV_LINKS as LOCAL_NAV_LINKS, FOOTER_LEGAL as LOCAL_FOOTER_LEGAL, FOOTER_COMPANY as LOCAL_FOOTER_COMPANY, SOCIAL_FOLLOW as LOCAL_SOCIAL_FOLLOW, SOCIAL_NETWORKS as LOCAL_SOCIAL_NETWORKS, ANALYTICS as LOCAL_ANALYTICS, EDITORIAL as LOCAL_EDITORIAL, CONTACT as LOCAL_CONTACT } from '../consts';

const CMS_URL = (import.meta.env.CMS_URL as string) || 'http://localhost:3000';
const DISABLED = (import.meta.env.CMS_DISABLE as string) === '1';
const TIMEOUT_MS = 4000;

/** Payload REST list envelope. */
interface PayloadList<T> {
  docs: T[];
  totalDocs: number;
}

/** Fetch JSON from the CMS with a short timeout. Returns null on any failure. */
async function cmsFetch<T>(pathAndQuery: string): Promise<T | null> {
  if (DISABLED) return null;
  try {
    const res = await fetch(`${CMS_URL}${pathAndQuery}`, {
      headers: { Accept: 'application/json' },
      // Always pull fresh CMS data — never serve a cached ad/content config.
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/**
 * Absolute media URL. S3/R2 public URLs (http…) pass through unchanged; a
 * relative CMS path (/api/media/… or /media/…) is resolved against the CMS
 * origin so the static site never requests it from its own domain (which 404s).
 */
function absMediaUrl(v: unknown): string {
  const s = str(v);
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `${CMS_URL}${s.startsWith('/') ? '' : '/'}${s}`;
}

function pickSlug(rel: unknown): string {
  if (rel && typeof rel === 'object') {
    const o = rel as Record<string, unknown>;
    return str(o.slug || o.id);
  }
  return str(rel);
}

function pickId(rel: unknown): string {
  if (rel && typeof rel === 'object') {
    const o = rel as Record<string, unknown>;
    return str(o.id || o.slug);
  }
  return str(rel);
}

/* ────────────────────────────────────────────  Settings / Site ── */

interface CmsSettings {
  siteTitle?: string;
  tagline?: string;
  description?: string;
  primaryColor?: string;
  ga4Id?: string;
  searchConsoleId?: string;
  affiliateDisclosure?: string;
  contactEmail?: string;
  copyrightText?: string;
  nav?: { label: string; href: string }[];
  footerLinks?: { label: string; href: string }[];
  social?: { platform: string; url: string; color: string }[];
}

const PLATFORM_MAP: Record<string, string> = {
  'X (Twitter)': 'x',
  Facebook: 'facebook',
  LinkedIn: 'linkedin',
  Pinterest: 'pinterest',
  Instagram: 'instagram',
  YouTube: 'youtube',
  TikTok: 'tiktok',
  Threads: 'threads',
  Bluesky: 'bluesky',
  WhatsApp: 'whatsapp',
  Reddit: 'reddit',
};

export interface SiteData {
  name: string;
  tagline: string;
  shortName: string;
  description: string;
  ogImage: string;
  twitter: string;
  locale: string;
  themeColor: string;
}

export interface NavLink { label: string; href: string }

export interface SiteConsts {
  SITE: SiteData;
  NAV_LINKS: NavLink[];
  FOOTER_LEGAL: NavLink[];
  FOOTER_COMPANY: NavLink[];
  SOCIAL_FOLLOW: { network: string; href: string }[];
  SOCIAL_NETWORKS: Record<string, { label: string; color: string }>;
  ANALYTICS: { ga4Id: string; searchConsoleVerification: string };
  EDITORIAL: { reviewerName: string; reviewerCredential: string; lastReviewed: string };
  CONTACT: { email: string };
}

function mapSocialNetwork(
  platform: string,
  url: string,
  color: string,
): { network: string; href: string } {
  const network = PLATFORM_MAP[platform] || platform.toLowerCase().replace(/\s+/g, '-');
  return { network, href: url };
}

async function getCmsSettings(): Promise<CmsSettings | null> {
  return cmsFetch<CmsSettings>('/api/globals/settings?depth=0');
}

/** Consolidated site constants from CMS (settings global) with local fallback. */
export async function getSiteConsts(): Promise<SiteConsts> {
  const s = await getCmsSettings();
  if (!s) {
    return {
      SITE: LOCAL_SITE as unknown as SiteData,
      NAV_LINKS: [...LOCAL_NAV_LINKS] as NavLink[],
      FOOTER_LEGAL: [...LOCAL_FOOTER_LEGAL] as NavLink[],
      FOOTER_COMPANY: [...LOCAL_FOOTER_COMPANY] as NavLink[],
      SOCIAL_FOLLOW: [...LOCAL_SOCIAL_FOLLOW].map((s) => ({ network: s.network, href: s.href })),
      SOCIAL_NETWORKS: { ...LOCAL_SOCIAL_NETWORKS } as Record<string, { label: string; color: string }>,
      ANALYTICS: { ...LOCAL_ANALYTICS } as { ga4Id: string; searchConsoleVerification: string },
      EDITORIAL: { ...LOCAL_EDITORIAL } as { reviewerName: string; reviewerCredential: string; lastReviewed: string },
      CONTACT: { ...LOCAL_CONTACT } as { email: string },
    };
  }

  const socialFollow = (s.social || []).map((x) => mapSocialNetwork(x.platform, x.url, x.color));

  const socialNetworks: Record<string, { label: string; color: string }> = {};
  for (const x of s.social || []) {
    const network = PLATFORM_MAP[x.platform] || x.platform.toLowerCase().replace(/\s+/g, '-');
    socialNetworks[network] = { label: x.platform, color: x.color };
  }

  return {
    SITE: {
      name: s.siteTitle || LOCAL_SITE.name,
      tagline: s.tagline || LOCAL_SITE.tagline,
      shortName: s.siteTitle || LOCAL_SITE.name,
      description: s.description || LOCAL_SITE.description,
      ogImage: LOCAL_SITE.ogImage,
      twitter: LOCAL_SITE.twitter,
      locale: LOCAL_SITE.locale,
      themeColor: s.primaryColor || LOCAL_SITE.themeColor,
    },
    NAV_LINKS: (s.nav || LOCAL_NAV_LINKS).map((l) => ({ label: l.label, href: l.href })),
    FOOTER_LEGAL: [...LOCAL_FOOTER_LEGAL].map((l) => ({ label: l.label, href: l.href })),
    FOOTER_COMPANY: [...LOCAL_FOOTER_COMPANY].map((l) => ({ label: l.label, href: l.href })),
    SOCIAL_FOLLOW: socialFollow.length > 0 ? socialFollow : [...LOCAL_SOCIAL_FOLLOW].map((s) => ({ network: s.network, href: s.href })),
    SOCIAL_NETWORKS: Object.keys(socialNetworks).length > 0 ? socialNetworks : { ...LOCAL_SOCIAL_NETWORKS } as Record<string, { label: string; color: string }>,
    ANALYTICS: {
      ga4Id: s.ga4Id || LOCAL_ANALYTICS.ga4Id,
      searchConsoleVerification: s.searchConsoleId || LOCAL_ANALYTICS.searchConsoleVerification,
    },
    EDITORIAL: { ...LOCAL_EDITORIAL } as { reviewerName: string; reviewerCredential: string; lastReviewed: string },
    CONTACT: {
      email: s.contactEmail || LOCAL_CONTACT.email,
    },
  };
}

/* ────────────────────────────────────────────  Tools ── */

interface CmsTool {
  id?: string;
  slug?: string;
  name?: string;
  category?: unknown;
  icon?: string;
  gradient?: string;
  enabled?: boolean;
  featured?: boolean;
  sortOrder?: number;
  related?: unknown[];
  riskLevel?: string;
  semanticEntities?: { term?: string; url?: string }[];
  seo?: { metaDescription?: string; keywords?: string[] };
}

function mapTool(t: CmsTool): Tool {
  return {
    slug: str(t.slug),
    title: str(t.name),
    blurb: str(t.seo?.metaDescription),
    category: pickSlug(t.category),
    keywords: Array.isArray(t.seo?.keywords) ? t.seo!.keywords!.map(String) : [],
    icon: str(t.icon) || undefined,
    gradient: str(t.gradient) || undefined,
    popular: Boolean(t.featured),
    related: Array.isArray(t.related) ? t.related.map(pickSlug).filter(Boolean) : undefined,
    live: t.enabled !== false,
    riskLevel: t.riskLevel === 'high' || t.riskLevel === 'medium' ? t.riskLevel : 'low',
    semanticEntities: (t.semanticEntities || [])
      .map((e) => ({ term: str(e.term), url: str(e.url) || undefined }))
      .filter((e) => e.term),
  };
}

/** All tools the public site should show. CMS-first, local fallback. */
export async function getTools(): Promise<Tool[]> {
  const data = await cmsFetch<PayloadList<CmsTool>>(
    '/api/tools?where[enabled][equals]=true&limit=300&depth=1&sort=sortOrder',
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs.map(mapTool).filter((t) => t.slug && t.title);
  }
  return LOCAL_TOOLS;
}

export async function getPopularTools(limit = 6): Promise<Tool[]> {
  const data = await cmsFetch<PayloadList<CmsTool>>(
    `/api/tools?where[enabled][equals]=true&where[featured][equals]=true&limit=${limit}&depth=1&sort=sortOrder`,
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs.map(mapTool).filter((t) => t.slug && t.title);
  }
  return localPopularTools(limit);
}

export async function getToolsByCategory(catSlug: string): Promise<Tool[]> {
  const all = await getTools();
  const filtered = all.filter((t) => t.category === catSlug);
  if (filtered.length > 0) return filtered;
  return localToolsByCat(catSlug);
}

export async function getRelatedTools(slug: string, limit = 4): Promise<Tool[]> {
  const all = await getTools();
  const tool = all.find((t) => t.slug === slug);
  if (!tool) return localRelatedTools(slug, limit);
  const out: Tool[] = [];
  const push = (t?: Tool) => { if (t && t.live && t.slug !== slug && !out.includes(t)) out.push(t); };
  (tool.related ?? []).forEach((s) => push(all.find((t) => t.slug === s)));
  const sameCat = all.filter((t) => t.category === tool.category && t.live && t.slug !== slug);
  for (const t of sameCat) { if (out.length >= limit) break; push(t); }
  for (const t of all) { if (out.length >= limit) break; push(t); }
  return out.slice(0, limit);
}

export async function getLiveTools(): Promise<Tool[]> {
  const all = await getTools();
  return all.filter((t) => t.live);
}

export async function getTool(slug: string): Promise<Tool | undefined> {
  const all = await getTools();
  return all.find((t) => t.slug === slug);
}

/* ────────────────────────────────────────────  Categories (tool) ── */

interface CmsCategory {
  slug?: string;
  name?: string;
  description?: string;
  icon?: string;
  accentColor?: string;
  accent?: string;
  order?: number;
}

function mapCategory(c: CmsCategory): Category {
  const color = str(c.accentColor) || '#16a34a';
  return {
    id: str(c.slug),
    name: str(c.name),
    slug: str(c.slug),
    blurb: str(c.description),
    icon: str(c.icon) || 'leaf',
    accent: str(c.accent) || color,
    color,
  };
}

export async function getCategories(): Promise<Category[]> {
  const data = await cmsFetch<PayloadList<CmsCategory>>(
    '/api/categories?where[kind][equals]=tool&limit=50&depth=0&sort=order',
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs.map(mapCategory).filter((c) => c.id && c.name);
  }
  return LOCAL_CATEGORIES;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug || c.id === slug);
}

/* ────────────────────────────────────────────  Article Categories ── */

interface CmsArticleCategory {
  slug?: string;
  name?: string;
  description?: string;
  icon?: string;
  accentColor?: string;
  accent?: string;
  order?: number;
}

function mapArticleCategory(c: CmsArticleCategory): ArticleCategory {
  const color = str(c.accentColor) || '#16a34a';
  return {
    id: str(c.slug),
    name: str(c.name || str(c.slug)),
    slug: str(c.slug),
    blurb: str(c.description),
    icon: str(c.icon) || 'book',
    color,
  };
}

async function getRawArticleCategories(): Promise<CmsArticleCategory[]> {
  const data = await cmsFetch<PayloadList<CmsArticleCategory>>(
    '/api/categories?where[kind][equals]=section&limit=50&depth=0&sort=order',
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) return data.docs;
  return [];
}

/** Article categories (content sections) — CMS-first, local fallback. */
export async function getArticleCategories(): Promise<ArticleCategory[]> {
  const cats = await getRawArticleCategories();
  if (cats.length > 0) return cats.map(mapArticleCategory).filter((c) => c.id && c.name);
  return LOCAL_ARTICLE_CATEGORIES;
}

export async function getArticleCategory(idOrSlug: string): Promise<ArticleCategory | undefined> {
  const all = await getArticleCategories();
  return all.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

/* ────────────────────────────────────────────  Articles ── */

interface CmsArticleBlock {
  blockType?: string;
  style?: string;
  text?: string;
  tone?: string;
  title?: string;
  items?: { text?: string }[] | string[];
  tool?: unknown;
  label?: string;
  caption?: string;
  headers?: string[];
  rows?: { cells?: string[] }[] | string[][];
  heading?: string;
  question?: string;
  answer?: string;
}

interface CmsArticle {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  heroImage?: { url?: string; alt?: string; width?: number; height?: number } | null;
  layout?: CmsArticleBlock[];
  faq?: { question?: string; answer?: string }[];
  sources?: { label?: string; url?: string }[];
  category?: unknown;
  author?: unknown;
  reviewer?: unknown;
  tags?: string[];
  publishDate?: string;
  updatedDate?: string;
  featured?: boolean;
  isHowTo?: boolean;
  isHealthTopic?: boolean;
  primaryTool?: unknown;
  relatedTools?: unknown[];
  relatedArticles?: unknown[];
  seo?: { metaTitle?: string; metaDescription?: string };
  semanticEntities?: { term?: string; url?: string }[];
  hasFAQ?: boolean;
  takeaways?: { text?: string }[];
  _status?: string;
}

function mapArticle(a: CmsArticle): Article {
  const catSlug = pickSlug(a.category);
  const authorObj = a.author as Record<string, unknown> | undefined;
  const reviewerObj = a.reviewer as Record<string, unknown> | undefined;

  return {
    slug: str(a.slug),
    title: str(a.title),
    seoTitle: str(a.seo?.metaTitle || a.title),
    metaDescription: str(a.seo?.metaDescription || a.excerpt),
    category: catSlug,
    excerpt: str(a.excerpt),
    heroImage: a.heroImage
      ? {
          url: absMediaUrl(a.heroImage.url),
          alt: str(a.heroImage.alt),
          // Intrinsic dimensions from the media doc → width/height attributes on
          // the <img>, so the browser reserves space and the hero causes no CLS.
          width: typeof a.heroImage.width === 'number' ? a.heroImage.width : undefined,
          height: typeof a.heroImage.height === 'number' ? a.heroImage.height : undefined,
        }
      : undefined,
    author: str(authorObj?.name || pickSlug(a.author)),
    authorBio: str(authorObj?.bio) || undefined,
    reviewer: str(reviewerObj?.name || pickSlug(a.reviewer)) || undefined,
    reviewerBio: str(reviewerObj?.bio) || undefined,
    publishDate: str(a.publishDate).split('T')[0],
    updatedDate: str(a.updatedDate).split('T')[0] || str(a.publishDate).split('T')[0],
    featured: Boolean(a.featured),
    isHowTo: Boolean(a.isHowTo),
    isHealthTopic: Boolean(a.isHealthTopic),
    // P15-P7 — editorial AEO controls (SD4: flags, never heuristics).
    hasFAQ: Boolean(a.hasFAQ),
    takeaways: (a.takeaways || []).map((t) => str(t.text)).filter(Boolean),
    primaryTool: pickSlug(a.primaryTool),
    relatedTools: (a.relatedTools || []).map(pickSlug).filter(Boolean),
    relatedArticles: (a.relatedArticles || []).map(pickSlug).filter(Boolean),
    sources: (a.sources || []).map((s) => ({
      citation: str(s.label || s.url),
      url: str(s.url) || undefined,
    })),
    tags: ((a.tags as Record<string, unknown>[] | undefined)?.map((t) => ({
      name: str(t.name),
      slug: str(t.slug || t.id),
    })) || []),
    semanticEntities: (a.semanticEntities || [])
      .map((e) => ({ term: str(e.term), url: str(e.url) || undefined }))
      .filter((e) => e.term),
    body: mapArticleBlocks(a.layout || []) as ArticleBlock[],
  };
}

function mapArticleBlocks(blocks: CmsArticleBlock[]): ArticleBlock[] {
  return blocks.map((b) => {
    switch (b.blockType) {
      case 'text':
        return { type: (b.style as 'p' | 'h2' | 'h3') || 'p', text: str(b.text) } as ArticleBlock;
      case 'list':
        return {
          type: (b.style === 'ordered' ? 'ol' : 'ul') as 'ul' | 'ol',
          items: (b.items || []).map((i: unknown) => typeof i === 'string' ? i : str((i as { text?: string })?.text)),
        } as ArticleBlock;
      case 'callout':
        return {
          type: 'callout',
          tone: (b.tone as 'info' | 'tip' | 'warning') || 'info',
          title: str(b.title),
          text: str(b.text),
        } as ArticleBlock;
      case 'toolEmbed':
        return {
          type: 'tool',
          slug: pickSlug(b.tool || b.label || ''),
          label: str(b.label),
        } as ArticleBlock;
      case 'table':
        return {
          type: 'table',
          caption: str(b.caption),
          headers: Array.isArray(b.headers) ? b.headers : [],
          rows: Array.isArray(b.rows) ? b.rows.map((r: unknown) => {
            if (Array.isArray(r)) return r;
            if (r && typeof r === 'object') {
              const cells = (r as { cells?: string[] }).cells;
              return Array.isArray(cells) ? cells : [];
            }
            return [];
          }) : [],
        } as ArticleBlock;
      case 'peopleAlsoAsk':
        return {
          type: 'paa',
          heading: str(b.heading),
          items: (((b as Record<string, unknown>).items) as Array<Record<string, unknown>> || []).map((i) => ({
            q: str((i as Record<string, unknown>).question || (i as Record<string, unknown>).q),
            a: str((i as Record<string, unknown>).answer || (i as Record<string, unknown>).a),
          })),
        } as ArticleBlock;
      default:
        return { type: 'p', text: '' } as ArticleBlock;
    }
  }).filter((b: ArticleBlock) => !(b.type === 'p' && !(b as { text?: string }).text)) as ArticleBlock[];
}

export async function getArticle(slug: string): Promise<Article | null> {
  const data = await cmsFetch<PayloadList<CmsArticle>>(
    `/api/articles?where[slug][equals]=${slug}&depth=2&draft=false`,
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return mapArticle(data.docs[0]);
  }
  const local = LOCAL_ARTICLES.find((a) => a.slug === slug);
  return local || null;
}

// One shared fetch for the whole build. Previously EVERY prerendered page
// re-ran this heavy depth-2 query; any single 4s timeout silently dropped that
// one page to the local fallback (no hero images, stale copy) — builds were
// nondeterministic per page. The promise is cached so all pages await the same
// result, and the fetch retries twice before falling back for everyone.
let _articlesPromise: Promise<Article[]> | null = null;

export function getArticles(): Promise<Article[]> {
  if (!_articlesPromise) {
    _articlesPromise = (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const data = await cmsFetch<PayloadList<CmsArticle>>(
          '/api/articles?limit=1000&depth=2&sort=-publishDate&draft=false',
        );
        if (data && Array.isArray(data.docs) && data.docs.length > 0) {
          return data.docs.map(mapArticle).filter((a) => a.slug && a.title);
        }
      }
      console.error('[CMS] getArticles failed 3× — building from LOCAL article data (no hero images).');
      return LOCAL_ARTICLES;
    })();
  }
  return _articlesPromise;
}

// ── P15-P6: locale-aware article fetch ───────────────────────────────────────
// Non-default locales query the CMS with fallback-locale=none so untranslated
// localized fields come back null — those docs are SKIPPED (deterministic
// missing-translation behavior: no route, no hreflang, no empty shells, SD3).
// There is deliberately NO local fallback here: LOCAL_ARTICLES is English-only,
// and serving it under /es/ or /ar/ would fabricate translations. On CMS
// failure a locale simply emits zero routes — never a failed build (SD5).
const _localeArticles = new Map<string, Promise<Article[]>>();

export function getArticlesForLocale(locale: string): Promise<Article[]> {
  if (locale === 'en') return getArticles();
  let p = _localeArticles.get(locale);
  if (!p) {
    p = (async () => {
      const data = await cmsFetch<PayloadList<CmsArticle>>(
        `/api/articles?limit=1000&depth=2&sort=-publishDate&draft=false&locale=${locale}&fallback-locale=none`,
      );
      if (!data || !Array.isArray(data.docs)) return [];
      return data.docs
        // Translated = the localized essentials genuinely exist in this locale.
        .filter((d) => d.title && Array.isArray(d.layout) && d.layout.length > 0)
        .map(mapArticle)
        .filter((a) => a.slug && a.title && a.body.length > 0);
    })();
    _localeArticles.set(locale, p);
  }
  return p;
}

/** Non-default locales in which this slug has a real translation. */
export async function getTranslatedLocales(slug: string, locales: readonly string[]): Promise<string[]> {
  const out: string[] = [];
  for (const l of locales) {
    if (l === 'en') continue;
    const arts = await getArticlesForLocale(l);
    if (arts.some((a) => a.slug === slug)) out.push(l);
  }
  return out;
}

const byNewest = (a: Article, b: Article) =>
  (b.updatedDate || b.publishDate).localeCompare(a.updatedDate || a.publishDate);

export async function getFeaturedArticle(): Promise<Article> {
  const all = await getArticles();
  return all.find((a) => a.featured) ?? [...all].sort(byNewest)[0];
}

export async function getLatestArticles(limit = 6, excludeSlug?: string): Promise<Article[]> {
  const all = await getArticles();
  return [...all].sort(byNewest).filter((a) => a.slug !== excludeSlug).slice(0, limit);
}

export async function getArticlesByCategory(categoryId: string): Promise<Article[]> {
  const all = await getArticles();
  return all.filter((a) => a.category === categoryId).sort(byNewest);
}

export async function countArticlesByCategory(categoryId: string): Promise<number> {
  const all = await getArticles();
  return all.filter((a) => a.category === categoryId).length;
}

export async function getRelatedArticles(slug: string, limit = 3): Promise<Article[]> {
  const all = await getArticles();
  const article = all.find((a) => a.slug === slug);
  if (!article) return [];
  const out: Article[] = [];
  const push = (a?: Article) => { if (a && a.slug !== slug && !out.includes(a)) out.push(a); };
  (article.relatedArticles ?? []).forEach((s) => push(all.find((a) => a.slug === s)));
  for (const a of all.filter((a) => a.category === article.category)) push(a);
  for (const a of [...all].sort(byNewest)) push(a);
  return out.slice(0, limit);
}

export async function getTags(): Promise<{ name: string; slug: string }[]> {
  const data = await cmsFetch<PayloadList<{ name: string; slug: string }>>(
    '/api/tags?limit=100&depth=0',
  );
  if (data && Array.isArray(data.docs)) {
    return data.docs.map((t) => ({ name: str(t.name), slug: str(t.slug || t.name) }));
  }
  return [];
}

export async function getTag(slug: string): Promise<{ name: string; slug: string } | null> {
  const all = await getTags();
  return all.find((t) => t.slug === slug) || null;
}

export async function getArticlesByTag(tagSlug: string): Promise<Article[]> {
  const all = await getArticles();
  return all.filter((a) => (a.tags || []).some((t) => t.slug === tagSlug)).sort(byNewest);
}

export async function getArticlesForTool(toolSlug: string, limit = 3): Promise<Article[]> {
  const all = await getArticles();
  return all.filter((a) => a.primaryTool === toolSlug || (a.relatedTools || []).includes(toolSlug))
    .sort(byNewest)
    .slice(0, limit);
}

export { ARTICLES_PER_PAGE, articlePlainText, articleFaq } from '../data/articles';

/* ────────────────────────────────────────────  Authors ── */

interface CmsAuthorLink {
  label?: string;
  url?: string;
}

interface CmsAuthor {
  id?: string;
  slug?: string;
  name?: string;
  role?: string;
  credential?: string;
  bio?: string;
  initials?: string;
  color?: string;
  schemaType?: string;
  links?: CmsAuthorLink[];
}

function mapAuthor(a: CmsAuthor): Author {
  return {
    slug: str(a.slug),
    name: str(a.name),
    role: str(a.role),
    credential: str(a.credential) || undefined,
    bio: str(a.bio),
    initials: str(a.initials),
    color: str(a.color) || '#16a34a',
    schemaType: (a.schemaType === 'Person' ? 'Person' : 'Organization') as 'Organization' | 'Person',
    links: (a.links || []).filter((l) => l.url).map((l) => ({
      network: ((l.label || '').toLowerCase().replace(/\s+/g, '-') || 'website') as 'x' | 'facebook' | 'whatsapp' | 'linkedin' | 'pinterest' | 'reddit' | 'website',
      href: str(l.url),
    })),
  };
}

export async function getAuthors(): Promise<Author[]> {
  const data = await cmsFetch<PayloadList<CmsAuthor>>(
    '/api/authors?limit=50&depth=0&sort=name',
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs.map(mapAuthor).filter((a) => a.slug && a.name);
  }
  return LOCAL_AUTHORS;
}

export async function getAuthor(slug: string): Promise<Author | undefined> {
  const all = await getAuthors();
  return all.find((a) => a.slug === slug);
}

export async function resolveAuthor(nameOrSlug: string): Promise<Author> {
  const all = await getAuthors();
  const bySlug = all.find((a) => a.slug === nameOrSlug);
  if (bySlug) return bySlug;
  const byName = all.find((a) => a.name === nameOrSlug);
  if (byName) return byName;
  // Fallback to local hard-coded authors if CMS fetch succeeded but didn't include this slug.
  const localBySlug = LOCAL_AUTHORS.find((a) => a.slug === nameOrSlug);
  if (localBySlug) return localBySlug;
  const localByName = LOCAL_AUTHORS.find((a) => a.name === nameOrSlug);
  if (localByName) return localByName;
  return all[0] || LOCAL_AUTHORS[0]!;
}

export { DEFAULT_AUTHOR_SLUG, REVIEWER_SLUG } from '../data/authors';

/* ────────────────────────────────────────────  Pages ── */

interface CmsPage {
  id?: string;
  title?: string;
  slug?: string;
  heroImage?: unknown;
  layout?: unknown[];
  publishDate?: string;
  _status?: string;
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  const data = await cmsFetch<PayloadList<CmsPage>>(
    `/api/pages?where[slug][equals]=${slug}&depth=2&draft=false`,
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs[0] as CmsPage;
  }
  return null;
}

export async function getCmsPages(): Promise<CmsPage[]> {
  const data = await cmsFetch<PayloadList<CmsPage>>(
    '/api/pages?limit=500&depth=1&sort=-publishDate&draft=false',
  );
  if (data && Array.isArray(data.docs)) {
    return data.docs as CmsPage[];
  }
  return [];
}

export async function getAllCmsSlugs(): Promise<string[]> {
  const [articles, pages] = await Promise.all([getArticles(), getCmsPages()]);
  return [
    ...articles.filter((a) => a.slug).map((a) => a.slug),
    ...pages.filter((p) => p.slug).map((p) => p.slug!),
  ];
}

export async function cmsIsReachable(): Promise<boolean> {
  const ping = await cmsFetch<unknown>('/api/categories?limit=1&depth=0');
  return ping !== null;
}

/* ────────────────────────────────────────────  Ad Management ── */

export interface AdSlot {
  placement: string;
  enabled: boolean;
  format: string;
  adsenseSlotId?: string;
  customCode?: string;
  affiliateBanner?: {
    image?: { url?: string };
    alt?: string;
    url?: string;
    width?: number;
    height?: number;
  };
}

export interface AdConfig {
  adsenseEnabled: boolean;
  adsenseClient?: string;
  lazyLoad: boolean;
  partytownEnabled: boolean;
  slots: AdSlot[];
  affiliates?: Array<{
    name: string;
    enabled: boolean;
    url: string;
    image?: { url?: string };
    alt?: string;
    width?: number;
    height?: number;
    targetSlots?: string[];
  }>;
}

export async function getAdConfig(): Promise<AdConfig | null> {
  if (DISABLED) return null;
  try {
    const res = await fetch(`${CMS_URL}/api/globals/ad-management?depth=1`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[CMS] AdManagement fetch failed — ${res.status} ${res.statusText}`, `URL: ${res.url}`);
      return null;
    }
    return (await res.json()) as AdConfig;
  } catch (err) {
    console.error('[CMS] AdManagement fetch threw an unexpected error:', err);
    return null;
  }
}

/* ────────────────────────────────────────────  Lead Generation ── */

export interface LeadOffer {
  id: string;
  name: string;
  enabled: boolean;
  headline: string;
  description?: string;
  offerType: 'pdf' | 'tips';
  pdf?: { url?: string; filename?: string };
  tipsText?: Record<string, unknown>;
  buttonLabel: string;
  collectName: boolean;
  tools?: string[] | Array<{ id: string; slug: string }>;
  placement: 'afterResult' | 'sidebar' | 'midContent';
}

export interface LeadGenConfig {
  enabled: boolean;
  successMessage: string;
  offers: LeadOffer[];
  n8nWebhookUrl?: string;
  n8nApiKey?: string;
}

export async function getLeadGenConfig(): Promise<LeadGenConfig | null> {
  return cmsFetch<LeadGenConfig>('/api/globals/lead-gen?depth=2');
}
