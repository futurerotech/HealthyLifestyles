// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { partytownSnippet } from '@builder.io/partytown/integration';
import { copyLibFiles } from '@builder.io/partytown/utils';
import * as path from 'path';
import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';
import { buildRedirects, fetchRedirectSnapshot } from './scripts/seo/redirects.mjs';
import sitemapPolicy from './scripts/seo/sitemap-policy.mjs';

// ✅ correct domain
export const SITE_URL = 'https://www.healthylifesstyles.com';
const buildStartedAt = new Date().toISOString();

await copyLibFiles(path.resolve('public', '~partytown'));
const env = { ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''), ...process.env };
const redirectSnapshot = await fetchRedirectSnapshot(env);
/** @type {{ source: string, destination: string, permanent: boolean }[]} */
const localRedirects = JSON.parse(readFileSync('vercel.json', 'utf8')).redirects || [];

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  redirects: buildRedirects(redirectSnapshot || [], env.CMS_DISABLE === '1' ? localRedirects.filter((r) => r.source.startsWith('/tools/')) : localRedirects),
  integrations: [
    preact({ compat: true }),
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/content-manifest.json') &&
        !localRedirects.some((r) => new URL(page).pathname === r.source) &&
        !(redirectSnapshot || []).some((r) => new URL(page).pathname === r.from) &&
        !page.includes('/og/') &&
        !page.includes('/embed/'),
      changefreq: 'weekly',
      // P16 — hreflang in the sitemap too (head already emits it via SEO.astro).
      // The integration annotates xhtml:link alternates only for URLs whose
      // locale-prefixed counterparts actually exist in the build — so with zero
      // translations today this is a no-op, and it activates automatically when
      // real /es/ or /ar/ pages ship (no empty-shell URLs are ever invented).
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', ar: 'ar' },
      },
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
    sitemapPolicy(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  vite: {
    define: { __CMS_REDIRECT_SNAPSHOT__: JSON.stringify(redirectSnapshot), __CMS_BUILD_STARTED_AT__: JSON.stringify(buildStartedAt) },
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
