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

export const COLLECTIONS = ['articles', 'tools', 'categories', 'authors', 'tags', 'pages', 'pseo-pages', 'redirects'];
export const GLOBALS = ['settings', 'ad-management', 'lead-gen'];
/** Never exported, whatever a public endpoint returns. */
export const EXCLUDED_COLLECTIONS = ['users', 'subscribers', 'leads', 'push-subscriptions', 'push-history', 'profiles', 'tool-usage',
  'audit-log', 'indexing-status', 'pending-deploys', 'deploy-log', 'link-prospects', 'outreach-templates', 'backlinks', 'embed-logs',
  'site-audits', 'prompt-registry', 'personas', 'pseo-templates', 'pseo-datasets', 'leads-config'];
const SECRET_KEY = /(secret|token|password|passwd|api[-_]?key|apikey|private[-_]?key|privatekey|webhook|vapid|credential|auth(?!or))/i;
const EMAIL_VALUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

/** Build the bundle from already-fetched public data (pure, so it can be tested offline). */
export function buildBundle({ cmsOrigin, collections, globals, capturedAt }) {
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
  out.counts = Object.fromEntries(Object.entries(out.collections).map(([c, d]) => [c, d.length]));
  return out;
}
