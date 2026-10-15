/**
 * CMS data client (Astro build-time).
 *
 * Reads published content from the Payload CMS REST API and normalizes it into
 * the SAME shapes the site already uses (`Tool`, `Category`, `Article`), so
 * pages can move from `import { TOOLS }` to `await getTools()` with no
 * downstream changes.
 *
 * Production requires complete published CMS responses. Empty collections are
 * authoritative; failed reads never resurrect stale local content. Local data
 * is available only for explicit offline/development builds.
 *
 * Configure with CMS_URL (defaults to http://localhost:3000). Set CMS_DISABLE=1
 * to force local data (useful for CI / offline builds).
 */

import { TOOLS as LOCAL_TOOLS, getPopularTools as localPopularTools, getToolsByCategory as localToolsByCat, getRelatedTools as localRelatedTools, getLiveTools as localLiveTools, type Tool } from '../data/tools';
import { CATEGORIES as LOCAL_CATEGORIES, type Category } from '../data/categories';
import { ARTICLES as LOCAL_ARTICLES, ARTICLE_CATEGORIES as LOCAL_ARTICLE_CATEGORIES, ARTICLES_PER_PAGE, type Article, type ArticleCategory, type ArticleBlock } from '../data/articles';
import { AUTHORS as LOCAL_AUTHORS, resolveAuthor as localResolveAuthor, type Author } from '../data/authors';
import { P7_FIXTURE_ARTICLE } from '../data/p7-fixture';
import { canonicalToolSlug, SUPPORTED_TOOL_SLUGS, TOOL_ALIASES, publicContentPath, SITE_ORIGIN, assertUniquePublicPaths } from './site-routes';
import { resolveCanonical } from './seo';
import type { SeoMetadata } from './seo';
import { mapToolContent } from './cms-content';
import { appendContentPage, documentProof } from './content-integrity.mjs';

// P15-P7 — off by default; set P7_FIXTURE=1 ONLY for the render-proof build.
const P7_FIXTURE_ON = process.env.P7_FIXTURE === '1';
import { SITE as LOCAL_SITE, NAV_LINKS as LOCAL_NAV_LINKS, FOOTER_LEGAL as LOCAL_FOOTER_LEGAL, FOOTER_COMPANY as LOCAL_FOOTER_COMPANY, SOCIAL_FOLLOW as LOCAL_SOCIAL_FOLLOW, SOCIAL_NETWORKS as LOCAL_SOCIAL_NETWORKS, ANALYTICS as LOCAL_ANALYTICS, CONTACT as LOCAL_CONTACT } from '../consts';

const CMS_URL = (process.env.CMS_URL || (import.meta.env.CMS_URL as string) || 'http://localhost:3000').replace(/\/$/, '');
const DISABLED = (process.env.CMS_DISABLE ?? (import.meta.env.CMS_DISABLE as string)) === '1';
const TIMEOUT_MS = 15_000;
declare const __CMS_BUILD_STARTED_AT__: string;
const buildStartedAt = typeof __CMS_BUILD_STARTED_AT__ === 'string' ? __CMS_BUILD_STARTED_AT__ : new Date().toISOString();
const requests = new Map<string, Promise<unknown>>();
const requestFailures = new Map<string, string>();
const revisions = new Map<string, { collection: string; docId: string; updatedAt: string; path: string | null; noIndex: boolean; proof?: ReturnType<typeof documentProof> }>();
const coveredCollections = new Set<string>();
const fallbacksUsed = new Set<string>();
declare const __CMS_REDIRECT_SNAPSHOT__: { id: string | number; updatedAt: string }[] | null;

/** Payload REST list envelope. */
interface PayloadList<T> {
  docs: T[];
  totalDocs: number;
}

/** Fetch JSON from the CMS with a short timeout. Returns null on any failure. */
async function cmsFetch<T>(pathAndQuery: string): Promise<T | null> {
  if (DISABLED) return null;
  if (requests.has(pathAndQuery)) return requests.get(pathAndQuery) as Promise<T | null>;
  const request = (async () => { try {
    const res = await fetch(`${CMS_URL}${pathAndQuery}`, {
      headers: { Accept: 'application/json' },
      // Always pull fresh CMS data — never serve a cached ad/content config.
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) { requestFailures.set(pathAndQuery, `HTTP ${res.status}`); return null; }
    requestFailures.delete(pathAndQuery);
    return (await res.json()) as T;
  } catch (error) {
    requestFailures.set(pathAndQuery, error instanceof Error ? error.name : 'transport failure');
    return null;
  } })();
  requests.set(pathAndQuery, request);
  const result = await request;
  // Retry failed transports; successful reads, including empty lists, are immutable for this build.
  if (result === null) requests.delete(pathAndQuery);
  return result;
}

function recordRevision(collection: string, value: unknown): void {
  const doc = value as { id?: unknown; updatedAt?: string; seo?: SeoMetadata; slug?: string };
  const id = doc?.id ?? (collection.startsWith('global:') ? collection : undefined);
  if (id == null || !doc.updatedAt) return;
  const path = collection === 'tools' && TOOL_ALIASES[doc.slug || ''] ? null : publicContentPath(collection, doc);
  revisions.set(`${collection}:${id}`, {
    collection, docId: String(id), updatedAt: doc.updatedAt,
    ...(['articles', 'tools', 'pages', 'pseo-pages'].includes(collection) ? { proof: documentProof(collection, doc) } : {}),
    path, noIndex: doc.seo?.noIndex === true || !!(path && doc.seo?.canonical && resolveCanonical(doc.seo.canonical, path, SITE_ORIGIN) !== `${SITE_ORIGIN}${path}`),
  });
}

/** Never silently truncate a collection or return a half-fetched snapshot. */
async function cmsList<T>(path: string): Promise<PayloadList<T> | null> {
  const url = new URL(path, CMS_URL);
  const state = { docs: [] as T[], total: null as number | null, ids: new Set<string>() };
  for (let page = 1; ; page++) {
    url.searchParams.set('page', String(page));
    const data = await cmsFetch<PayloadList<T>>(`${url.pathname}${url.search}`);
    if (!data) return null;
    if (appendContentPage(state, data, url.pathname)) break;
  }
  const collection = url.pathname.split('/')[2];
  // Translated reads must never overwrite the authoritative English revision
  // receipt for the same Payload ID (fallback-locale=none may contain nulls).
  if (!url.searchParams.has('locale') || url.searchParams.get('locale') === 'en') {
    coveredCollections.add(collection);
    state.docs.forEach((doc) => recordRevision(collection, doc));
  }
  return { docs: state.docs, totalDocs: state.total! };
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

function normalizeMediaTree(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeMediaTree);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    key === 'url' && typeof item === 'string' && /^\/(?:api\/media|media)\//.test(item) ? absMediaUrl(item) : normalizeMediaTree(item),
  ]));
}

type CmsSeo = Omit<SeoMetadata, 'ogImage' | 'twitterImage'> & {
  ogImage?: { url?: string } | string | null;
  twitterImage?: { url?: string } | string | null;
};

function mapSeo(value?: CmsSeo): SeoMetadata {
  const image = (v: CmsSeo['ogImage']) => absMediaUrl(typeof v === 'string' ? v : v?.url) || undefined;
  return { ...value, ogImage: image(value?.ogImage), twitterImage: image(value?.twitterImage) };
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
  const data = await cmsFetch<CmsSettings>('/api/globals/settings?depth=0');
  if (data) { coveredCollections.add('global:settings'); recordRevision('global:settings', data); }
  return data;
}

/** Consolidated site constants from CMS (settings global) with local fallback. */
export async function getSiteConsts(): Promise<SiteConsts> {
  const s = await getCmsSettings();
  if (!s) {
    assertLocalFallbackAllowed('settings');
    return {
      SITE: LOCAL_SITE as unknown as SiteData,
      NAV_LINKS: [...LOCAL_NAV_LINKS] as NavLink[],
      FOOTER_LEGAL: [...LOCAL_FOOTER_LEGAL] as NavLink[],
      FOOTER_COMPANY: [...LOCAL_FOOTER_COMPANY] as NavLink[],
      SOCIAL_FOLLOW: [...LOCAL_SOCIAL_FOLLOW].map((s) => ({ network: s.network, href: s.href })),
      SOCIAL_NETWORKS: { ...LOCAL_SOCIAL_NETWORKS } as Record<string, { label: string; color: string }>,
      ANALYTICS: { ...LOCAL_ANALYTICS } as { ga4Id: string; searchConsoleVerification: string },

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

    CONTACT: {
      email: s.contactEmail || LOCAL_CONTACT.email,
    },
  };
}

/* ────────────────────────────────────────────  Tools ── */

interface CmsTool {
  whatItIs?: unknown;
  howCalculated?: unknown;
  howToRead?: unknown;
  faq?: { question?: string; answer?: string }[];
  sources?: { title?: string; url?: string }[];
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
  seo?: CmsSeo & { keywords?: string[] };
}

function mapTool(t: CmsTool): Tool {
  return {
    cmsId: t.id == null ? undefined : String(t.id),
    slug: canonicalToolSlug(str(t.slug)),
    seo: mapSeo(t.seo),
    cmsContent: mapToolContent(t),
    title: str(t.name),
    blurb: str(t.seo?.metaDescription),
    category: pickSlug(t.category),
    keywords: Array.isArray(t.seo?.keywords) ? t.seo!.keywords!.map(String) : [],
    icon: str(t.icon) || undefined,
    gradient: str(t.gradient) || undefined,
    popular: Boolean(t.featured),
    related: Array.isArray(t.related) ? t.related.map(pickSlug).map(canonicalToolSlug).filter(Boolean) : undefined,
    live: t.enabled !== false,
    riskLevel: t.riskLevel === 'high' || t.riskLevel === 'medium' ? t.riskLevel : 'low',
    semanticEntities: (t.semanticEntities || [])
      .map((e) => ({ term: str(e.term), url: str(e.url) || undefined }))
      .filter((e) => e.term),
  };
}

/**
 * Local datasets require an explicit offline development choice. A configured
 * CMS failure must fail on local builds too, independent of Vercel flags.
 */
function assertLocalFallbackAllowed(what: string): void {
  if (!DISABLED || process.env.VERCEL_ENV === 'production') {
    throw new Error(
      `[CMS] ${what}: CMS unreachable. Refusing stale LOCAL fallback content. ` +
        `Fix CMS connectivity; CMS_DISABLE=1 is only for explicit offline diagnostics and cannot pass release preflight.`,
    );
  }
  fallbacksUsed.add(what);
}

/**
 * All tools the public site should show. CMS-first, local fallback.
 * P16-A/G — ONE shared fetch per build (same pattern as _articlesPromise):
 * without the cache every prerendered page re-ran this query (~100+ duplicate
 * CMS requests per build, and nondeterministic per-page fallbacks on timeout).
 */
let _toolsPromise: Promise<Tool[]> | null = null;

export function getTools(): Promise<Tool[]> {
  if (!_toolsPromise) {
    _toolsPromise = (async () => {
      const data = await cmsList<CmsTool>(
        '/api/tools?where[enabled][equals]=true&where[_status][equals]=published&limit=100&depth=2&sort=sortOrder,id&draft=false',
      );
      if (data) {
        // Alias records are historical redirects, never alternate content sources.
        // Otherwise an enabled alias would resurrect its disabled canonical tool.
        for (const doc of data.docs) if (!doc.slug || !doc.name) throw new Error(`[CMS] Invalid published tool ${doc.id}; cannot omit it silently.`);
        const tools = data.docs.filter((t) => !TOOL_ALIASES[str(t.slug)]).map(mapTool);
        const unsupported = tools.filter((t) => !SUPPORTED_TOOL_SLUGS.has(t.slug));
        if (unsupported.length) throw new Error(`[CMS] Published tools have no frontend implementation: ${unsupported.map((t) => t.slug).join(', ')}. Implement them before publishing.`);
        return tools;
      }
      assertLocalFallbackAllowed('getTools');
      return LOCAL_TOOLS;
    })();
  }
  return _toolsPromise;
}

export async function getPopularTools(limit = 6): Promise<Tool[]> {
  return (await getTools()).filter((t) => t.live && t.popular).slice(0, limit);
}

export async function getToolsByCategory(catSlug: string): Promise<Tool[]> {
  const all = await getTools();
  const filtered = all.filter((t) => t.category === catSlug);
  return filtered;
}

export async function getRelatedTools(slug: string, limit = 4): Promise<Tool[]> {
  const all = await getTools();
  const tool = all.find((t) => t.slug === slug);
  if (!tool) return [];
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
  return all.find((t) => t.slug === canonicalToolSlug(slug));
}

/* ────────────────────────────────────────────  Categories (tool) ── */

interface CmsCategory {
  seo?: CmsSeo;
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
    seo: mapSeo(c.seo),
  };
}

export async function getCategories(): Promise<Category[]> {
  const data = await cmsList<CmsCategory>(
    '/api/categories?where[kind][equals]=tool&limit=100&depth=1&sort=order',
  );
  if (data) {
    return data.docs.map(mapCategory).filter((c) => c.id && c.name);
  }
  assertLocalFallbackAllowed('categories');
  return LOCAL_CATEGORIES;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug || c.id === slug);
}

/* ────────────────────────────────────────────  Article Categories ── */

interface CmsArticleCategory {
  seo?: CmsSeo;
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
    seo: mapSeo(c.seo),
  };
}

/** Article categories (content sections) — CMS-first, local fallback. */
export async function getArticleCategories(): Promise<ArticleCategory[]> {
  const data = await cmsList<CmsArticleCategory>('/api/categories?where[kind][equals]=section&limit=100&depth=1&sort=order');
  if (data) return data.docs.map(mapArticleCategory).filter((c) => c.id && c.name);
  assertLocalFallbackAllowed('article categories');
  return LOCAL_ARTICLE_CATEGORIES;
}

export async function getArticleCategory(idOrSlug: string): Promise<ArticleCategory | undefined> {
  const all = await getArticleCategories();
  return all.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

/* ────────────────────────────────────────────  Articles ── */

interface CmsArticleBlock {
  [key: string]: unknown;
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
  seo?: CmsSeo;
  semanticEntities?: { term?: string; url?: string }[];
  hasFAQ?: boolean;
  takeaways?: { text?: string }[];
  _status?: string;
}

function mapArticle(a: CmsArticle): Article {
  const catSlug = pickSlug(a.category);
  const authorObj = a.author as Record<string, unknown> | undefined;
  const reviewerObj = a.reviewer as Record<string, unknown> | undefined;
  const body = mapArticleBlocks(a.layout || []);
  const visibleFaq = new Set(body.flatMap((b) => b.type === 'paa' ? b.items.map((i) => `${i.q.trim()}\n${i.a.trim()}`) : []));
  const additionalFaq = (a.faq || []).filter((f) => f.question && f.answer && !visibleFaq.has(`${f.question.trim()}\n${f.answer.trim()}`)).map((f) => ({ q: f.question!, a: f.answer! }));
  if (additionalFaq.length) body.push({ type: 'paa', heading: 'Frequently asked questions', items: additionalFaq });

  return {
    cmsId: a.id == null ? undefined : String(a.id),
    slug: str(a.slug),
    title: str(a.title),
    seo: mapSeo(a.seo),
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
    primaryTool: canonicalToolSlug(pickSlug(a.primaryTool)),
    relatedTools: (a.relatedTools || []).map(pickSlug).map(canonicalToolSlug).filter(Boolean),
    relatedArticles: (a.relatedArticles || []).map(pickSlug).filter(Boolean),
    sources: (a.sources || []).map((s) => ({
      citation: str(s.label || s.url),
      url: str(s.url) || undefined,
    })),
    tags: (((a.tags as unknown) as (Record<string, unknown> | null)[] | undefined) || [])
      // Payload can return null entries for deleted tag relations — never
      // let a stale relation crash the build.
      .filter((t): t is Record<string, unknown> => !!t)
      .map((t) => ({
        name: str(t.name),
        slug: str(t.slug || t.id),
      })),
    semanticEntities: (a.semanticEntities || [])
      .map((e) => ({ term: str(e.term), url: str(e.url) || undefined }))
      .filter((e) => e.term),
    body,
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
          slug: canonicalToolSlug(pickSlug(b.tool || b.label || '')),
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
      case 'hero':
      case 'calculatorEmbed':
      case 'twoColumn':
      case 'viralHookBanner':
        return { type: 'cms', block: normalizeMediaTree(b) } as ArticleBlock;
      default:
        throw new Error(`Unsupported CMS article block: ${b.blockType}`);
    }
  }).filter((b: ArticleBlock) => !(b.type === 'p' && !(b as { text?: string }).text)) as ArticleBlock[];
}

export async function getArticle(slug: string): Promise<Article | null> {
  return (await getArticles()).find((a) => a.slug === slug) ?? null;
}

// One shared fetch for the whole build. Previously EVERY prerendered page
// re-ran this heavy depth-2 query; any single 4s timeout silently dropped that
// one page to the local fallback (no hero images, stale copy) — builds were
// nondeterministic per page. The promise is cached so all pages await the same
// result. Transport failures retry twice, then fail; local data requires an
// explicit offline diagnostic choice and cannot pass release preflight.
let _articlesPromise: Promise<Article[]> | null = null;

export function getArticles(): Promise<Article[]> {
  if (!_articlesPromise) {
    _articlesPromise = (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const data = await cmsList<CmsArticle>(
          '/api/articles?where[_status][equals]=published&limit=100&depth=2&sort=-publishDate&draft=false',
        );
        // Transport failure (cmsFetch returned null / no list) → retry.
        if (!data || !Array.isArray(data.docs)) continue;
        // CMS is REACHABLE — its answer is authoritative even when empty. Do NOT
        // paper a reachable-but-empty CMS (e.g. a data-loss incident) over with
        // stale LOCAL content: that would hide the outage from every build gate.
        for (const doc of data.docs) if (!doc.slug || !doc.title) throw new Error(`[CMS] Invalid published article ${doc.id}; cannot omit it silently.`);
        const mapped = data.docs.map(mapArticle);
        if (mapped.length === 0) {
          console.error(`[CMS] articles endpoint reachable but yielded 0 usable articles (docs=${data.docs.length}) — surfacing the empty result, NOT masking with LOCAL fallback.`);
        }
        return P7_FIXTURE_ON ? [P7_FIXTURE_ARTICLE, ...mapped] : mapped;
      }
      // Only reached on repeated TRANSPORT failure → CMS unreachable. LOCAL
      // fallback keeps dev/CI builds working; production deploys fail loudly
      // instead (P16-J — never silently ship stale content in production).
      assertLocalFallbackAllowed('getArticles (3 attempts)');
      return P7_FIXTURE_ON ? [P7_FIXTURE_ARTICLE, ...LOCAL_ARTICLES] : LOCAL_ARTICLES;
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
// failure a configured CMS build stops rather than silently losing translations.
const _localeArticles = new Map<string, Promise<Article[]>>();

export function getArticlesForLocale(locale: string): Promise<Article[]> {
  if (locale === 'en') return getArticles();
  let p = _localeArticles.get(locale);
  if (!p) {
    p = (async () => {
      const data = await cmsList<CmsArticle>(
        `/api/articles?where[_status][equals]=published&limit=100&depth=2&sort=-publishDate&draft=false&locale=${locale}&fallback-locale=none`,
      );
      if (!data) { if (!DISABLED) assertLocalFallbackAllowed(`articles locale ${locale}`); return []; }
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

export async function getFeaturedArticle(): Promise<Article | undefined> {
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
  const data = await cmsList<{ name: string; slug: string }>(
    '/api/tags?limit=100&depth=0',
  );
  if (data && Array.isArray(data.docs)) {
    return data.docs.map((t) => ({ name: str(t.name), slug: str(t.slug || t.name) }));
  }
  assertLocalFallbackAllowed('tags');
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
  const data = await cmsList<CmsAuthor>(
    '/api/authors?limit=50&depth=0&sort=name',
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs.map(mapAuthor).filter((a) => a.slug && a.name && !(a.slug === 'medical-review' && a.schemaType === 'Organization'));
  }
  if (!data) assertLocalFallbackAllowed('authors');
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

export { DEFAULT_AUTHOR_SLUG } from '../data/authors';

/* ────────────────────────────────────────────  Pages ── */

interface CmsPage {
  seo?: SeoMetadata;
  id?: string;
  title?: string;
  slug?: string;
  heroImage?: unknown;
  layout?: unknown[];
  publishDate?: string;
  _status?: string;
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  return (await getCmsPages()).find((p) => p.slug === slug) ?? null;
}

let pagesPromise: Promise<CmsPage[]> | undefined;
export function getCmsPages(): Promise<CmsPage[]> {
  return pagesPromise ??= (async () => {
    const data = await cmsList<Omit<CmsPage, 'seo'> & { seo?: CmsSeo }>('/api/pages?where[_status][equals]=published&limit=100&depth=2&sort=-publishDate&draft=false');
    if (data) return data.docs.map((p) => ({ ...p, heroImage: normalizeMediaTree(p.heroImage), layout: normalizeMediaTree(p.layout) as unknown[], seo: mapSeo(p.seo) }));
    assertLocalFallbackAllowed('pages');
    return [];
  })();
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
  const data = await cmsFetch<AdConfig>('/api/globals/ad-management?depth=1');
  if (!data) throw new Error('[CMS] Critical: AdManagement fetch failed. Aborting build to prevent ad-free deployment.');
  coveredCollections.add('global:ad-management');
  recordRevision('global:ad-management', data);
  return normalizeMediaTree(data) as AdConfig;
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
}

export async function getLeadGenConfig(): Promise<LeadGenConfig | null> {
  const data = await cmsFetch<LeadGenConfig>('/api/globals/lead-gen?depth=2');
  if (data) { coveredCollections.add('global:lead-gen'); recordRevision('global:lead-gen', data); }
  else assertLocalFallbackAllowed('lead-gen');
  return normalizeMediaTree(data) as LeadGenConfig | null;
}

export interface PseoPage {
  id: string | number;
  status: 'published';
  slug: string;
  headline: string;
  subheadline?: string;
  bodyHtml?: string;
  ctaUrl?: string;
  ctaText?: string;
  seo?: SeoMetadata;
}

let pseoPromise: Promise<PseoPage[]> | undefined;
export function getPseoPages(): Promise<PseoPage[]> {
  return pseoPromise ??= (async () => {
    const query = new URLSearchParams({ 'where[status][equals]': 'published', limit: '100', depth: '1', sort: 'id' });
    // Fetch rendered fields only. Drafts and generation inputs are unnecessary;
    // CMS access control remains authoritative even if a caller changes select.
    for (const name of ['id', 'slug', 'status', 'headline', 'subheadline', 'bodyHtml', 'ctaUrl', 'ctaText', 'seo', 'updatedAt']) query.set(`select[${name}]`, 'true');
    const path = `/api/pseo-pages?${query}`;
    const data = await cmsList<Omit<PseoPage, 'seo'> & { seo?: CmsSeo }>(path);
    if (!data) {
      if (DISABLED) { assertLocalFallbackAllowed('pseo-pages'); return []; }
      const reason = [...requestFailures].find(([key]) => key.startsWith('/api/pseo-pages?'))?.[1] || 'incomplete response';
      throw new Error(`[CMS] GET /api/pseo-pages failed: ${reason}. Public reads must allow status=published only; drafts and generation inputs must remain private. No local fallback was used. Production access changes require an approved CMS deployment.`);
    }
    for (const doc of data.docs) if (doc.status !== 'published' || !/^[a-z0-9-]+$/.test(doc.slug || '') || !doc.headline?.trim() || !doc.bodyHtml?.trim()) throw new Error(`[CMS] Invalid published pSEO page ID ${doc.id}; cannot silently omit it.`);
    return data.docs.map((p) => ({ id: p.id, status: p.status, slug: p.slug, headline: p.headline, subheadline: p.subheadline, bodyHtml: p.bodyHtml, ctaUrl: p.ctaUrl, ctaText: p.ctaText, seo: mapSeo(p.seo) }));
  })();
}

/** Public metadata only: lets CMS acknowledge the exact revisions actually built. */
export async function getContentManifest() {
  const [tools, articles, categories, sections, authors, tags, pages, pseo] = await Promise.all([getTools(), getArticles(), getCategories(), getArticleCategories(), getAuthors(), getTags(), getCmsPages(), getPseoPages()]);
  await Promise.all([getSiteConsts(), getAdConfig(), getLeadGenConfig()]);
  assertUniquePublicPaths([
    ...tools.map((t) => ({ collection: 'tools', slug: t.slug })),
    ...articles.map((a) => ({ collection: 'articles', slug: a.slug })),
    ...categories.map((c) => ({ collection: 'categories', kind: 'tool', slug: c.slug })),
    ...sections.filter((c) => articles.some((a) => a.category === c.id)).map((c) => ({ collection: 'categories', kind: 'section', slug: c.slug })),
    ...pages.filter((p) => p.slug && !['home', 'index'].includes(p.slug)).map((p) => ({ collection: 'pages', slug: p.slug! })),
    ...pseo.map((p) => ({ collection: 'pseo-pages', slug: p.slug })),
  ]);
  const rendered = new Set([
    ...tools.map((t) => `/tools/${t.slug}`), ...articles.map((a) => `/wellness-hub/${a.slug}`),
    ...categories.map((c) => `/${c.slug}`),
    ...sections.filter((c) => articles.some((a) => a.category === c.id)).map((c) => `/wellness-hub/${c.slug}`),
    ...authors.map((a) => `/author/${a.slug}`),
    ...tags.filter((t) => articles.some((a) => a.tags?.some((tag) => tag.slug === t.slug))).map((t) => `/wellness-hub/tag/${t.slug}`),
    ...pages.filter((p) => p.slug && !['home', 'index'].includes(p.slug)).map((p) => `/${p.slug}`),
    ...pseo.map((p) => `/tools/pseo/${p.slug}`),
  ]);
  if (__CMS_REDIRECT_SNAPSHOT__) {
    coveredCollections.add('redirects');
    __CMS_REDIRECT_SNAPSHOT__.forEach((doc) => recordRevision('redirects', doc));
  }
  return {
    version: 1, source: DISABLED || fallbacksUsed.size ? 'local' : process.env.CONTENT_BUILD_KIND === 'diagnostic' ? 'diagnostic' : 'cms', cmsOrigin: new URL(CMS_URL).origin, buildStartedAt,
    buildKind: ['fixture', 'diagnostic'].includes(process.env.CONTENT_BUILD_KIND || '') ? process.env.CONTENT_BUILD_KIND : DISABLED ? 'offline' : 'cms',
    collections: [...coveredCollections].sort(), records: [...revisions.values()].map((r) => ({ ...r, path: r.path && rendered.has(r.path) ? r.path : null })),
  };
}
