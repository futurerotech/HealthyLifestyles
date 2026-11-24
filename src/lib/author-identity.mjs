/**
 * Author attribution is a reference to an actual profile, not a fallback
 * to the first available writer. All functions operate on one inventory.
 */
/** @param {unknown} value @returns {value is string} */
const nonblank = (value) => typeof value === 'string' && value.trim() !== '';
/** @param {unknown} value @returns {value is string | number} */
const validId = (value) => (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
  || (nonblank(value) && value === value.trim());
/** @param {unknown} value @returns {value is string} */
const validSlug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value);
/** @template T @param {readonly T[]} matches @returns {T | undefined} */
const one = (matches) => matches.length === 1 ? matches[0] : undefined;

/** @param {unknown} value @returns {value is Record<string, unknown>} */
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Validate the COMPLETE CMS list before mapping or filtering any profiles.
 * @param {unknown} list
 */
export function validateAuthorInventory(list) {
  if (!record(list) || !Array.isArray(list.docs) || typeof list.totalDocs !== 'number'
      || !Number.isSafeInteger(list.totalDocs) || list.totalDocs < 0 || list.docs.length !== list.totalDocs) {
    throw new Error('[CMS] Invalid or incomplete authors inventory');
  }
  const ids = new Set();
  const slugs = new Set();
  for (const doc of list.docs) {
    if (!record(doc) || !validId(doc.id) || !validSlug(doc.slug) || !nonblank(doc.name)
        || doc.name !== doc.name.trim() || (doc.schemaType !== 'Person' && doc.schemaType !== 'Organization')) {
      throw new Error('[CMS] Invalid author identity; refusing partial inventory');
    }
    const id = String(doc.id);
    if (ids.has(id) || slugs.has(doc.slug)) {
      throw new Error('[CMS] Duplicate author ID or slug; refusing ambiguous inventory');
    }
    ids.add(id);
    slugs.add(doc.slug);
  }
}

/**
 * @template {{slug:string, name:string}} T
 * @param {unknown} reference
 * @param {readonly T[]} authors
 * @returns {T | undefined}
 */
export function resolveAuthorIdentity(reference, authors) {
  if (!nonblank(reference)) return undefined;
  // Canonical slugs are unique. A legacy display-name reference is accepted
  // only if exactly one profile matches; names shared by people are ambiguous.
  const slugMatches = authors.filter((author) => author.slug === reference);
  if (slugMatches.length) return one(slugMatches);
  return one(authors.filter((author) => author.name === reference));
}

/**
 * Resolve Payload relation IDs/objects against the same validated inventory.
 * Populated localized names need not equal the canonical English profile name.
 * Never use a name or slug to rescue a missing/conflicting explicit ID.
 * @template {{slug:string, name:string, cmsId?:string}} T
 * @param {unknown} relation
 * @param {readonly T[]} authors
 * @returns {T | undefined}
 */
export function resolveCmsAuthorRelation(relation, authors) {
  /** @param {unknown} id */
  const byId = (id) => validId(id)
    ? one(authors.filter((author) => author.cmsId === String(id))) : undefined;
  if (relation === null || relation === undefined) return undefined;
  if (typeof relation !== 'object') return byId(relation);
  if (!record(relation)) return undefined;
  if (Object.hasOwn(relation, 'id')) {
    const profile = byId(relation.id);
    if (!profile || (Object.hasOwn(relation, 'slug') && relation.slug !== profile.slug)) return undefined;
    return profile;
  }
  if (Object.hasOwn(relation, 'slug')) {
    return validSlug(relation.slug) ? one(authors.filter((author) => author.slug === relation.slug)) : undefined;
  }
  // Compatibility for name-only populated relations in existing fixtures or
  // legacy exports. Never resolve an ambiguous display name as a slug.
  return nonblank(relation.name) ? one(authors.filter((author) => author.name === relation.name)) : undefined;
}

/**
 * @param {{slug:string,name:string,schemaType:string,credential?:string,role?:string}} author
 * @param {URL|string} origin
 */
export function authorLd(author, origin) {
  const url = new URL(`/author/${author.slug}`, origin).href;
  return {
    '@type': author.schemaType,
    '@id': url,
    name: author.name,
    url,
    ...(author.credential ? { credential: author.credential } : {}),
    ...(author.schemaType === 'Person' && author.role ? { jobTitle: author.role } : {}),
  };
}
