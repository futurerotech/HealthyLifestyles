/**
 * A successful CMS list can legitimately contain zero documents. An empty
 * response is authoritative; only an unavailable/malformed envelope permits
 * the caller's explicitly gated local development fallback.
 */
export interface CmsListResponse<T> {
  docs: T[];
}

export function authoritativeCmsDocs<T>(response: CmsListResponse<T> | null | undefined): T[] | null {
  return response && Array.isArray(response.docs) ? response.docs : null;
}

export function resolveCmsList<T, R>(
  response: CmsListResponse<T> | null | undefined,
  onCms: (docs: T[]) => R,
  onUnavailable: () => R,
): R {
  const docs = authoritativeCmsDocs(response);
  return docs === null ? onUnavailable() : onCms(docs);
}
