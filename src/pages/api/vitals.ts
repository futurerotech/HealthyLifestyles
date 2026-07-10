/**
 * P15-P5c — RUM sink for Core Web Vitals (native, zero-SDK).
 *
 * Receives sendBeacon POSTs from src/components/WebVitals.astro and emits ONE
 * structured `[rum]` JSON line per pageview into the Vercel function logs —
 * country-segmented via the x-vercel-ip-country edge header, so Tier-1
 * (US/GB/CA/AU) p75 is computable from log queries/drains without any RUM
 * vendor. SD5: never throws, always 204 — telemetry must never hurt a user.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n >= 0 && n < 600_000 ? Math.round(n * 1000) / 1000 : null;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.text(); // sendBeacon ships text/plain
    const d = JSON.parse(raw || '{}') as Record<string, unknown>;
    const path = typeof d.path === 'string' ? d.path.slice(0, 200) : '';
    if (path.startsWith('/')) {
      console.log(
        '[rum]',
        JSON.stringify({
          t: new Date().toISOString(),
          country: request.headers.get('x-vercel-ip-country') || 'ZZ',
          path,
          lcp: num(d.lcp),
          cls: num(d.cls),
          inp: num(d.inp),
          nav: typeof d.nav === 'string' ? d.nav.slice(0, 20) : 'navigate',
        }),
      );
    }
  } catch {
    /* SD5 — malformed beacons are dropped silently */
  }
  return new Response(null, { status: 204 });
};
