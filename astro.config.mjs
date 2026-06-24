// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { partytownSnippet } from '@builder.io/partytown/integration';
import { copyLibFiles } from '@builder.io/partytown/utils';
import * as path from 'path';

// Canonical production origin. Update before deploying to a custom domain.
export const SITE_URL = 'https://www.healthylifestyles.com';

// Build timestamp for sitemap <lastmod>.
const BUILD_DATE = new Date().toISOString();

// Copy Partytown web-worker library to public dir at build start.
await copyLibFiles(path.resolve('public', '~partytown'));

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: vercel(),
  // Consistent policy: clean URLs with NO trailing slash (matches canonical tags).
  trailingSlash: 'never',
  integrations: [
    preact({ compat: true }),
    sitemap({
      // Keep image endpoints (and future /embed/*) out of the page sitemap.
      filter: (page) => !page.includes('/404') && !page.includes('/og/') && !page.includes('/embed/'),
      changefreq: 'weekly',
      priority: 0.7,
      // Add lastmod and strip any trailing slash so sitemap URLs match canonicals.
      serialize: (item) => ({
        ...item,
        url: item.url.replace(/(.+?)\/$/, '$1'),
        lastmod: BUILD_DATE,
      }),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  vite: {
    plugins: [
      {
        name: 'partytown-snippet',
        transformIndexHtml: {
          enforce: 'post',
          transform(html) {
            const snippet = partytownSnippet({ forward: ['dataLayer.push'] });
            return html.replace('</head>', `${snippet}</head>`);
          },
        },
      },
    ],
    // ✅ Exclude sharp from SSR bundle (native module, loaded at runtime)
    ssr: {
      external: ['sharp'],
    },
  },
});
