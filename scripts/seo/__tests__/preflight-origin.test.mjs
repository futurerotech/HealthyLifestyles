// Release-candidate (staging mirror) versus production-promotion preflight scope.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolvePreflightOrigin } from '../../content/preflight.mjs';

const baseline = { cmsOrigin: 'https://cms.healthylifesstyles.com' };
const mirrors = JSON.parse(await readFile(new URL('../../content/staging-mirror.json', import.meta.url), 'utf8'));
const MIRROR = 'https://cms-qa.healthylifesstyles.com';

test('default is the production promotion gate', () => {
  assert.deepEqual(resolvePreflightOrigin({}, baseline, mirrors), { origin: baseline.cmsOrigin, scope: 'production-promotion', mirrorOrigin: null });
  assert.equal(resolvePreflightOrigin({ VERCEL_ENV: 'production', CMS_URL: baseline.cmsOrigin }, baseline, mirrors).scope, 'production-promotion');
});

test('an allowlisted mirror runs release-candidate acceptance, built from that same mirror', () => {
  const r = resolvePreflightOrigin({ HLS_PREFLIGHT_CMS_ORIGIN: MIRROR, CMS_URL: MIRROR + '/', VERCEL_ENV: 'preview' }, baseline, mirrors);
  assert.equal(r.scope, 'release-candidate (staging mirror)');
  assert.equal(r.mirrorOrigin, MIRROR);
});

test('a mirror can never stand in for production, and only allowlisted origins are accepted', () => {
  assert.throws(() => resolvePreflightOrigin({ HLS_PREFLIGHT_CMS_ORIGIN: MIRROR, CMS_URL: MIRROR, VERCEL_ENV: 'production' }, baseline, mirrors), /not allowed in a production build/);
  assert.throws(() => resolvePreflightOrigin({ HLS_PREFLIGHT_CMS_ORIGIN: 'https://evil.example', CMS_URL: 'https://evil.example' }, baseline, mirrors), /not an allowlisted/);
  assert.throws(() => resolvePreflightOrigin({ HLS_PREFLIGHT_CMS_ORIGIN: MIRROR + '/path', CMS_URL: MIRROR }, baseline, mirrors), /not an allowlisted/);
  assert.throws(() => resolvePreflightOrigin({ HLS_PREFLIGHT_CMS_ORIGIN: baseline.cmsOrigin, CMS_URL: baseline.cmsOrigin }, { cmsOrigin: baseline.cmsOrigin }, { mirrorOrigins: [baseline.cmsOrigin] }), /must differ/);
  assert.throws(() => resolvePreflightOrigin({ HLS_PREFLIGHT_CMS_ORIGIN: MIRROR, CMS_URL: baseline.cmsOrigin }, baseline, mirrors), /same staging mirror/);
  assert.throws(() => resolvePreflightOrigin({ HLS_PREFLIGHT_CMS_ORIGIN: MIRROR }, baseline, mirrors), /same staging mirror/);
  assert.ok(!mirrors.mirrorOrigins.includes(baseline.cmsOrigin));
});
