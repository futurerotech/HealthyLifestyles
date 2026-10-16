export interface SeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  canonical?: string;
  noIndex?: boolean;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

/** Editorial canonicals may be relative or absolute HTTP(S) URLs. */
export function resolveCanonical(value: string | undefined, pathname: string, origin: URL | string): string {
  const fallback = new URL(pathname, origin);
  const url = value?.trim() ? new URL(value.trim(), origin) : fallback;
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Canonical must be an HTTP(S) URL without credentials.');
  }
  url.hash = '';
  return url.href.replace(/\/$/, '');
}
