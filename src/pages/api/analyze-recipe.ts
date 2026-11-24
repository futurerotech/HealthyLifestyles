import type { APIRoute } from 'astro';
import { upstreamFailure, validateRecipeRequest, verifyRecipeResponse } from '../../lib/recipeAnalysis';

export const prerender = false;

const MAX_REQUEST_BYTES = 12_000;
const MAX_RESPONSE_CHARS = 800_000;
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), { status, headers: HEADERS });

/**
 * Only send explicit recipe text and an integer serving count to the CMS.
 * The CMS forwards text to its configured third-party AI parsing service and
 * ingredient lookup names to USDA. Do not log or cache sensitive recipe data.
 *
 * This is a FRONTEND proxy guard, not a replacement for the separate Payload
 * parser/USDA implementation. Mask missing values before showing results.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? ''))
    return json({ error: 'Send a JSON recipe request.' }, 415);
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_REQUEST_BYTES)
    return json({ error: 'Recipe request exceeds the allowed size.' }, 413);

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_REQUEST_BYTES)
      return json({ error: 'Recipe request exceeds the allowed size.' }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON recipe request.' }, 400);
  }
  const checked = validateRecipeRequest(body);
  if (!checked.ok) return json({ error: checked.error }, 400);

  // No localhost fallback on a production deployment. Fail closed if CMS_URL
  // is missing; preserve local dev's existing localhost behavior.
  const cmsUrl = import.meta.env.CMS_URL ||
    (!import.meta.env.PROD ? 'http://localhost:3000' : '');
  if (!cmsUrl) return json({ error: 'Recipe analysis is unavailable.' }, 503);

  try {
    const endpoint = new URL('/api/analyze-recipe', cmsUrl);
    if (!['http:', 'https:'].includes(endpoint.protocol))
      return json({ error: 'Recipe analysis is unavailable.' }, 503);

    // Forward the visitor's address so the CMS per-IP rate limit applies per
    // visitor, not to this server's single IP (which every visitor shares).
    let visitor = '';
    try { visitor = clientAddress ?? ''; } catch { /* adapter without client address */ }
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(visitor ? { 'X-Forwarded-For': visitor } : {}) },
      body: JSON.stringify(checked.value),
      signal: AbortSignal.timeout(90_000),
      cache: 'no-store',
      redirect: 'error',
    });
    if (!upstream.ok) {
      const failure = upstreamFailure(upstream.status);
      return json({ error: failure.error }, failure.status);
    }

    const raw = await upstream.text();
    if (raw.length > MAX_RESPONSE_CHARS)
      return json({ error: 'The nutrition result exceeded the safe response size.' }, 502);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { return json({ error: 'The nutrition result was not valid JSON.' }, 502); }

    let verified;
    try { verified = verifyRecipeResponse(parsed, checked.value.servings); }
    catch {
      return json({ error: 'Nutrition values could not be verified for display. No totals were shown.' }, 502);
    }
    return json(verified, 200);
  } catch {
    // Avoid forwarding upstream exception text, recipe body or provider secrets.
    return json({ error: 'Recipe analysis is temporarily unavailable. Try again later.' }, 502);
  }
};
