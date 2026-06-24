import { getLeadGenConfig as fetchFromCms, type LeadGenConfig } from './cms';

let _config: LeadGenConfig | null | undefined;

export async function getLeadGenConfig(): Promise<LeadGenConfig | null> {
  if (_config !== undefined) return _config;

  try {
    _config = await fetchFromCms();
  } catch {
    _config = null;
  }

  return _config;
}
