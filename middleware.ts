/**
 * Vercel Routing Middleware for removed WordPress/arcade URLs.
 *
 * Astro middleware in src/middleware.ts may not execute for statically
 * prerendered routes. Vercel Routing Middleware runs before static routing.
 * Only legacy URL families match, so there is no effect on live tools/pages.
 */
export const config = {
  matcher: [
    '/game',
    '/game/:path*',
    '/games',
    '/games/:path*',
    '/index.php',
    '/index.php/:path*',
    '/wp-content',
    '/wp-content/:path*',
    '/wp-admin',
    '/wp-admin/:path*',
    '/wp-includes',
    '/wp-includes/:path*',
    '/category',
    '/category/:path*',
    '/tag',
    '/tag/:path*',
  ],
};

export default function middleware(_request: Request): Response {
  return new Response('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
