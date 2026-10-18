import { defineMiddleware } from 'astro:middleware';

const LEGACY_PATH = /^\/(?:games?(?:\/|$)|index\.php(?:\/|$)|wp-(?:content|admin|includes)(?:\/|$)|category(?:\/|$)|tag(?:\/|$))/i;
const CANONICAL_HOST = 'www.healthylifesstyles.com';

export const onRequest = defineMiddleware(({ request }, next) => {
  const url = new URL(request.url);
  // Host normalization must precede other responses; one redirect straight to HTTPS/www.
  if (url.hostname === 'healthylifesstyles.com' || (url.hostname === CANONICAL_HOST && url.protocol === 'http:')) {
    url.hostname = CANONICAL_HOST;
    url.protocol = 'https:';
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }
  if (LEGACY_PATH.test(url.pathname)) {
    return new Response('Gone', {
      status: 410,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  return next();
});
