/**
 * Build-time ad config singleton.
 *
 * Fetches the Ad Management global from the Payload CMS once per build and
 * caches it. Throws hard if the CMS fetch fails — the build must abort rather
 * than silently deploy an ad-free site (cms.ts owns the throw).
 *
 * Usage (in any .astro frontmatter):
 *   import { getAdConfig } from '../lib/ad-config';
 *   const adConfig = await getAdConfig();
 */

import { getAdConfig as fetchFromCms, type AdConfig } from './cms';

let _config: AdConfig | null | undefined;

export async function getAdConfig(): Promise<AdConfig | null> {
  if (_config !== undefined) return _config;

  // No try/catch here on purpose: cms.ts now throws hard when the AdManagement
  // fetch fails, and that throw MUST propagate so the build aborts instead of
  // silently deploying an ad-free site. (null is still returned when the CMS
  // is intentionally disabled via CMS_DISABLE=1.)
  _config = await fetchFromCms();

  return _config;
}
