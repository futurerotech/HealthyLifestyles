import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { documentProof } from '../../src/lib/content-integrity.mjs';
import { readPublishedInventory } from './inventory.mjs';

const contract = JSON.parse(await readFile(new URL('../../src/lib/site-contract.json', import.meta.url), 'utf8'));
export const SITE_ORIGIN = contract.origin;
export const articleUrl = (doc) => `${SITE_ORIGIN}/wellness-hub/${doc.slug}`;
export const toolSlug = (doc) => contract.toolAliases[doc.slug] || doc.slug;
export const publicPath = (collection, doc) => collection === 'articles' ? `/wellness-hub/${doc.slug}` : collection === 'pseo-pages' ? `/tools/pseo/${doc.slug}` : collection === 'pages' ? `/${doc.slug}` : `/tools/${toolSlug(doc)}`;

export function decode(value = '') {
  return String(value).replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10))).replace(/&(quot|apos|amp|lt|gt|nbsp);/g, (_, name) => ({ quot: '"', apos: "'", amp: '&', lt: '<', gt: '>', nbsp: ' ' })[name]);
}
export function plain(value = '') {
  return decode(String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<\/(?:p|div|section|article|h[1-6]|li|tr|td|th|summary|header|footer|nav|aside|span)[^>]*>|<br\b[^>]*>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')).replace(/\s+/g, ' ').trim();
}
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((m) => [m[1].toLowerCase(), decode(m[3])]));
}
export function inspectHtml(html) {
  const meta = Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => { const a = attrs(tag); return [a.name || a.property, a.content]; }));
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => attrs(tag)).find((a) => a.rel === 'canonical')?.href;
  const ld = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => { try { const value = JSON.parse(m[1]); return Array.isArray(value) ? value : value['@graph'] || [value]; } catch { return []; } });
  return { title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''), h1: plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ''), canonical, meta, ld,
    cmsId: attrs(html.match(/<article\b[^>]*data-cms-id[^>]*>/i)?.[0] || '')['data-cms-id'],
    images: [...html.matchAll(/<img\b[^>]*>/gi)].map(([tag]) => attrs(tag)),
    links: [...html.matchAll(/<a\b[^>]*>/gi)].map(([tag]) => attrs(tag).href).filter(Boolean), text: plain(html),
  };
}
const absoluteMedia = (value, cmsOrigin) => typeof value === 'string' ? new URL(value, cmsOrigin).href : value?.url ? new URL(value.url, cmsOrigin).href : undefined;
export function expectedMetadata(collection, doc, cmsOrigin) {
  const path = publicPath(collection, doc);
  const seo = doc.seo || {};
  const title = seo.metaTitle || doc.title || doc.name || doc.headline;
  const description = seo.metaDescription || (collection === 'pseo-pages' ? doc.subheadline || doc.headline : collection === 'pages' ? doc.title : doc.excerpt) || '';
  const canonical = new URL(seo.canonical || path, SITE_ORIGIN).href.replace(/\/$/, '');
  const ogImage = absoluteMedia(seo.ogImage, cmsOrigin) || (['pages', 'pseo-pages'].includes(collection) ? `${SITE_ORIGIN}/og-default.png` : `${SITE_ORIGIN}/og/${collection}/${doc.slug}.png`);
  return { title, canonical, description, ogTitle: seo.ogTitle || title, ogDescription: seo.ogDescription || description, twitterTitle: seo.twitterTitle || seo.ogTitle || title, twitterDescription: seo.twitterDescription || seo.ogDescription || description, ogImage, twitterImage: absoluteMedia(seo.twitterImage, cmsOrigin) || ogImage };
}
function blockTexts(block) {
  const out = [];
  for (const key of ['text', 'title', 'heading', 'caption', 'hook', 'subtext', 'subtitle']) if (typeof block[key] === 'string') out.push(block[key]);
  for (const item of block.items || []) {
    if (typeof item === 'string') out.push(item);
    else for (const key of ['text', 'question', 'answer']) if (item?.[key]) out.push(item[key]);
  }
  for (const cell of [...(block.headers || []), ...(block.rows || []).flatMap((row) => Array.isArray(row) ? row : row.cells || [])]) if (typeof cell === 'string') out.push(cell);
  return out;
}
function lexicalTexts(value) {
  const out = [];
  function visit(node) { if (!node || typeof node !== 'object') return; if (typeof node.text === 'string') out.push(node.text); for (const child of node.children || []) visit(child); }
  for (const node of value?.root?.children || []) visit(node);
  return out;
}
function editorialLinks(collection, doc) {
  const links = [], strings = collection === 'articles'
    ? [...(doc.layout || []).flatMap(blockTexts), ...(doc.faq || []).flatMap((f) => [f.question, f.answer])]
    : [...(doc.faq || []).flatMap((f) => [f.question, f.answer])];
  for (const text of strings.filter(Boolean)) for (const match of text.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) links.push(match[1]);
  for (const source of doc.sources || []) if (source.url) links.push(source.url);
  function visit(value) { if (!value || typeof value !== 'object') return; if (value.type === 'link' && value.fields?.url) links.push(value.fields.url); for (const child of value.children || []) visit(child); }
  if (collection === 'tools') for (const key of ['whatItIs', 'howCalculated', 'howToRead']) visit(doc[key]?.root);
  if (collection === 'pseo-pages') links.push(...inspectHtml(doc.bodyHtml || '').links, ...(doc.ctaUrl ? [doc.ctaUrl] : []));
  return links;
}
export function inspectDocument(collection, doc, html, cmsOrigin) {
  const view = inspectHtml(html);
  const errors = [];
  const expect = (condition, message) => { if (!condition) errors.push(message); };
  const meta = expectedMetadata(collection, doc, cmsOrigin);
  expect(view.cmsId === String(doc.id), 'rendered CMS ID mismatch');
  expect(view.h1 === plain(collection === 'pages' ? doc.layout?.find((b) => b.blockType === 'hero')?.title || doc.title : doc.title || doc.name || doc.headline), 'visible title mismatch');
  expect(view.title === meta.title, 'SEO title mismatch');
  expect(view.canonical === meta.canonical, 'canonical mismatch');
  for (const [key, expected] of Object.entries({ description: meta.description, 'og:title': meta.ogTitle, 'og:description': meta.ogDescription, 'twitter:title': meta.twitterTitle, 'twitter:description': meta.twitterDescription, 'og:image': meta.ogImage, 'twitter:image': meta.twitterImage })) expect(view.meta[key] === expected, `${key} mismatch`);
  expect(/noindex/i.test(view.meta.robots || '') === (doc.seo?.noIndex === true), 'robots/noIndex mismatch');
  let texts = [];
  if (collection === 'articles') {
    const article = view.ld.find((n) => [n['@type']].flat().includes('Article'));
    expect(article?.datePublished === String(doc.publishDate || '').split('T')[0], 'publication date mismatch');
    expect(article?.dateModified === String(doc.updatedDate || doc.publishDate || '').split('T')[0], 'updated date mismatch');
    if (doc.heroImage?.url) expect(view.images.some((img) => img.src === absoluteMedia(doc.heroImage, cmsOrigin) && img.alt === (doc.heroImage.alt || '') && (!doc.heroImage.width || img.width === String(doc.heroImage.width)) && (!doc.heroImage.height || img.height === String(doc.heroImage.height))), 'hero image URL/alt/dimensions mismatch');
    texts = [doc.excerpt, ...(doc.layout || []).flatMap(blockTexts), ...(doc.faq || []).flatMap((f) => [f.question, f.answer]), ...(doc.takeaways || []).map((t) => t.text), ...(doc.sources || []).map((s) => s.label || s.url)];
    if (doc.author?.name) expect(article?.author?.name === doc.author.name, 'author relationship mismatch');
    for (const tag of doc.tags || []) if (tag?.slug) expect(view.links.includes(`/wellness-hub/tag/${tag.slug}`), `tag relationship ${tag.slug} missing`);
  } else if (collection === 'pseo-pages') {
    texts = [doc.subheadline, plain(doc.bodyHtml || ''), doc.ctaUrl ? doc.ctaText : undefined];
    for (const image of inspectHtml(doc.bodyHtml || '').images) expect(view.images.some((rendered) => rendered.src === image.src && rendered.alt === image.alt), `Published pSEO image missing: ${image.src}`);
  } else if (collection === 'pages') {
    texts = (doc.layout || []).flatMap(blockTexts);
  } else {
    texts = [...['whatItIs', 'howCalculated', 'howToRead'].flatMap((key) => lexicalTexts(doc[key])), ...(doc.faq || []).flatMap((f) => [f.question, f.answer]), ...(doc.sources || []).map((s) => s.title)];
  }
  for (const text of texts.filter(Boolean)) expect(view.text.includes(plain(text)), `CMS text missing: ${plain(text).slice(0, 110)}`);
  for (const href of editorialLinks(collection, doc)) {
    const target = new URL(href, SITE_ORIGIN);
    const alias = target.origin === SITE_ORIGIN && target.pathname.match(/^\/tools\/([^/]+)\/?$/)?.[1];
    if (alias && contract.toolAliases[alias]) target.pathname = `/tools/${contract.toolAliases[alias]}`;
    expect(view.links.some((link) => new URL(link, SITE_ORIGIN).href === target.href), `Editorial hyperlink missing or changed: ${href}`);
  }
  return { view, errors, textChecks: texts.filter(Boolean).length };
}

export function hasPermanentRedirect(config, from, to) {
  return (config?.routes || []).some((route) => route.src === `^${from}$` && [301, 308].includes(route.status) && (route.headers?.Location || route.headers?.location) === to);
}

export async function verifyContent({ inventory, manifest, readHtml, readRedirect, baseline, requireReleaseProvenance = true }) {
  const errors = [], documents = [];
  if (requireReleaseProvenance && (manifest.version !== 1 || manifest.source !== 'cms' || manifest.buildKind !== 'cms' || manifest.cmsOrigin !== inventory.cmsOrigin)) errors.push('Build is not a direct, complete build from the expected production CMS (fixture/offline/diagnostic builds cannot pass).');
  if (!Array.isArray(manifest.records) || !Array.isArray(manifest.collections)) return { errors: ['Missing/incomplete content manifest'], documents, counts: {} };
  if (requireReleaseProvenance) for (const collection of ['articles', 'tools', 'categories', 'authors', 'tags', 'pages', 'pseo-pages', 'redirects', 'global:settings', 'global:ad-management', 'global:lead-gen']) if (!manifest.collections.includes(collection)) errors.push(`Unverified public content group: ${collection}`);
  const records = new Map();
  for (const record of manifest.records) { const key = `${record.collection}:${record.docId}`; if (records.has(key)) errors.push(`Duplicate manifest ID ${key}`); records.set(key, record); }
  const counts = {};
  for (const collection of ['articles', 'tools', 'pages', 'pseo-pages']) {
    const docs = inventory.collections[collection];
    if (!Array.isArray(docs)) { errors.push(`Missing live inventory for ${collection}; unknown counts cannot be treated as zero.`); continue; }
    const required = docs.filter((d) => collection !== 'tools' || d.enabled !== false);
    if (!manifest.collections.includes(collection)) errors.push(`Incomplete ${collection} snapshot`);
    if (baseline?.unverifiedCollections?.includes(collection)) errors.push(`Preservation baseline is still unverified for ${collection}; do not assume zero.`);
    if (!baseline || baseline.cmsOrigin !== inventory.cmsOrigin || !Array.isArray(baseline.collections?.[collection])) errors.push(`Missing/wrong-origin preservation baseline for ${collection}`);
    for (const prior of baseline?.collections?.[collection] || []) {
      const current = docs.find((d) => String(d.id) === String(prior.id));
      if (!current) errors.push(`Unexpected reduction: ${collection} ID ${prior.id} (${prior.slug}) is no longer published. Review content before changing the baseline.`);
      else if (current.slug !== prior.slug) errors.push(`Unreviewed slug change: ${collection} ID ${prior.id}: ${prior.slug} -> ${current.slug}`);
      else if (collection === 'tools' && prior.enabled === true && current.enabled === false) errors.push(`Unexpected reduction: tool ID ${prior.id} was disabled; review before changing the baseline.`);
      else if (collection === 'articles' && prior.publishDate && current.publishDate !== prior.publishDate) errors.push(`Unreviewed publication date change: article ID ${prior.id}`);
    }
    let generated = 0;
    for (const doc of required) {
      const path = publicPath(collection, doc);
      const alias = collection === 'tools' && !!contract.toolAliases[doc.slug];
      const findings = [];
      const record = records.get(`${collection}:${doc.id}`);
      if (!record || record.proof?.digest !== documentProof(collection, doc).digest || record.proof?.slug !== doc.slug) findings.push('Missing/stale CMS ID, slug or editorial content fingerprint');
      if (!alias && record?.path !== path) findings.push('Manifest does not identify the actual rendered route');
      let inspected;
      try { inspected = inspectDocument(collection, alias ? required.find((d) => d.slug === toolSlug(doc)) || doc : doc, await readHtml(path), inventory.cmsOrigin); if (!alias) findings.push(...inspected.errors); generated += alias ? 0 : 1; } catch { findings.push('Required HTML file missing'); }
      if (alias) {
        const from = `/tools/${doc.slug}`;
        let preserved = readRedirect ? await readRedirect(from, path) : false;
        if (!preserved) { try { preserved = (await readHtml(from)).includes(path); } catch { /* Vercel redirects are represented in routing config, not HTML. */ } }
        if (!preserved) findings.push('Legacy tool URL not preserved as a permanent redirect');
      }
      const result = { collection, id: String(doc.id), slug: doc.slug, title: doc.title || doc.name || doc.headline, url: new URL(path, SITE_ORIGIN).href, alias, expectedPath: path, textChecks: inspected?.textChecks || 0, errors: findings };
      documents.push(result); errors.push(...findings.map((f) => `${collection} ID ${doc.id} (${doc.slug}): ${f}`));
    }
    counts[collection] = { publishedRecords: docs.length, requiredRecords: required.length, requiredPages: new Set(required.map((d) => publicPath(collection, d))).size, generatedPages: generated };
  }
  for (const collection of ['articles', 'pages', 'pseo-pages']) {
    const expectedIds = new Set((inventory.collections[collection] || []).map((d) => String(d.id)));
    for (const record of manifest.records.filter((r) => r.collection === collection)) if (!expectedIds.has(record.docId)) errors.push(`Unexpected/stale ${collection} document in build: ID ${record.docId}`);
  }
  return { checkedAt: new Date().toISOString(), scope: ['published articles', 'published enabled tools and legacy redirects', 'published CMS pages', 'published pSEO pages'], cmsOrigin: inventory.cmsOrigin, errors, documents, counts };
}

export async function verifyOutput({ dist = 'dist/client', inventory, baseline, requireReleaseProvenance = true, providerDir } = {}) {
  const root = resolve(dist);
  const manifest = JSON.parse(await readFile(join(root, 'content-manifest.json'), 'utf8'));
  const readHtml = (path) => readFile(join(root, path.replace(/^\//, ''), 'index.html'), 'utf8');
  const config = providerDir ? await readFile(join(providerDir, '..', 'config.json'), 'utf8').then(JSON.parse).catch(() => null) : null;
  const result = await verifyContent({ inventory, manifest, readHtml, readRedirect: (from, to) => hasPermanentRedirect(config, from, to), baseline, requireReleaseProvenance });
  if (providerDir) {
    const receipt = await readFile(join(providerDir, 'content-manifest.json'), 'utf8').catch(() => null);
    if (!receipt || receipt !== await readFile(join(root, 'content-manifest.json'), 'utf8')) result.errors.push('Provider content manifest missing or different from verified output');
  }
  const xml = (await Promise.all((await readdir(root)).filter((f) => /^sitemap-\d+\.xml$/.test(f)).map((f) => readFile(join(root, f), 'utf8')))).join('');
  const checkedImages = new Set();
  for (const document of result.documents.filter((d) => !d.alias && !d.errors.length)) {
    const doc = inventory.collections[document.collection].find((d) => String(d.id) === document.id);
    const expected = expectedMetadata(document.collection, doc, inventory.cmsOrigin);
    const shouldIndex = doc.seo?.noIndex !== true && expected.canonical === document.url;
    if (xml.includes(`<loc>${document.url}</loc>`) !== shouldIndex) result.errors.push(`XML sitemap membership mismatch: ${document.url}`);
    const view = inspectHtml(await readHtml(document.expectedPath));
    for (const image of [...view.images.map((i) => i.src), view.meta['og:image'], view.meta['twitter:image']].filter(Boolean)) {
      const url = new URL(image, SITE_ORIGIN);
      if (url.origin !== SITE_ORIGIN || checkedImages.has(url.pathname)) continue;
      checkedImages.add(url.pathname);
      try { await access(join(root, url.pathname.replace(/^\//, ''))); } catch { result.errors.push(`Local image file missing: ${url.pathname}`); }
    }
    if (providerDir) {
      try { if (await readHtml(document.expectedPath) !== await readFile(join(providerDir, document.expectedPath.replace(/^\//, ''), 'index.html'), 'utf8')) result.errors.push(`Provider HTML differs: ${document.expectedPath}`); } catch { result.errors.push(`Provider HTML missing: ${document.expectedPath}`); }
    }
  }
  result.contentComplete = result.errors.length === 0;
  result.localImageFilesChecked = checkedImages.size;
  result.releaseReady = false; // This gate never substitutes for security and deployment approval.
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const baseline = JSON.parse(await readFile(new URL('./production-baseline.json', import.meta.url), 'utf8'));
    const inventory = await readPublishedInventory(baseline.cmsOrigin);
    const result = await verifyOutput({ inventory, baseline, providerDir: resolve('.vercel/output/static') });
    console.log(JSON.stringify({ contentComplete: result.contentComplete, counts: result.counts, errors: result.errors }, null, 2));
    if (!result.contentComplete) process.exitCode = 1;
  } catch (error) { console.error(`CONTENT PREFLIGHT BLOCKED: ${error.message}`); process.exitCode = 1; }
}
