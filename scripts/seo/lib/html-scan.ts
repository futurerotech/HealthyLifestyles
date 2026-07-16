/**
 * SEO Quality Gate (Phase 1) — SHARED scan primitives for every dist-scanning
 * SEO script. Extracted because the @type-array false-positive bug recurred
 * precisely where this logic was copy-pasted (discover-audit P16, CMS
 * siteAudit P17). One implementation, unit-tested, with regression fixtures.
 *
 * Consumers: date-integrity.ts, discover-audit.ts, metadata-audit.ts
 * Tests:     scripts/seo/__tests__/html-scan.test.ts (node --test)
 */
import * as fs from 'fs';
import * as path from 'path';

/** Recursively visit HTML files under dir. Default: *.html (incl. 404.html). */
export function walkHtmlFiles(
  dir: string,
  cb: (filePath: string) => void,
  fileFilter: (name: string) => boolean = (n) => n.endsWith('.html'),
): void {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtmlFiles(full, cb, fileFilter);
    else if (e.isFile() && fileFilter(e.name)) cb(full);
  }
}

export interface JsonLdScan {
  /** Successfully parsed top-level JSON-LD values (objects or arrays). */
  blocks: unknown[];
  /** Count of script blocks that failed JSON.parse (syntactically invalid). */
  invalid: number;
}

/** Extract and parse every <script type="application/ld+json"> block. */
export function extractJsonLdBlocks(html: string): JsonLdScan {
  const blocks: unknown[] = [];
  let invalid = 0;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      invalid++;
    }
  }
  return { blocks, invalid };
}

/**
 * Normalize a node's `@type` to a string array. Handles BOTH forms:
 * `"@type":"Article"` and `"@type":["MedicalWebPage","Article"]` — the
 * array form is the historical false-positive class (P16/P17).
 */
export function nodeTypes(node: unknown): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [];
  const t = (node as Record<string, unknown>)['@type'];
  if (typeof t === 'string') return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string');
  return [];
}

/**
 * Does any TOP-LEVEL node (or element of a top-level array) carry `type`?
 * Top-level-only on purpose: nested stubs (e.g. CollectionPage→hasPart→Article)
 * must NOT qualify a page as an article — that was discover-audit's second
 * false-positive class (archives flagged as articles).
 */
export function hasTopLevelType(blocks: unknown[], type: string): boolean {
  for (const b of blocks) {
    const nodes = Array.isArray(b) ? b : [b];
    for (const n of nodes) if (nodeTypes(n).includes(type)) return true;
  }
  return false;
}

/** First top-level node carrying `type`, or null. */
export function firstTopLevelOfType(blocks: unknown[], type: string): Record<string, unknown> | null {
  for (const b of blocks) {
    const nodes = Array.isArray(b) ? b : [b];
    for (const n of nodes) if (nodeTypes(n).includes(type)) return n as Record<string, unknown>;
  }
  return null;
}
