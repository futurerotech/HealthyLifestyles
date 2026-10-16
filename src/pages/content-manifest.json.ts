import type { APIRoute } from 'astro';
import { getContentManifest } from '../lib/cms';

export const GET: APIRoute = async () => new Response(JSON.stringify(await getContentManifest()), {
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
});
