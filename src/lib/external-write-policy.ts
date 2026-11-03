/** Only a verified Vercel production runtime may issue external mutations. */
export function externalWritesAllowed(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function externalWritesUnavailable(): Response {
  return Response.json({ ok: false, error: 'This service is unavailable in this environment.' }, { status: 503 });
}
