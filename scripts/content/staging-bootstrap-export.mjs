// Staging bootstrap EXPORT, prepared but not run. It builds a reviewable bundle of the
// PUBLISHED, PUBLIC content that an isolated staging mirror needs for release-candidate
// acceptance. It reads only the public, unauthenticated CMS API (the same reads every
// frontend build makes). It never uses credentials and never writes to any CMS or bucket.
//
// Included: published articles, tools, categories, authors, tags, pages, pSEO pages and
// redirects with their IDs, slugs and relations; the public globals that the build reads.
// Excluded by construction: everything else. That covers users, subscribers, leads, push
// subscriptions and history, profiles, usage and audit logs, the indexing queue, deploy
// logs, link-building data, prompt registry, drafts, and any secret-looking field.
// Media is referenced by its public URL only. Production R2 is never accessed with
// credentials.
import { createHash } from 'node:crypto';

export const COLLECTIONS = ['articles', 'tools', 'categories', 'authors', 'tags', 'media', 'pages', 'pseo-pages', 'redirects'];
/** Collections without drafts: read in full (they have no _status). */
export const UNVERSIONED = ['categories', 'authors', 'tags', 'redirects'];

/** Media rows referenced by the exported content (populated upload relations), deduplicated by ID. */
export function referencedMedia(collections) {
  const found = new Map();
  const walk = (v) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { if (v.id !== undefined && typeof v.mimeType === 'string' && typeof v.filename === 'string') found.set(String(v.id), v); Object.values(v).forEach(walk); } };
  walk(collections);
  return [...found.values()].sort((a, b) => Number(a.id) - Number(b.id));
}
export const GLOBALS = ['settings', 'ad-management', 'lead-gen'];
/** Never exported, whatever a public endpoint returns. */
export const EXCLUDED_COLLECTIONS = ['users', 'subscribers', 'leads', 'push-subscriptions', 'push-history', 'profiles', 'tool-usage',
  'audit-log', 'indexing-status', 'pending-deploys', 'deploy-log', 'link-prospects', 'outreach-templates', 'backlinks', 'embed-logs',
  'site-audits', 'prompt-registry', 'personas', 'pseo-templates', 'pseo-datasets', 'leads-config'];
const SECRET_KEY = /(secret|token|password|passwd|api[-_]?key|apikey|private[-_]?key|privatekey|webhook|vapid|credentials|auth(?!or))/i;
// Note: an author's "credential" (e.g. "RD, MPH") is public editorial text and is kept;
// "credentials" (plural, a secret bundle) is dropped.
const EMAIL_VALUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Sensitive values embedded in longer text: never copied silently, always reported for review. */
const EMBEDDED = [
  ['email address', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ['bearer or JWT token', /\b(?:Bearer\s+[A-Za-z0-9._-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/],
  ['API key pattern', /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}|\bAKIA[0-9A-Z]{16}\b|\bghp_[A-Za-z0-9]{30,}/],
  ['credentialed URL', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i],
  // North American format, or + country code followed by 8-12 grouped digits.
  ['phone number', /(?:\(\d{3}\)\s?|\b\d{3}[\s.-])\d{3}[\s.-]\d{4}\b|\+\d{1,3}(?:[\s.-]?\d{2,4}){3,5}\b/],
];
/** Public site addresses already published on every page; reviewed and allowed. */
export const REVIEWED_PUBLIC_EMAILS = ['hello@healthylifesstyles.com'];

/** Report embedded sensitive values (path + kind only, never the value itself). */
export function scanEmbedded(value, path = '', findings = []) {
  if (typeof value === 'string') {
    for (const [kind, re] of EMBEDDED) {
      const m = value.match(re);
      if (!m) continue;
      if (kind === 'email address' && REVIEWED_PUBLIC_EMAILS.includes(m[0].toLowerCase())) continue;
      // ISO dates, times and numeric ranges are not phone numbers.
      if (kind === 'phone number' && (/^https?:\/\//i.test(value.trim()) || /^\d{4}-\d{2}-\d{2}/.test(value))) continue;
      findings.push({ path, kind });
    }
  } else if (Array.isArray(value)) value.forEach((v, i) => scanEmbedded(v, `${path}[${i}]`, findings));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) scanEmbedded(v, path ? `${path}.${k}` : k, findings);
  return findings;
}

/**
 * Deep-copies a value, dropping secret-looking keys and email-address values. It returns
 * the dropped key paths, so a reviewer sees exactly what was removed.
 */
export function sanitize(value, path = '', dropped = []) {
  if (Array.isArray(value)) return { value: value.map((v, i) => sanitize(v, `${path}[${i}]`, dropped).value), dropped };
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const p = path ? `${path}.${k}` : k;
      if (SECRET_KEY.test(k)) { dropped.push(p); continue; }
      if (typeof v === 'string' && EMAIL_VALUE.test(v.trim())) { dropped.push(p); continue; }
      out[k] = sanitize(v, p, dropped).value;
    }
    return { value: out, dropped };
  }
  return { value, dropped };
}

/** Canonical JSON (recursively sorted keys). Shared with the CMS importer's `checksum` (staging-import.ts). */
const canon = (v) => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v;
export const checksum = (v) => createHash('sha256').update(JSON.stringify(canon(v))).digest('hex');
const sha = checksum;

/** Build the bundle from already-fetched public data (pure, so it can be tested offline). */
export function buildBundle({ cmsOrigin, collections, globals, capturedAt, allowFindings = false }) {
  for (const c of Object.keys(collections)) if (!COLLECTIONS.includes(c)) throw Error(`collection not allowed in a staging bootstrap: ${c}`);
  for (const g of Object.keys(globals)) if (!GLOBALS.includes(g)) throw Error(`global not allowed in a staging bootstrap: ${g}`);
  const dropped = [];
  const out = { version: 1, sourceOrigin: cmsOrigin, capturedAt, scope: 'published public content only', collections: {}, globals: {}, checksums: {} };
  for (const [c, docs] of Object.entries(collections)) {
    out.collections[c] = docs.map((d) => {
      if (c !== 'redirects' && d._status && d._status !== 'published') throw Error(`${c} ID ${d.id} is not published`);
      const s = sanitize(d, `${c}#${d.id}`, dropped).value;
      out.checksums[`${c}:${d.id}`] = sha(s);
      return s;
    });
  }
  for (const [g, data] of Object.entries(globals)) { out.globals[g] = sanitize(data, `global:${g}`, dropped).value; out.checksums[`global:${g}`] = sha(out.globals[g]); }
  out.dropped = dropped;
  // Fail closed: embedded sensitive values need a human decision; they are never silently copied.
  out.findings = scanEmbedded({ collections: out.collections, globals: out.globals });
  if (out.findings.length && !allowFindings) throw Object.assign(new Error(`${out.findings.length} embedded sensitive value(s) need review before any import`), { findings: out.findings });
  out.counts = Object.fromEntries(Object.entries(out.collections).map(([c, d]) => [c, d.length]));
  return out;
}

// CLI (read-only): --dry-run prints counts, dropped key paths and embedded findings only,
// never content. --out <file> writes the bundle for owner review before any import.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readPublishedCollection } = await import('./inventory.mjs');
  const origin = 'https://cms.healthylifesstyles.com';
  const collections = {};
  const readAll = async (c) => { const docs = []; for (let page = 1; ; page++) { const r = await fetch(`${origin}/api/${c}?depth=0&limit=100&page=${page}&sort=id`); if (!r.ok) throw new Error(`${c}: HTTP ${r.status}`); const d = await r.json(); docs.push(...d.docs); if (!d.hasNextPage) return docs; } };
  for (const c of COLLECTIONS) if (c !== 'media') collections[c] = UNVERSIONED.includes(c) ? await readAll(c) : await readPublishedCollection(origin, c);
  collections.media = referencedMedia(collections);
  const globals = {};
  for (const g of GLOBALS) { const r = await fetch(`${origin}/api/globals/${g}?depth=1`); if (!r.ok) throw new Error(`global ${g}: HTTP ${r.status}`); globals[g] = await r.json(); }
  const bundle = buildBundle({ cmsOrigin: origin, collections, globals, capturedAt: new Date().toISOString(), allowFindings: true });
  console.log('[STAGING_EXPORT_DRYRUN] ' + JSON.stringify({ counts: bundle.counts, globals: Object.keys(bundle.globals), dropped: bundle.dropped, findings: bundle.findings }));
  const out = process.argv.indexOf('--out');
  if (out > 0) (await import('node:fs/promises')).writeFile(process.argv[out + 1], JSON.stringify(bundle));
}
