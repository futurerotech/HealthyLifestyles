/**
 * P15-P4c — Discover-grade feed items for the canonical feed (src/pages/rss.xml.ts).
 *
 * Single source of truth (SD4): consumes the SAME articles data path as the
 * sitemap and llms.txt (src/lib/cms.ts — CMS-first, LOCAL_ARTICLES fallback).
 *
 * YMYL date integrity (D5 / SD3), build-enforced by unit tests + the
 * date-integrity CI guard: an article with no valid publishDate emits NO
 * <pubDate> at all — NEVER a fabricated build-time date.
 */
import type { RSSFeedItem } from '@astrojs/rss';

export interface FeedArticle {
  title?: string;
  metaDescription?: string;
  slug?: string;
  publishDate?: string;
  tags?: { name: string }[];
  heroImage?: { url: string; alt?: string; width?: number; height?: number };
}

/** Google Discover wants large images (≥1200px wide). */
export const DISCOVER_MIN_WIDTH = 1200;

const escapeXmlAttr = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/**
 * Absolute large-image URL for an article: the CMS hero when it is verifiably
 * ≥1200px wide, otherwise the article's OG endpoint (1200×630 by construction).
 */
export function feedImageUrl(a: FeedArticle, origin: string): { url: string; width?: number; height?: number } {
  const hero = a.heroImage;
  if (hero?.url && (hero.width ?? 0) >= DISCOVER_MIN_WIDTH) {
    const url = /^https?:\/\//.test(hero.url) ? hero.url : `${origin}${hero.url.startsWith('/') ? '' : '/'}${hero.url}`;
    // Only claim dimensions we actually know (SD3 — no invented metadata).
    return hero.height ? { url, width: hero.width, height: hero.height } : { url, width: hero.width };
  }
  return { url: `${origin}/og/articles/${a.slug}.png`, width: 1200, height: 630 };
}

/** Map articles → RSS items with absolute URLs, real dates only, media:content tags. */
export function buildFeedItems(articles: FeedArticle[], origin: string): RSSFeedItem[] {
  return (articles ?? [])
    .filter((a) => typeof a.slug === 'string' && a.slug.length > 0)
    .map((a) => {
      const img = feedImageUrl(a, origin);
      const dims = `${img.width ? ` width="${img.width}"` : ''}${img.height ? ` height="${img.height}"` : ''}`;
      const item: RSSFeedItem = {
        title: a.title ?? '',
        description: a.metaDescription ?? '',
        link: `${origin}/wellness-hub/${a.slug}`,
        categories: (a.tags ?? []).map((t) => t.name),
        customData: `<media:content url="${escapeXmlAttr(img.url)}" medium="image"${dims} />`,
      };
      // D5: pubDate ONLY when the CMS field exists and parses — omit otherwise.
      const t = a.publishDate ? Date.parse(a.publishDate) : NaN;
      if (Number.isFinite(t)) item.pubDate = new Date(t);
      return item;
    });
}
