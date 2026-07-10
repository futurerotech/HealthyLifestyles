/**
 * IndexNow ownership-proof key file (Phase 14, P1).
 *
 * Serves {CANONICAL_ORIGIN}/<key>.txt containing only the key — the IndexNow
 * standard's ownership check (this file is public BY DESIGN; the "secret" is
 * merely proof we control the host). The key value comes from the
 * INDEXNOW_API_KEY env var AT BUILD TIME and is never a literal in committed
 * source. When the env var is missing or malformed the route emits NOTHING and
 * the build still succeeds (the CMS side skips pings without a key, so the
 * pair degrades together).
 */
import type { APIRoute } from 'astro';

const KEY = (process.env.INDEXNOW_API_KEY || '').trim();
const VALID = /^[a-f0-9]{32}$/i.test(KEY);

export function getStaticPaths() {
  if (!VALID) {
    if (KEY) console.warn('[indexnow] INDEXNOW_API_KEY is set but not 32-char hex — key file NOT emitted.');
    return [];
  }
  return [{ params: { key: KEY } }];
}

export const GET: APIRoute = () =>
  new Response(KEY, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
