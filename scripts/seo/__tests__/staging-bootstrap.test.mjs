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

import { scanEmbedded, referencedMedia } from '../../content/staging-bootstrap-export.mjs';

test('embedded sensitive values in nested text fail closed (path and kind only, never the value)', () => {
  const text = { layout: [{ blockType: 'text', body: 'Write to jane.doe@example.org or call +1 (555) 010-2030.' }], note: 'Bearer abcdefghijklmnopqrstuvwxyz123456', ok: 'Contact hello@healthylifesstyles.com', date: '2026-11-15T10:00:00.000Z' };
  const f = scanEmbedded(text);
  assert.deepEqual(f.map((x) => `${x.path}:${x.kind}`).sort(), ['layout[0].body:email address', 'layout[0].body:phone number', 'note:bearer or JWT token']);
  assert.ok(!JSON.stringify(f).includes('jane.doe'));
  assert.throws(() => buildBundle({ cmsOrigin: 'x', capturedAt: 't', collections: { articles: [{ ...art, excerpt: 'mail jane@example.org' }] }, globals: {} }), /need review/);
});

test('findings name the record (collection, id, slug) for private CMS review, never the value', () => {
  const b = buildBundle({ cmsOrigin: 'https://cms.healthylifesstyles.com', capturedAt: 't', allowFindings: true, globals: {},
    collections: { articles: [art, { ...art, id: 28, slug: 'second', layout: [{ blockType: 'text', body: 'Call 555-010-2030 today' }] }] } });
  assert.deepEqual(b.findings, [{ path: 'collections.articles[1].layout[0].body', kind: 'phone number', record: { collection: 'articles', id: 28, slug: 'second' } }]);
  assert.ok(!JSON.stringify(b.findings).includes('010-2030'));
});

test('media rows are derived from populated references only, deduplicated', () => {
  const m = { id: 9, filename: 'a.png', mimeType: 'image/png', url: 'https://media/a.png', alt: 'A' };
  const media = referencedMedia({ articles: [{ id: 1, heroImage: m }, { id: 2, layout: [{ image: m }, { image: { id: 10, filename: 'b.png', mimeType: 'image/png' } }] }] });
  assert.deepEqual(media.map((x) => x.id), [9, 10]);
});

test('no false positives on public editorial fields: author credentials, numeric ranges, URLs', () => {
  assert.deepEqual(sanitize({ name: 'A', credential: 'RD, MPH' }).value, { name: 'A', credential: 'RD, MPH' });
  assert.deepEqual(sanitize({ credentials: { key: 'x' } }).dropped, ['credentials']);
  const ok = { a: 'Aim for 1,200–1,500 kcal or 150-300 minutes', b: 'https://pubmed.ncbi.nlm.nih.gov/123456789-2019-555', c: 'Doses: 400 600 800 mg', d: '2026-11-15' };
  assert.deepEqual(scanEmbedded(ok), []);
  assert.equal(scanEmbedded({ x: 'Call 555-010-2030' }).length, 1);
  assert.equal(scanEmbedded({ x: 'Tel +44 20 7946 0958' }).length, 1);
});

import { checksum } from '../../content/staging-bootstrap-export.mjs';

test('checksum is canonical and identical to the CMS importer (shared fixed vector)', () => {
  // Same vector as healthylifestyles-cms src/lib/staging-import.test.ts.
  assert.equal(checksum({ b: 2, a: [1, { d: 4, c: 3 }] }), 'b90ecf34c980b7ce791e11520e8f83c0c20ddbc78be1ff95bd85fb7708edb05a');
  const b = buildBundle({ cmsOrigin: 'https://cms.healthylifesstyles.com', capturedAt: 't', collections: { articles: [{ slug: 'x', id: 1, title: 'T' }] }, globals: {} });
  assert.equal(b.checksums['articles:1'], checksum({ id: 1, slug: 'x', title: 'T' }));
  assert.equal(b.scope, 'published public content only');
});
