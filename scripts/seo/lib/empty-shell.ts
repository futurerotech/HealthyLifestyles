/**
 * P15-P6 — Empty-shell detection primitives (pure, unit-tested).
 *
 * "Meaningful content" = the <article> (or <main>) text with chrome, nav,
 * scripts, styles, SVG, and ALL tag attributes (so URLs/hreflang/metadata
 * differences vanish) removed, then lower-cased and whitespace-collapsed.
 * Two locales sharing the same meaningful hash ⇒ the "translation" is a copy
 * of English (a shell). Below-threshold length ⇒ placeholder/empty.
 */
export const MIN_MEANINGFUL_CHARS = 200;

export function extractMeaningful(html: string): string {
  const m =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const inner = m ? m[1] : html;
  return inner
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ') // strip tags → drops all attribute URLs/metadata
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[0-9]+/g, ' ') // digits are language-neutral (dates, counts) — ignore
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** djb2 (xor variant) — deterministic, dependency-free. */
export function contentHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

export type ShellReason = 'placeholder-or-empty' | 'reproduces-default-locale';

export interface ShellVerdict {
  isShell: boolean;
  reason?: ShellReason;
  chars: number;
}

/**
 * Verdict for one localized page vs its default-locale counterpart.
 * @param localizedHtml  the target-locale page HTML
 * @param defaultHtml    the English counterpart HTML (or null if none exists)
 */
export function assessShell(localizedHtml: string, defaultHtml: string | null): ShellVerdict {
  const local = extractMeaningful(localizedHtml);
  if (local.length < MIN_MEANINGFUL_CHARS) {
    return { isShell: true, reason: 'placeholder-or-empty', chars: local.length };
  }
  if (defaultHtml !== null) {
    const def = extractMeaningful(defaultHtml);
    if (def.length > 0 && contentHash(local) === contentHash(def)) {
      return { isShell: true, reason: 'reproduces-default-locale', chars: local.length };
    }
  }
  return { isShell: false, chars: local.length };
}
