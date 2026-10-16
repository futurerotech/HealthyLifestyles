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
  return {
    ...(sections.length ? { sections } : {}),
    ...(Array.isArray(value.faq) ? { faq: value.faq.filter((f) => f.question && f.answer).map((f) => ({ q: f.question!, a: f.answer! })) } : {}),
    ...(Array.isArray(value.sources) ? { sources: value.sources.filter((s) => s.title).map((s) => ({ citation: s.title!, url: s.url || undefined })) } : {}),
  };
}
