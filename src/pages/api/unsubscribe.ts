import type { APIRoute } from 'astro';

export const prerender = false;

// Proxies the signed unsubscribe token from the /unsubscribe page to the CMS. The token is
// the only credential; this route never sees or returns an email address.
const ALLOWED_ORIGINS = new Set<string>(['https://www.healthylifesstyles.com']);
const TOKEN = /^v1\.[A-Za-z0-9_-]{10,400}\.[A-Za-z0-9_-]{20,100}$/;
const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

export const POST: APIRoute = async ({ request }) => {
  if (!ALLOWED_ORIGINS.has(request.headers.get('origin') || '')) return json({ ok: false, message: 'Origin not allowed.' }, 403);
  const cmsUrl = import.meta.env.CMS_URL?.trim();
  if (!cmsUrl) return json({ ok: false, message: 'Unsubscribe is temporarily unavailable. Please try again later.' }, 503);
  const body = await request.json().catch(() => null);
  const token = body && typeof body === 'object' ? (body as { token?: unknown }).token : undefined;
  if (typeof token !== 'string' || !TOKEN.test(token)) {
    return json({ ok: false, message: 'This unsubscribe link is invalid or has expired.' }, 400);
  }
  try {
    const res = await fetch(`${cmsUrl.replace(/\/$/, '')}/api/subscribers/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.status === 200) return json({ ok: true, message: 'You are unsubscribed. You will not receive further newsletter emails.' }, 200);
    if (res.status === 400) return json({ ok: false, message: 'This unsubscribe link is invalid or has expired.' }, 400);
    return json({ ok: false, message: 'Unsubscribe is temporarily unavailable. Please try again later.' }, 503);
  } catch {
    return json({ ok: false, message: 'Unsubscribe is temporarily unavailable. Please try again later.' }, 503);
  }
};
