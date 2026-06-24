/**
 * Small text helpers for the Wellness Hub: stable heading slugs (for the auto
 * table of contents + anchor links), a minimal trusted-markdown inline renderer
 * (bold + internal/external links), and reading-time estimation.
 *
 * `renderInline` is only ever fed author-written strings from `src/data/*`
 * (never user input), so emitting HTML via `set:html` is safe here.
 */

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
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Render a trusted inline string: escapes HTML, then re-enables `**bold**` and
 * `[label](href)` links. Internal links (starting with `/`) stay followable;
 * external links get `target=_blank rel="noopener nofollow"`.
 */
export function renderInline(md: string): string {
  let s = escapeHtml(md);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const external = /^https?:\/\//.test(href);
    const attrs = external ? ' target="_blank" rel="noopener nofollow"' : '';
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
