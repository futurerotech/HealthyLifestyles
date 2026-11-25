import type { ToolContent } from '../data/content-types';

export interface CmsToolContent {
  sections?: ToolContent['sections'];
  faq?: ToolContent['faq'];
  sources?: ToolContent['sources'];
}

/** Convert the CMS's Lexical prose to the same safe inline format used by authored tools. */
export function lexicalParagraphs(value: unknown): string[] {
  const tree = value as { root?: { children?: unknown[] } } | null;
  function text(value: unknown): string {
    const node = value as { text?: string; children?: unknown[]; fields?: { url?: string }; type?: string };
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'linebreak') return '\n';
    const content = typeof node.text === 'string' ? node.text : (node.children || []).map(text).join('');
    if (node.type === 'link' && node.fields?.url) {
      try {
        const url = new URL(node.fields.url, 'https://www.healthylifesstyles.com');
        if (['http:', 'https:', 'mailto:'].includes(url.protocol)) return `[${content}](${node.fields.url})`;
      } catch { /* Keep the visible text of an invalid link. */ }
    }
    return content;
  }
  return (tree?.root?.children || []).map(text).map((s) => s.trim()).filter(Boolean);
}

export function mapToolContent(value: { whatItIs?: unknown; howCalculated?: unknown; howToRead?: unknown; faq?: { question?: string; answer?: string }[]; sources?: { title?: string; url?: string }[] }): CmsToolContent {
  const sections = [
    { h2: 'What it is', paragraphs: lexicalParagraphs(value.whatItIs) },
    { h2: "How it is calculated", paragraphs: lexicalParagraphs(value.howCalculated) },
    { h2: 'How to read your result', paragraphs: lexicalParagraphs(value.howToRead) },
  ].filter((section) => section.paragraphs.length);
  // An empty CMS list means the field was never filled (all 70 tools were imported with
  // faq: [] and sources: [] on 2026-07-15), not an editorial removal. Replacing the audited
  // authored FAQ and citations with nothing left every live tool page with empty
  // "Frequently asked questions" and "Sources & references" sections. Only a non-empty
  // CMS list replaces authored content.
  const faq = Array.isArray(value.faq) ? value.faq.filter((f) => f.question && f.answer).map((f) => ({ q: f.question!, a: f.answer! })) : [];
  const sources = Array.isArray(value.sources) ? value.sources.filter((s) => s.title).map((s) => ({ citation: s.title!, url: s.url || undefined })) : [];
  return {
    ...(sections.length ? { sections } : {}),
    ...(faq.length ? { faq } : {}),
    ...(sources.length ? { sources } : {}),
  };
}
