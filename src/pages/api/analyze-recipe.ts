import type { APIRoute } from 'astro';

export const prerender = false;

/** Same limit the CMS enforces; reject instead of silently truncating. */
export const MAX_RECIPE_CHARS = 5000;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();
    const { text, servings } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Please provide a recipe or ingredient list.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (text.trim().length > MAX_RECIPE_CHARS) {
      // Previously sliced to 5,000 characters, so long recipes were analyzed
      // incompletely without telling the user.
      return new Response(JSON.stringify({ error: `Recipe text is too long (max ${MAX_RECIPE_CHARS} characters). Remove the method steps or split the recipe.` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cmsUrl = import.meta.env.CMS_URL || 'http://localhost:3000';
    // Forward the visitor's address so the CMS per-IP rate limit applies per
    // visitor, not to this server's single IP (which every visitor shares).
    let visitor = '';
    try { visitor = clientAddress ?? ''; } catch { /* adapter without client address */ }

    const res = await fetch(`${cmsUrl}/api/analyze-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(visitor ? { 'X-Forwarded-For': visitor } : {}) },
      body: JSON.stringify({
        text: text.trim(),
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
