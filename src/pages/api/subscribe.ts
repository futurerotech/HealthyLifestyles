import type { APIRoute } from 'astro';
import { isDuplicateEmail, validSubscriber } from '../../lib/subscription-api';

export const prerender = false;

// This route attests newsletter consent, so it accepts only the first-party browser Origin:
// a cross-site page must not be able to sign someone else up.
const ALLOWED_ORIGINS = new Set<string>(['https://www.healthylifesstyles.com']);

export const POST: APIRoute = async ({ request }) => {
  if (!ALLOWED_ORIGINS.has(request.headers.get('origin') || '')) {
    return Response.json({ ok: false, message: 'Origin not allowed.' }, { status: 403 });
  }
  if (!import.meta.env.CMS_URL?.trim() || !import.meta.env.INTERNAL_API_KEY?.trim()) {
    return Response.json({ ok: false, message: 'Subscription service is unavailable.' }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!validSubscriber(body)) {
      return Response.json({ ok: false, message: 'Invalid subscription payload.' }, { status: 400 });
    }
    // `source` from the browser is ignored: this route is the newsletter form, and only the
    // server decides what it attests.
    const { email, name, interests, metadata } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: false, message: 'Valid email is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cmsUrl = import.meta.env.CMS_URL || 'http://localhost:3000';
    const apiKey = import.meta.env.INTERNAL_API_KEY || '';

    const res = await fetch(`${cmsUrl}/api/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-internal-key': apiKey } : {}),
        // Trusted consent capture (CMS #66): the CMS records form-single-opt-in consent only
        // when this header arrives together with the internal key. It is never set from input.
        'x-consent-capture': 'newsletter-form-v1',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        name: name || undefined,
        interests: interests || undefined,
        source: 'web-form',
        metadata: metadata || { sourcePage: request.headers.get('referer') || '' },
      }),
    });

    if (!res.ok) {
      // An existing address gets the same answer as a new one (no status disclosure),
      // and upstream error text is never echoed to the browser.
      if (await isDuplicateEmail(res)) return Response.json({ ok: true }, { status: 200 });
      return Response.json({ ok: false, message: 'Unable to subscribe right now. Please try again.' }, { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Never echo internal error text (it can include upstream hosts or secrets).
    return Response.json({ ok: false, message: 'Unable to subscribe right now. Please try again.' }, { status: 502 });
  }
};
