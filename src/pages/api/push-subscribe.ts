import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const sub = await request.json();
    const { endpoint, keys } = sub;

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid push subscription object.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cmsUrl = import.meta.env.CMS_URL || 'http://localhost:3000';
    const apiKey = import.meta.env.CMS_API_KEY || '';

    const res = await fetch(`${cmsUrl}/api/push-subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
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
