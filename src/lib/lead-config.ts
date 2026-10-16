import { getLeadGenConfig as fetchFromCms, type LeadGenConfig } from './cms';

let _config: LeadGenConfig | null | undefined;

export interface LeadDeliveryConfig {
  n8nWebhookUrl: string;
  n8nApiKey?: string;
}

export async function getLeadGenConfig(): Promise<LeadGenConfig | null> {
  if (_config !== undefined) return _config;

  try {
    const config = await fetchFromCms();
    if (config) {
      const { n8nWebhookUrl: _url, n8nApiKey: _key, ...publicConfig } = config as LeadGenConfig & LeadDeliveryConfig;
      _config = publicConfig;
    } else {
      _config = null;
    }
  } catch {
    _config = null;
  }

  return _config;
}

/** Server-only n8n delivery credentials; never expose these in public config. */
export async function getLeadDeliveryConfig(): Promise<LeadDeliveryConfig | null> {
  const webhookUrl = import.meta.env.N8N_WEBHOOK_URL?.trim();
  const apiKey = import.meta.env.N8N_API_KEY?.trim();
  if (webhookUrl) return { n8nWebhookUrl: webhookUrl, ...(apiKey ? { n8nApiKey: apiKey } : {}) };

  const cmsUrl = import.meta.env.CMS_URL?.trim();
  const cmsApiKey = import.meta.env.CMS_API_KEY?.trim();
  if (!cmsUrl || !cmsApiKey) return null;
  try {
    const response = await fetch(`${cmsUrl.replace(/\/$/, '')}/api/globals/lead-gen?depth=0`, {
      headers: { Accept: 'application/json', Authorization: `users API-Key ${cmsApiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;
    const config = await response.json() as Partial<LeadDeliveryConfig>;
    if (typeof config.n8nWebhookUrl !== 'string' || !config.n8nWebhookUrl.trim()) return null;
    return {
      n8nWebhookUrl: config.n8nWebhookUrl.trim(),
      ...(typeof config.n8nApiKey === 'string' && config.n8nApiKey ? { n8nApiKey: config.n8nApiKey } : {}),
    };
  } catch {
    return null;
  }
}
