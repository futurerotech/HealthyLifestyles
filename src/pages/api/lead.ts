import type { APIRoute } from 'astro';
import { getLeadGenConfig } from '../../lib/lead-config';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const cors = (origin: string) => ({
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  const origin = request.headers.get('origin') || '';

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  try {
    const body = await request.json();
    const { email, name, offer, tool, sourcePage } = body;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors(origin) },
      });
    }

    // Save to CMS subscribers collection
    const cmsUrl = import.meta.env.CMS_URL || 'http://localhost:3000';
    const apiKey = import.meta.env.CMS_API_KEY || '';
    const cmsHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) cmsHeaders['Authorization'] = `Bearer ${apiKey}`;

    fetch(`${cmsUrl}/api/subscribers`, {
      method: 'POST',
      headers: cmsHeaders,
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        name: name || undefined,
        source: 'web-form',
        metadata: { offer, tool, sourcePage },
      }),
    }).catch(() => { /* non-blocking */ });

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
    const leadConfig = await getLeadGenConfig();
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
    return new Response(JSON.stringify({ ok: false, error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors(origin) },
    });
  }
};
