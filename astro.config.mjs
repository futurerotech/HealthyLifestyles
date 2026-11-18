// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { partytownSnippet } from '@builder.io/partytown/integration';
import { copyLibFiles } from '@builder.io/partytown/utils';
import * as path from 'path';
import { serializeSitemapEntry } from './src/lib/seo-url-policy.mjs';

// ✅ correct domain
export const SITE_URL = 'https://www.healthylifesstyles.com';

await copyLibFiles(path.resolve('public', '~partytown'));

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  integrations: [
    preact({ compat: true }),
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/og/') &&
        !page.includes('/embed/'),
      changefreq: 'weekly',
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', ar: 'ar' },
      },
      serialize: (item) => serializeSitemapEntry(item, SITE_URL),
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
          order: /** @type {'post'} */ ('post'),
          handler(/** @type {string} */ html) {
            const snippet = partytownSnippet({ forward: ['dataLayer.push', 'adsbygoogle.push'] });
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
