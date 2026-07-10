/**
 * The CANONICAL feed (SD4 — parallel feeds are forbidden).
 *
 * P15-P4c: Discover-grade — absolute URLs, media:content large images, and
 * D5 date integrity (missing publishDate → pubDate omitted, never now()).
 * Items come from buildFeedItems (src/lib/feed-items.ts), which is unit-tested
 * and consumes the same CMS-first/LOCAL-fallback data path as the sitemap.
 */
import rss from '@astrojs/rss';
import { getArticles } from '../lib/cms';
import { buildFeedItems } from '../lib/feed-items';

export async function GET(context: { site: URL }) {
  const articles = await getArticles();
  const origin = context.site.href.replace(/\/$/, '');
  return rss({
    title: 'HealthyLifeStyles Wellness Hub',
    description:
      'Evidence-based health guides, wellness calculators, and lifestyle tools from the HealthyLifeStyles team.',
    site: context.site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items: buildFeedItems(articles ?? [], origin),
  });
}
