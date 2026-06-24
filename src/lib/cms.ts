/**
 * CMS data client (Astro build-time).
 *
 * Reads published content from the Payload CMS REST API and normalizes it into
 * the SAME shapes the site already uses (`Tool`, `Category`), so pages can move
 * from `import { TOOLS }` to `await getTools()` with no downstream changes.
 *
 * If the CMS is unreachable, misconfigured, or returns nothing, every getter
 * falls back to the local `src/data/*` files. This keeps the site building even
 * with no CMS running — the CMS is an enhancement, not a hard dependency.
 *
 * Configure with CMS_URL (defaults to http://localhost:3000). Set CMS_DISABLE=1
 * to force local data (useful for CI / offline builds).
 */

import { TOOLS as LOCAL_TOOLS, type Tool } from '../data/tools';
import { CATEGORIES as LOCAL_CATEGORIES, type Category } from '../data/categories';

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
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Network error, timeout, bad JSON, CMS down — fall back to local data.
    return null;
  }
}

/** Resolve a relationship that may be an id string or a populated object. */
function relSlug(rel: unknown): string {
  if (rel && typeof rel === 'object') {
    const o = rel as Record<string, unknown>;
    if (typeof o.slug === 'string') return o.slug;
    if (typeof o.id === 'string') return o.id;
  }
  return typeof rel === 'string' ? rel : '';
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

// ---------- Tools ----------

interface CmsTool {
  slug?: string;
  name?: string;
  category?: unknown;
  enabled?: boolean;
  featured?: boolean;
  sortOrder?: number;
  related?: unknown[];
  seo?: { metaDescription?: string; keywords?: string[] };
}

function mapTool(t: CmsTool): Tool {
  return {
    slug: str(t.slug),
    title: str(t.name),
    blurb: str(t.seo?.metaDescription),
    category: relSlug(t.category),
    keywords: Array.isArray(t.seo?.keywords) ? t.seo!.keywords!.map(String) : [],
    popular: Boolean(t.featured),
    related: Array.isArray(t.related) ? t.related.map(relSlug).filter(Boolean) : undefined,
    live: t.enabled !== false,
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

// ---------- Categories ----------

interface CmsCategory {
  slug?: string;
  name?: string;
  description?: string;
  icon?: string;
  accentColor?: string;
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
    // Local data uses a CSS var for `accent`; CMS stores only a hex, so reuse it.
    accent: color,
    color,
  };
}

/** Tool categories. CMS-first, local fallback. */
export async function getCategories(): Promise<Category[]> {
  const data = await cmsFetch<PayloadList<CmsCategory>>(
    '/api/categories?where[kind][equals]=tool&limit=50&depth=0&sort=order',
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs.map(mapCategory).filter((c) => c.id && c.name);
  }
  return LOCAL_CATEGORIES;
}

// ---------- Articles ----------

interface CmsArticle {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  layout?: unknown[];
  category?: unknown;
  author?: unknown;
  publishDate?: string;
  _status?: string;
}

export async function getCmsArticle(slug: string): Promise<CmsArticle | null> {
  const data = await cmsFetch<PayloadList<CmsArticle>>(
    `/api/articles?where[slug][equals]=${slug}&depth=2&draft=false`,
  );
  if (data && Array.isArray(data.docs) && data.docs.length > 0) {
    return data.docs[0] as CmsArticle;
  }
  return null;
}

export async function getCmsArticles(): Promise<CmsArticle[]> {
  const data = await cmsFetch<PayloadList<CmsArticle>>(
    '/api/articles?limit=100&depth=1&sort=-publishDate&draft=false',
  );
  if (data && Array.isArray(data.docs)) {
    return data.docs as CmsArticle[];
  }
  return [];
}

// ---------- Pages ----------

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
    '/api/pages?limit=100&depth=1&sort=-publishDate&draft=false',
  );
  if (data && Array.isArray(data.docs)) {
    return data.docs as CmsPage[];
  }
  return [];
}

export async function getAllCmsSlugs(): Promise<string[]> {
  const [articles, pages] = await Promise.all([getCmsArticles(), getCmsPages()]);
  return [
    ...articles.filter((a) => a.slug).map((a) => a.slug!),
    ...pages.filter((p) => p.slug).map((p) => p.slug!),
  ];
}

/** True when the CMS answered at least once this build (diagnostics). */
export async function cmsIsReachable(): Promise<boolean> {
  const ping = await cmsFetch<unknown>('/api/categories?limit=1&depth=0');
  return ping !== null;
}

// ---------- Ad Management ----------

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
  const data = await cmsFetch<AdConfig>('/api/globals/ad-management?depth=1');
  return data;
}

// ---------- Lead Generation ----------

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
  const data = await cmsFetch<LeadGenConfig>('/api/globals/lead-gen?depth=2');
  return data;
}
