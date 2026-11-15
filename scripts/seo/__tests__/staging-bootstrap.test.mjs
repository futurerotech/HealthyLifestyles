// Staging bootstrap export: public published content only, IDs and relations kept, nothing private.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBundle, sanitize, COLLECTIONS, EXCLUDED_COLLECTIONS } from '../../content/staging-bootstrap-export.mjs';

const art = { id: 27, slug: 'how-to-read-your-hrv-trend', _status: 'published', title: 'HRV', primaryTool: { id: 65, slug: 'hrv-explainer-log' },
  author: { id: 3, slug: 'editorial-team', name: 'Editorial team' }, layout: [{ blockType: 'text', body: 'x' }, { blockType: 'toolEmbed', tool: { id: 65, slug: 'hrv-explainer-log' } }] };

test('keeps IDs, slugs and relations exactly', () => {
  const b = buildBundle({ cmsOrigin: 'https://cms.healthylifesstyles.com', capturedAt: 't', collections: { articles: [art] }, globals: {} });
  assert.deepEqual(b.collections.articles[0], art);
  assert.equal(b.counts.articles, 1);
  assert.match(b.checksums['articles:27'], /^[0-9a-f]{64}$/);
  assert.deepEqual(b.dropped, []);
});

test('drops secret-looking keys and email values, and reports what it dropped', () => {
  const g = { n8nWebhookUrl: 'https://hook', n8nApiKey: 'k', vapidPrivateKey: 'p', contactEmail: 'owner@example.com', siteName: 'HLS', nested: { authToken: 't', author: 'kept' } };
  const { value, dropped } = sanitize(g, 'global:lead-gen');
  assert.deepEqual(value, { siteName: 'HLS', nested: { author: 'kept' } });
  assert.deepEqual(dropped.sort(), ['global:lead-gen.contactEmail', 'global:lead-gen.n8nApiKey', 'global:lead-gen.n8nWebhookUrl', 'global:lead-gen.nested.authToken', 'global:lead-gen.vapidPrivateKey']);
});

test('refuses private collections, unknown globals and unpublished records', () => {
  for (const c of EXCLUDED_COLLECTIONS) {
    assert.ok(!COLLECTIONS.includes(c));
    assert.throws(() => buildBundle({ cmsOrigin: 'x', capturedAt: 't', collections: { [c]: [] }, globals: {} }), /not allowed/);
  }
  assert.throws(() => buildBundle({ cmsOrigin: 'x', capturedAt: 't', collections: {}, globals: { audience: {} } }), /not allowed/);
  assert.throws(() => buildBundle({ cmsOrigin: 'x', capturedAt: 't', collections: { articles: [{ ...art, _status: 'draft' }] }, globals: {} }), /not published/);
});
