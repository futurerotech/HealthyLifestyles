/** Shared content model for every tool page (used by all category content files). */
import type { FaqItem } from './faq';

export interface ContentSection {
  h2: string;
  paragraphs?: string[];
  list?: { intro?: string; items: string[] };
}

export interface Source {
  citation: string;
  url?: string;
}

export interface ToolContent {
  /** ≤60 chars, keyword-rich. */
  seoTitle: string;
  /** ≤155 chars. */
  metaDescription: string;
  /** One–two sentences under the H1. */
  intro: string;
  /** Optional prominent safety banner shown above the calculator (e.g. heart tools). */
  notice?: string;
  sections: ContentSection[];
  faq: FaqItem[];
  sources: Source[];
}

/** Build a PubMed search URL from an article title (always resolves). */
export const pubmed = (terms: string): string =>
  `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(terms)}`;
