import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { text, servings } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Please provide a recipe or ingredient list.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cmsUrl = import.meta.env.CMS_URL || 'http://localhost:3000';

    const res = await fetch(`${cmsUrl}/api/analyze-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim().slice(0, 5000),
        servings: Math.max(1, Math.min(100, Number(servings) || 1)),
      }),
    });

    const data = await res.json().catch(() => ({ error: 'CMS returned an invalid response.' }));

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to analyze recipe. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
