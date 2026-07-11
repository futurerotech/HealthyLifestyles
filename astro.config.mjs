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
      serialize: (item) => {
        const url = item.url.replace(/(.+?)\/$/, '$1');
        let priority = 0.7;
        if (url === 'https://www.healthylifesstyles.com') {
          priority = 1.0;
        } else if (/\/wellness-hub\/[^/]+$/.test(url) && !/\/wellness-hub$/.test(url)) {
          priority = 0.8;
        } else if (/\/tools\/[^/]+$/.test(url)) {
          priority = 0.8;
        } else if (/\/(author|wellness-hub|tools)$/.test(url)) {
          priority = 0.9;
        } else if (/\/(about|privacy|contact|terms|accessibility|editorial-policy|methodology|medical-disclaimer|cookie-policy|health-score|ai-assistant)$/.test(url)) {
          priority = 0.5;
        }
        // D8 / SD3 — NO lastmod: the integration only knows URLs, not real
        // per-page modification dates, and stamping the build timestamp on
        // every URL is fabricated freshness (the exact YMYL fingerprint the
        // date-integrity guard hunts). Omitted > invented.
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
            // adsbygoogle.push MUST be forwarded: AdSense loads in the Partytown
            // web worker (AdsLoader uses type="text/partytown"), but the per-slot
            // `(adsbygoogle=...).push({})` runs on the main thread. Without this
            // forward the push never reaches the worker and ads never fill.
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