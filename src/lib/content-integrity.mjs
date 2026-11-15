import { createHash } from 'node:crypto';

/** Strict pagination: no silent totals, duplicate documents, or changing counts. */
export function appendContentPage(state, response, label) {
  if (!response || !Array.isArray(response.docs) || !Number.isSafeInteger(response.totalDocs) || response.totalDocs < 0) throw new Error(`${label}: invalid/incomplete CMS list envelope`);
  if (state.total !== null && state.total !== response.totalDocs) throw new Error(`${label}: CMS total changed during pagination; retry a stable build`);
  state.total = response.totalDocs;
  for (const doc of response.docs) {
    if (doc?.id == null || !String(doc.id).trim()) throw new Error(`${label}: document without ID`);
    const id = String(doc.id);
    if (state.ids.has(id)) throw new Error(`${label}: duplicate ID ${id} across CMS pages`);
    state.ids.add(id); state.docs.push(doc);
  }
  if (state.docs.length > state.total) throw new Error(`${label}: response exceeds advertised total`);
  if (!response.docs.length && state.docs.length < state.total) throw new Error(`${label}: truncated CMS pagination`);
  return state.docs.length === state.total;
}

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])]));
}
export function contentDigest(value) {
  return createHash('sha256').update(JSON.stringify(ordered(value))).digest('hex');
}
const relation = (value) => value && typeof value === 'object' ? { id: value.id, slug: value.slug } : value ?? null;
const media = (value) => value && typeof value === 'object' ? { id: value.id, url: value.url, alt: value.alt, width: value.width, height: value.height } : value ?? null;

/** Public editorial fields only. Never hash or expose private global settings. */
export function documentContent(collection, doc) {
  const seo = { ...(doc.seo || {}), ogImage: media(doc.seo?.ogImage), twitterImage: media(doc.seo?.twitterImage) };
  const common = { id: String(doc.id), slug: doc.slug, title: doc.title || doc.name || doc.headline, updatedAt: doc.updatedAt, seo, category: relation(doc.category) };
  const content = collection === 'pseo-pages' ? {
    ...common, status: doc.status, headline: doc.headline, subheadline: doc.subheadline, bodyHtml: doc.bodyHtml, ctaText: doc.ctaText, ctaUrl: doc.ctaUrl,
  } : collection === 'pages' ? {
    ...common, layout: doc.layout, heroImage: media(doc.heroImage), publishDate: doc.publishDate,
  } : collection === 'articles' ? {
    ...common, excerpt: doc.excerpt, publishDate: doc.publishDate, updatedDate: doc.updatedDate,
    heroImage: media(doc.heroImage), layout: doc.layout, faq: doc.faq, takeaways: doc.takeaways, sources: doc.sources,
    author: relation(doc.author), reviewer: relation(doc.reviewer), tags: (doc.tags || []).map(relation),
    primaryTool: relation(doc.primaryTool), relatedTools: (doc.relatedTools || []).map(relation), relatedArticles: (doc.relatedArticles || []).map(relation),
    semanticEntities: doc.semanticEntities, hasFAQ: doc.hasFAQ, isHowTo: doc.isHowTo, isHealthTopic: doc.isHealthTopic,
  } : {
    ...common, enabled: doc.enabled, whatItIs: doc.whatItIs, howCalculated: doc.howCalculated, howToRead: doc.howToRead,
    faq: doc.faq, sources: doc.sources, related: (doc.related || []).map(relation), semanticEntities: doc.semanticEntities,
  };
  return content;
}

export function documentProof(collection, doc) {
  return { id: String(doc.id), slug: doc.slug, title: doc.title || doc.name || doc.headline, digest: contentDigest(documentContent(collection, doc)) };
}

/** A media document or media summary (not an editorial link): its URL depends on the serving bucket. */
const isMediaObject = (o) => typeof o.url === 'string' && ('mimeType' in o || 'filename' in o || ('alt' in o && 'id' in o && ('width' in o || 'height' in o)));
/** Media are identified by ID and file name, not by the host that serves them (production or staging bucket). */
function hostIndependentMedia(value) {
  if (Array.isArray(value)) return value.map(hostIndependentMedia);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = hostIndependentMedia(v);
  if (isMediaObject(value)) { let name = value.url; try { name = new URL(value.url, 'https://x.invalid').pathname.split('/').pop(); } catch {} out.url = name; }
  return out;
}

/**
 * Editorial fingerprint for the release content lock: identical content gives an identical
 * digest across publishes (no updatedAt) and across an ID-preserving staging mirror (media by
 * ID and file name). Editorial link URLs stay exact. documentProof is unchanged.
 */
export function editorialDigest(collection, doc) {
  const { updatedAt: _ignored, ...content } = documentContent(collection, doc);
  return contentDigest(hostIndependentMedia(content));
}
