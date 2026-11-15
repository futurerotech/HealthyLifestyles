// Release content lock for the coordinated #56 cutover (16 unique article records).
//
// Static pages bake CMS content in at build time, so a visitor can only ever see the
// article/calculator pair from one build. The danger is a build that combines new code with
// old (or partly published) articles, or old code with new articles. This lock makes the
// build itself fail closed unless the live published records are exactly one expected set:
//
//   mode "pre-release": every locked record must equal its reviewed pre-release content.
//     This is the state on PR #56 today, matching production now. A partial or unreviewed
//     publish fails the build, and the previous deployment keeps serving.
//   mode "release": every locked record must equal its reviewed release content. All
//     release digests must be filled. Any missing, partial, drifted or extra change fails.
//
// The digest is the preflight's editorial content fingerprint (documentProof) WITHOUT
// updatedAt: publishing sets a new updatedAt, which cannot be known in advance, and the
// lock must compare content, not timestamps.
import { readFile } from 'node:fs/promises';
import { editorialDigest } from '../../src/lib/content-integrity.mjs';

/** Editorial fingerprint of a published article (documentProof fields without updatedAt). */
export const lockDigest = (doc) => editorialDigest('articles', doc);

/**
 * Check live published articles against the lock. Returns error strings (empty = pass).
 * An absent or disabled lock is a no-op, so builds of unrelated branches are unaffected.
 */
export function checkContentLock(articles, lock, { digest = lockDigest } = {}) {
  if (!lock || lock.enabled !== true) return [];
  const errors = [];
  const mode = lock.mode;
  if (mode !== 'pre-release' && mode !== 'release') return [`release content lock: unknown mode ${JSON.stringify(mode)}`];
  const key = mode === 'release' ? 'releaseDigest' : 'preReleaseDigest';
  const byId = new Map(articles.map((a) => [String(a.id), a]));
  let matched = 0;
  for (const r of lock.records || []) {
    const where = `release content lock (${mode}) article ID ${r.id} (${r.slug})`;
    if (!/^[0-9a-f]{64}$/.test(String(r[key] || ''))) { errors.push(`${where}: ${key} is not set; the lock is incomplete`); continue; }
    const live = byId.get(String(r.id));
    if (!live) { errors.push(`${where}: not published`); continue; }
    if (live.slug !== r.slug) { errors.push(`${where}: slug is ${live.slug}`); continue; }
    const d = digest(live);
    if (d === r[key]) { matched++; continue; }
    const other = mode === 'release' ? r.preReleaseDigest : r.releaseDigest;
    errors.push(`${where}: live content ${d === other ? `is still the ${mode === 'release' ? 'pre-release' : 'release'} version` : 'matches neither reviewed version (drift or unreviewed edit)'}`);
  }
  if (errors.length && matched) errors.push(`release content lock (${mode}): partial state, ${matched} of ${(lock.records || []).length} records match; the build must not ship a mixed set`);
  return errors;
}

export async function loadLock(url = new URL('./release-content-lock.json', import.meta.url)) {
  try { return JSON.parse(await readFile(url, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

// CLI: print the current live digests for the locked records (read-only), so reviewers can
// fill preReleaseDigest now and releaseDigest after the drafts are reviewed on staging.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readPublishedCollection } = await import('./inventory.mjs');
  const lock = await loadLock();
  const articles = await readPublishedCollection(lock.cmsOrigin, 'articles');
  const byId = new Map(articles.map((a) => [String(a.id), a]));
  const out = (lock.records || []).map((r) => {
    const live = byId.get(String(r.id));
    return { id: r.id, slug: r.slug, liveSlug: live?.slug ?? null, updatedAt: live?.updatedAt ?? null, digest: live ? lockDigest(live) : null };
  });
  console.log('[CONTENT_LOCK_DIGESTS] ' + JSON.stringify(out));
  const errors = checkContentLock(articles, lock);
  console.log('[CONTENT_LOCK_CHECK] ' + JSON.stringify({ enabled: lock.enabled, mode: lock.mode, errors }));
}
