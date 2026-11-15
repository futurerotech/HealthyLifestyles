// Shared server-side validation for the three subscription entry points.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function optionalText(value: unknown, max = 200): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value));
}

export function validEmail(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 254) return false;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.split('@')[0].length <= 64 && !/[\u0000-\u001f\u007f]/.test(email);
}

export function validSubscriber(value: unknown, lead = false): value is Record<string, any> {
  if (!isRecord(value) || !validEmail(value.email) || !optionalText(value.name)) return false;
  if (lead) return optionalText(value.offer) && optionalText(value.tool) && optionalText(value.sourcePage, 2048);
  return optionalText(value.source) &&
    (value.interests === undefined || (Array.isArray(value.interests) && value.interests.length <= 50 && value.interests.every(item => typeof item === 'string' && optionalText(item, 100)))) &&
    (value.metadata === undefined || (isRecord(value.metadata) && JSON.stringify(value.metadata).length <= 4096));
}

/**
 * True when the CMS rejected a create only because the email already exists (unique
 * index). Callers answer exactly as for a new signup, so the form never reveals whether
 * an address is subscribed or unsubscribed, and they never forward the address again.
 * An existing record keeps its unsubscribedAt suppression.
 */
export async function isDuplicateEmail(res: Response): Promise<boolean> {
  if (res.status !== 400 && res.status !== 409) return false;
  const text = await res.clone().text().catch(() => '');
  return /\bunique\b|already (?:exists|registered)|duplicate/i.test(text);
}

export function validPush(value: unknown): value is { endpoint: string; keys: { auth: string; p256dh: string } } {
  if (!isRecord(value) || typeof value.endpoint !== 'string' || value.endpoint.length > 2048 || !isRecord(value.keys)) return false;
  try {
    const url = new URL(value.endpoint);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
  } catch { return false; }
  return typeof value.keys.auth === 'string' && /^[A-Za-z0-9_-]{22}={0,2}$/.test(value.keys.auth) &&
    typeof value.keys.p256dh === 'string' && /^[A-Za-z0-9_-]{87}=?$/.test(value.keys.p256dh);
}
