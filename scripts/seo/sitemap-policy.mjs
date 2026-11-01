import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Keep legacy /tag/* and any other legacy/private tag segment out of the
 * sitemap, but permit real editorial /wellness-hub/tag/:slug archives.
 * getStaticPaths already generates only tag archives containing articles;
 * the build hook below still removes noindex/non-self-canonical pages.
 */
export function isExcludedSitemapPath(pathname) {
  if (/^\/wellness-hub\/tag\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)) return false;
  return /\/(?:api|og|embed|game|games|wp-content|wp-admin|wp-includes|category|tag)(?:\/|$)/.test(pathname);
}

// HTML attributes can occur in any order and can be quoted or unquoted.
// Read only known attribute names from the actual tag; do not rely on
// "name" preceding "content" or "rel" preceding "href".
export function getAttribute(tag, name) {
  // Consume whole quoted values, so text inside one attribute cannot masquerade
  // as another attribute. HTML attribute names are ASCII case-insensitive.
  const attributes = /\s+([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'\x60=<>]+)))?/g;
  for (const match of tag.matchAll(attributes)) {
    if (match[1].toLowerCase() === name.toLowerCase()) {
      return match[2] ?? match[3] ?? match[4] ?? '';
    }
  }
  return undefined;
}

// Only real metadata in the HTML head can determine crawlability. Literal
// examples in comments, scripts or body text are not robots/canonical tags.
// For isolated unit-test HTML fragments without a <head>, inspect the fragment.
function metadataSource(html) {
  const active = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template|noscript|textarea|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const head = /<head(?:\s[^>]*)?>/i.exec(active);
  if (!head) return active;
  const rest = active.slice(head.index + head[0].length);
  const closing = /<\/head\s*>/i.exec(rest);
  return closing ? rest.slice(0, closing.index) : '';
}

function metadataTags(html, tagName) {
  // A > inside a quoted attribute value does not terminate an HTML tag.
  const pattern = tagName === 'meta'
    ? /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi
    : /<link\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  return [...metadataSource(html).matchAll(pattern)].map(match => match[0]);
}

export function canonicalTargets(html) {
  return metadataTags(html, 'link')
    .filter(tag => (getAttribute(tag, 'rel') ?? '').trim().toLowerCase()
      .split(/\s+/).includes('canonical'))
    .map(tag => getAttribute(tag, 'href'));
}

export function isIndexableHtml(html, url) {
  for (const tag of metadataTags(html, 'meta')) {
    const name = getAttribute(tag, 'name')?.trim().toLowerCase();
    if (name === 'robots' || name === 'googlebot') {
      const directives = getAttribute(tag, 'content') ?? '';
      if (/(?:^|[\s,;])(?:noindex|none)(?=$|[\s,;])/i.test(directives)) return false;
    }
  }

  const canonicals = canonicalTargets(html);
  // Missing or conflicting canonical targets are never safe sitemap entries.
  if (canonicals.length > 1 || (canonicals.length === 1 && !canonicals[0])) return false;
  return canonicals.length === 0 ||
    canonicals[0].replace(/\/$/, '') === url.replace(/\/$/, '');
}

export default function sitemapPolicy() {
  return {
    name: 'sitemap-indexability-policy',
    hooks: { 'astro:build:done': async ({ dir }) => {
      let root = fileURLToPath(dir);
      if (await stat(join(root, 'client')).then((s) => s.isDirectory()).catch(() => false)) root = join(root, 'client');
      const pages = new Map();
      const xmlFiles = [];
      async function walk(folder) {
        for (const entry of await readdir(folder, { withFileTypes: true })) {
          const file = join(folder, entry.name);
          if (entry.isDirectory()) await walk(file);
          else if (entry.name.endsWith('.html')) {
            const route = '/' + relative(root, file).replace(/\\/g, '/').replace(/(?:^|\/)index\.html$/, '').replace(/\.html$/, '');
            pages.set(`https://www.healthylifesstyles.com${route}`, await readFile(file, 'utf8'));
          } else if (/^sitemap-\d+\.xml$/.test(entry.name)) xmlFiles.push(file);
        }
      }
      await walk(root);
      for (const file of xmlFiles) {
        const xml = await readFile(file, 'utf8');
        const clean = xml.replace(/<url>[^]*?<\/url>/g, (entry) => {
          const url = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
          const html = pages.get(url);
          return html && !isIndexableHtml(html, url) ? '' : entry;
        });
        await writeFile(file, clean);
      }
    } },
  };
}
