// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { partytownSnippet } from '@builder.io/partytown/integration';
import { copyLibFiles } from '@builder.io/partytown/utils';
import * as path from 'path';

// ✅ FIXED: correct domain with double 's'
export const SITE_URL = 'https://www.healthylifesstyles.com';

const BUILD_DATE = new Date().toISOString();

await copyLibFiles(path.resolve('public', '~partytown'));

export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000'),
  },
  integrations: [
    preact({ compat: true }),
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/og/') &&
        !page.includes('/embed/'),
      changefreq: 'weekly',
      priority: 0.7,
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
    ssr: {
      external: ['sharp'],
    },
  },
});
