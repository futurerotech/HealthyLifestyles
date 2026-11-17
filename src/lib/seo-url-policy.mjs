/**
 * Canonical and sitemap URL policy for the existing Astro site.
 * Pure functions keep root/slash handling and sitemap priorities verifiable
 * without invoking a networked build or changing the configured routes.
 */

/** @param {string} pathname @param {string | URL} siteOrigin @returns {string} */
export function canonicalUrlForPath(pathname, siteOrigin) {
  const canonicalUrl = new URL(pathname, siteOrigin);
  return canonicalUrl.pathname === '/'
    ? new URL('/', siteOrigin).href
    : canonicalUrl.href.replace(/\/$/, '');
}

/**
 * @template {{ url: string }} T
 * @param {T} item
 * @param {string} siteUrl
 * @returns {T & { url: string; priority: number }}
 */
export function serializeSitemapEntry(item, siteUrl) {
  const cleanUrl = item.url.replace(/(.+?)\/$/, '$1');
  const isHome = cleanUrl === siteUrl;
  const url = isHome ? `${siteUrl}/` : cleanUrl;

  let priority = 0.7;
  if (isHome) {
    priority = 1.0;
  } else if (/\/wellness-hub\/[^/]+$/.test(cleanUrl) && !/\/wellness-hub$/.test(cleanUrl)) {
    priority = 0.8;
  } else if (/\/tools\/[^/]+$/.test(cleanUrl)) {
    priority = 0.8;
  } else if (/\/(author|wellness-hub|tools)$/.test(cleanUrl)) {
    priority = 0.9;
  } else if (/\/(about|privacy|contact|terms|accessibility|editorial-policy|methodology|medical-disclaimer|cookie-policy|health-score|ai-assistant)$/.test(cleanUrl)) {
    priority = 0.5;
  }

  return { ...item, url, priority };
}

/** The public article route is flat; category archives have separate routes. */
/** @param {string} slug @returns {string} */
export function sitemapArticlePath(slug) {
  return `/wellness-hub/${slug}`;
}

/**
 * Group public articles against ARTICLE sections, never tool categories.
 * Preserve articles whose section relation was removed or is not a section.
 * @template {{ category: string, slug: string }} A
 * @template {{ id: string, slug: string }} C
 * @param {A[]} articles
 * @param {C[]} articleCategories
 * @returns {{ groups: { category: C, articles: A[] }[], uncategorized: A[] }}
 */
export function groupSitemapArticles(articles, articleCategories) {
  const groups = articleCategories.map((category) => ({
    category,
    articles: articles.filter((article) => article.category === category.id),
  })).filter((group) => group.articles.length > 0);
  const sectionIds = new Set(articleCategories.map((category) => category.id));
  return {
    groups,
    uncategorized: articles.filter((article) => !sectionIds.has(article.category)),
  };
}
