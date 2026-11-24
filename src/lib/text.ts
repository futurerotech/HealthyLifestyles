/**
 * Small text helpers for the Wellness Hub: stable heading slugs (for the auto
 * table of contents + anchor links), a minimal safe-markdown inline renderer
 * (bold + internal/external links), and reading-time estimation.
 *
 * CMS-authored strings are untrusted at the HTML boundary. Link purpose is
 * supplied by the renderer, never by raw Markdown or CMS HTML.
 */

import { normalizeInternalHref, SITE_ORIGIN } from './site-routes';

/** URL/anchor-safe slug from a heading or title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface LinkPolicy {
  purpose?: 'editorial' | 'sponsored' | 'ugc' | 'untrusted';
  /** Exact, audited HTTPS destinations for the current article only. */
  approvedCitationUrls?: ReadonlySet<string>;
}

interface SafeLinkAttributes {
  href: string;
  target?: '_blank';
  rel?: string;
}

/** Shared by inline Markdown and the structured Sources list. Default closed. */
export function safeLinkAttributes(href: string | undefined, policy: LinkPolicy = {}): SafeLinkAttributes | undefined {
  if (typeof href !== 'string' || !href || /[\s\u0000-\u001f\u007f\\<>"`]/.test(href)) return undefined;
  let url: URL;
  try { url = new URL(href, SITE_ORIGIN); } catch { return undefined; }
  if (!['http:', 'https:', 'mailto:'].includes(url.protocol) || url.username || url.password) return undefined;
  if (url.protocol === 'mailto:') return { href: url.href };

  const external = url.origin !== SITE_ORIGIN;
  const destination = external ? url.href : normalizeInternalHref(href);
  const purpose = policy.purpose;
  // Compensation and user-generated contexts take precedence over any citation list.
  const qualification = purpose === 'sponsored' ? 'sponsored nofollow'
    : purpose === 'ugc' ? 'ugc nofollow'
    : external && !(purpose === 'editorial' && url.protocol === 'https:' && policy.approvedCitationUrls?.has(href)) ? 'nofollow'
    : '';
  if (external) return { href: destination, target: '_blank', rel: qualification ? `noopener ${qualification}` : 'noopener' };
  return qualification ? { href: destination, rel: qualification } : { href: destination };
}

/** Render only bold and Markdown links; escape raw prose, labels and hrefs once. */
export function renderInline(md: string, policy: LinkPolicy = {}): string {
  let html = '';
  let end = 0;
  for (const match of md.matchAll(/\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    const index = match.index ?? 0;
    html += escapeHtml(md.slice(end, index));
    if (match[1] !== undefined) {
      html += `<strong>${renderInline(match[1], policy)}</strong>`;
    } else {
      const label = escapeHtml(match[2]).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      const link = safeLinkAttributes(match[3], policy);
      if (!link) html += label;
      else {
        const attrs = (link.target ? ` target="${link.target}"` : '') + (link.rel ? ` rel="${link.rel}"` : '');
        html += `<a href="${escapeHtml(link.href)}"${attrs}>${label}</a>`;
      }
    }
    end = index + match[0].length;
  }
  return html + escapeHtml(md.slice(end));
}

/** Strip the lightweight markdown so we can count words / build descriptions. */
export function stripInline(md: string): string {
  return md
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/** Whole minutes at ~200 wpm, floored to a minimum of 1. */
export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Human date, e.g. "June 20, 2026", from an ISO date string. */
export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
