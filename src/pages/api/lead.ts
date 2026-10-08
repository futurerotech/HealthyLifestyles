import type { APIRoute } from 'astro';
import { validSubscriber } from '../../lib/subscription-api';
import { getLeadDeliveryConfig } from '../../lib/lead-config';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Strict allow-list. Reflecting `origin || '*'` is the reflected-origin
  // anti-pattern (the CMS subscriberSync endpoint warns about the same thing).
  const ALLOWED_ORIGINS = new Set<string>(
    [
      'https://www.healthylifesstyles.com',
      'http://localhost:4321',
      'http://localhost:3000',
    ].filter(Boolean),
  );
  const cors = (origin: string): Record<string, string> => {
    const h: Record<string, string> = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    if (ALLOWED_ORIGINS.has(origin)) h['Access-Control-Allow-Origin'] = origin;
    return h;
  };

  const origin = request.headers.get('origin') || '';

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (!import.meta.env.CMS_URL?.trim() || !import.meta.env.INTERNAL_API_KEY?.trim()) {
    return Response.json({ ok: false, error: 'Subscription service is unavailable.' }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!validSubscriber(body, true)) {
      return Response.json({ ok: false, error: 'Invalid subscription payload.' }, { status: 400, headers: cors(origin) });
    }
    const { email, name, offer, tool, sourcePage } = body;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }

    // Save to CMS subscribers collection
    const cmsUrl = import.meta.env.CMS_URL || 'http://localhost:3000';
    // The CMS Subscribers/Leads collections gate `create` on this shared secret
    // (header `x-internal-key`); it must equal the CMS's INTERNAL_API_KEY env.
    // (Previously sent `Authorization: Bearer` which the gate does not check.)
    const internalKey = import.meta.env.INTERNAL_API_KEY;
    const cmsHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (internalKey) cmsHeaders['x-internal-key'] = internalKey;

    const saved = await fetch(`${cmsUrl}/api/subscribers`, {
      method: 'POST',
      headers: cmsHeaders,
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        name: name || undefined,
        source: 'web-form',
        metadata: { offer, tool, sourcePage },
      }),
    });
    if (!saved.ok) throw new Error('CMS rejected subscription');

    // Build payload for n8n
    const payload = {
      email,
      name: name || '',
      offer: offer || '',
      tool: tool || '',
      sourcePage: sourcePage || '',
      submittedAt: new Date().toISOString(),
    };

    // Forward to n8n webhook if configured
    const leadConfig = await getLeadDeliveryConfig();
    const webhookUrl = leadConfig?.n8nWebhookUrl;

    if (webhookUrl) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (leadConfig?.n8nApiKey) {
        headers['Authorization'] = `Bearer ${leadConfig.n8nApiKey}`;
      }

      // Fire-and-forget: we don't block the response on n8n
      fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently ignore n8n failures — lead is still returned to user
      });
    }

    return new Response(JSON.stringify({ ok: true, message: 'Subscribed!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors(origin) },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Unable to save subscription. Please try again.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...cors(origin) },
    });
  }
};
