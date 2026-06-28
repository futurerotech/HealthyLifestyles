import rss from '@astrojs/rss';
import { getArticles } from '../lib/cms';

export async function GET(context: { site: URL }) {
  const articles = await getArticles();
  return rss({
    title: 'HealthyLifeStyles Wellness Hub',
    description: 'Evidence-based health guides, wellness calculators, and lifestyle tools from the HealthyLifeStyles team.',
    site: context.site,
    items: (articles ?? []).map((a) => ({
      title: a.title ?? '',
      description: a.metaDescription ?? '',
      link: `/wellness-hub/${a.slug ?? ''}`,
      pubDate: a.publishDate ? new Date(a.publishDate) : new Date(),
      categories: (a.tags ?? []).map((t) => t.name),
    })),
  });
}
