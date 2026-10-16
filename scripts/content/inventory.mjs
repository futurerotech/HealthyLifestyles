import { appendContentPage } from '../../src/lib/content-integrity.mjs';

export async function readPublishedCollection(origin, collection, { fetchImpl = fetch, limit = 10, onPage = () => {} } = {}) {
  const state = { docs: [], ids: new Set(), total: null };
  const slugs = new Set();
  for (let page = 1; ; page++) {
    const url = new URL(`/api/${collection}`, origin);
    const pseo = collection === 'pseo-pages';
    for (const [key, value] of Object.entries({ [`where[${pseo ? 'status' : '_status'}][equals]`]: 'published', draft: 'false', depth: pseo ? '1' : '2', limit: String(limit), page: String(page), sort: 'id' })) url.searchParams.set(key, value);
    if (pseo) for (const name of ['id', 'slug', 'status', 'headline', 'subheadline', 'bodyHtml', 'ctaUrl', 'ctaText', 'seo', 'updatedAt']) url.searchParams.set(`select[${name}]`, 'true');
    const response = await fetchImpl(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${collection}: public CMS HTTP ${response.status}`);
    const data = await response.json();
    const complete = appendContentPage(state, data, collection);
    onPage({ collection, page, count: data.docs.length, totalDocs: data.totalDocs, status: response.status, cacheControl: response.headers.get('cache-control'), age: response.headers.get('age') });
    for (const doc of data.docs) {
      if (doc[pseo ? 'status' : '_status'] !== 'published' || !doc.slug || !(doc.title || doc.name || doc.headline)) throw new Error(`${collection}: invalid published document ${doc.id}`);
      if (slugs.has(doc.slug)) throw new Error(`${collection}: duplicate slug ${doc.slug}`);
      slugs.add(doc.slug);
    }
    if (complete) return state.docs;
  }
}

export async function readPublishedInventory(origin, options = {}) {
  const cms = new URL(origin);
  if (!['http:', 'https:'].includes(cms.protocol) || cms.username || cms.password || cms.search || cms.hash || cms.pathname !== '/') throw new Error('CMS origin must be a plain HTTP(S) origin without credentials.');
  const requests = [];
  const collections = {};
  for (const collection of ['articles', 'tools', 'pages', 'pseo-pages']) collections[collection] = await readPublishedCollection(cms.origin, collection, { ...options, onPage: (entry) => requests.push(entry) });
  return { capturedAt: new Date().toISOString(), cmsOrigin: cms.origin, collections, requests };
}
