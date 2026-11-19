import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Exercise the REAL built-output validator, not a separately reimplemented rule.
// All fixtures are temporary; no site files, CMS records or production data change.
const scanner = fileURLToPath(new URL('../validate-jsonld.ts', import.meta.url));
const org = 'https://www.healthylifesstyles.com/#org';

function scan(schema: Record<string, unknown>): { status: number | null; output: string } {
  const root = mkdtempSync(join(tmpdir(), 'hls-jsonld-review-'));
  try {
    const dist = join(root, 'dist', 'client');
    mkdirSync(dist, { recursive: true });
    writeFileSync(join(dist, 'index.html'),
      '<!doctype html><html><head><script type="application/ld+json">' +
      JSON.stringify(schema) + '</script></head><body><main>Real content</main></body></html>');
    const result = spawnSync(process.execPath, [scanner], {
      cwd: root, encoding: 'utf8', timeout: 15000,
    });
    return { status: result.status, output: (result.stdout || '') + (result.stderr || '') };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const base = {
  '@context': 'https://schema.org',
  '@type': ['MedicalWebPage', 'Article'],
  '@id': 'https://www.healthylifesstyles.com/wellness-hub/example',
  author: { '@type': 'Organization', '@id': org, name: 'Editorial Team' },
  publisher: { '@id': org },
};

test('medical pages with no documented review do not require invented reviewer or review date', () => {
  const result = scan(base);
  assert.equal(result.status, 0, result.output);
});

test('explicit identified reviewer and real ISO review date remain valid', () => {
  const result = scan({
    ...base,
    reviewedBy: { '@type': 'Person', '@id': 'https://www.healthylifesstyles.com/author/real-reviewer', name: 'Real Reviewer' },
    lastReviewed: '2026-11-01',
  });
  assert.equal(result.status, 0, result.output);
});

test('reviewedBy with no name or id remains a blocking attribution defect', () => {
  const result = scan({ ...base, reviewedBy: {} });
  assert.equal(result.status, 1);
  assert.match(result.output, /ymyl-invalid-reviewer/);
});

test('empty reviewer array remains a blocking attribution defect', () => {
  const result = scan({ ...base, reviewedBy: [] });
  assert.equal(result.status, 1);
  assert.match(result.output, /ymyl-invalid-reviewer/);
});

test('self-attributed review remains a blocking trust defect', () => {
  const result = scan({ ...base, reviewedBy: { '@id': org, name: 'Editorial Team' } });
  assert.equal(result.status, 1);
  assert.match(result.output, /ymyl-self-review/);
});

test('invalid lastReviewed is blocked rather than fabricated from update dates', () => {
  const result = scan({ ...base, lastReviewed: 'recently' });
  assert.equal(result.status, 1);
  assert.match(result.output, /ymyl-invalid-last-reviewed/);
});

test('valid ISO lastReviewed datetime is accepted when genuinely present', () => {
  const result = scan({ ...base, lastReviewed: '2026-11-01T14:00:00Z' });
  assert.equal(result.status, 0, result.output);
});

test('existing YMYL author guard remains blocking', () => {
  const result = scan({ ...base, author: undefined });
  assert.equal(result.status, 1);
  assert.match(result.output, /ymyl-missing-author/);
});

test('existing FAQPage guard remains blocking when questions are absent', () => {
  const result = scan({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] });
  assert.equal(result.status, 1);
  assert.match(result.output, /faqpage-empty/);
});
