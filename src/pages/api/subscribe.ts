import type { APIRoute } from 'astro';
import { validSubscriber } from '../../lib/subscription-api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.CMS_URL?.trim() || !import.meta.env.INTERNAL_API_KEY?.trim()) {
    return Response.json({ ok: false, message: 'Subscription service is unavailable.' }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!validSubscriber(body)) {
      return Response.json({ ok: false, message: 'Invalid subscription payload.' }, { status: 400 });
    }
    const { email, name, interests, metadata, source } = body;

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
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        name: name || undefined,
        interests: interests || undefined,
        source: source || 'web-form',
        metadata: metadata || { sourcePage: request.headers.get('referer') || '' },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'CMS error' }));
      return new Response(JSON.stringify({ ok: false, message: err.message || 'Failed to subscribe' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
