/**
 * Small text helpers for the Wellness Hub: stable heading slugs (for the auto
 * table of contents + anchor links), a minimal trusted-markdown inline renderer
 * (bold + internal/external links), and reading-time estimation.
 *
 * `renderInline` consumes curated editorial text (local articles and CMS-mapped
 * article blocks), not visitor input. Escape HTML before rendering `set:html`;
 * preserve URL protocol checks. Ads and paid links use a separate renderer.
 */

import { normalizeInternalHref } from './site-routes';

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

/**
 * Render a trusted inline string: escapes HTML, then re-enables `**bold**` and
 * `[label](href)` links. Internal links (starting with `/`) stay followable;
 * ordinary editorial external links use `target=_blank rel="noopener noreferrer"`.
 * Advertising/affiliate links are NOT rendered here; AdSlot keeps `sponsored`.
 */
export function renderInline(md: string): string {
  let s = escapeHtml(md);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    try {
      const url = new URL(href.replace(/&amp;/g, '&'), 'https://www.healthylifesstyles.com');
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return label;
    } catch { return label; }
    href = normalizeInternalHref(href);
    const external = /^https?:\/\//.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${attrs}>${label}</a>`;
  });
  return s;
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
