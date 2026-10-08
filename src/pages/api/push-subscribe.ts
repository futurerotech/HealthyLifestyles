import type { APIRoute } from 'astro';
import { validPush } from '../../lib/subscription-api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.CMS_URL?.trim() || !import.meta.env.INTERNAL_API_KEY?.trim()) {
    return Response.json({ ok: false, message: 'Subscription service is unavailable.' }, { status: 503 });
  }

  try {
    const sub = await request.json().catch(() => null);
    if (!validPush(sub)) {
      return Response.json({ ok: false, message: 'Invalid subscription payload.' }, { status: 400 });
    }
    const { endpoint, keys } = sub;

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid push subscription object.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cmsUrl = import.meta.env.CMS_URL || 'http://localhost:3000';
    const apiKey = import.meta.env.INTERNAL_API_KEY || '';

    const res = await fetch(`${cmsUrl}/api/push-subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-internal-key': apiKey } : {}),
      },
      body: JSON.stringify({
        endpoint,
        authKey: keys.auth,
        p256dhKey: keys.p256dh,
        userAgent: request.headers.get('user-agent') || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'CMS error' }));
      return new Response(JSON.stringify({ ok: false, message: err.message || 'Failed to store push subscription' }), {
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
