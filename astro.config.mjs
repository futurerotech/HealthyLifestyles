// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { partytownSnippet } from '@builder.io/partytown/integration';
import { copyLibFiles } from '@builder.io/partytown/utils';
import * as path from 'path';

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
      serialize: (item) => {
        const cleanUrl = item.url.replace(/(.+?)\/$/, '$1');
        const isHome = cleanUrl === SITE_URL;
        // Root homepage MUST retain trailing slash per HTTP/GSC canonical standards
        const url = isHome ? `${SITE_URL}/` : cleanUrl;

        let priority = 0.7;
        if (isHome) {
          priority = 1.0;
        } else if (/\/wellness-hub\/[^/]+$/.test(cleanUrl) && !/\/wellness-hub$/.test(cleanUrl)) { priority = 0.8; } else if (/\/tools\/[^/]+$/.test(cleanUrl)) {
          priority = 0.8;
        } else if (/\/(author|wellness-hub|tools)$/.test(cleanUrl)) { priority = 0.9; } else if (/\/(about\vert{}privacy\vert{}contact\vert{}terms\vert{}accessibility\vert{}editorial-policy\vert{}methodology\vert{}medical-disclaimer\vert{}cookie-policy\vert{}health-score\vert{}ai-assistant)$/.test(cleanUrl)) {
          priority = 0.5;
        }

        return { ...item, url, priority };
      },
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
