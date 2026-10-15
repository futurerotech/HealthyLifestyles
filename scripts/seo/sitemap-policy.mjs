import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export function isIndexableHtml(html, url) {
  if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) return false;
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
  return !canonical || canonical.replace(/\/$/, '') === url.replace(/\/$/, '');
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
