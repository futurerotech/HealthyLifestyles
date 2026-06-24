/**
 * Build-time ad config singleton.
 *
 * Fetches the Ad Management global from the Payload CMS once per build and
 * caches it. Falls back to static defaults if the CMS is unreachable.
 *
 * Usage (in any .astro frontmatter):
 *   import { getAdConfig } from '../lib/ad-config';
 *   const adConfig = await getAdConfig();
 */

import { getAdConfig as fetchFromCms, type AdConfig } from './cms';

let _config: AdConfig | null | undefined;

export async function getAdConfig(): Promise<AdConfig | null> {
  if (_config !== undefined) return _config;

  try {
    _config = await fetchFromCms();
  } catch {
    _config = null;
  }

  return _config;
}
