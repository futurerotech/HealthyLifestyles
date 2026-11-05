/**
 * Offline, no-OIDC contract for the ONE existing Protected Preview activation
 * workflow. This file NEVER connects to Vercel, GitHub, or the Preview.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const workflow = readFileSync(resolve(root, '.github/workflows/protected-preview-cdp-activation.yml'), 'utf8');
const markerPath = resolve(root, '.github/preview-cdp-activation.txt');

const PINS = Object.freeze({
  repository: 'futurerotech/HealthyLifestyles',
  branch: 'codex/protected-preview-cdp-trigger-20261105',
  marker: '.github/preview-cdp-activation.txt',
  message: 'activate: HLS protected-preview-cdp',
  previewUrl: 'https://healthy-lifestyles-6qxe0ldyl-healthy-lifestyles.vercel.app/',
  deploymentId: 'dpl_FkEKMnHXy1gKWpodmS4b7P6imFVb',
  previewSha: '90fd4d4d880827dd7ea6f7a69164b622e35e449e',
  reviewedRunnerSha: '07d4b20010dbdc676d2b52d7e1e46b2607a6ae08',
});

function hasLine(line) {
  assert.ok(workflow.split('\n').some(row => row.trim() === line),
    'Missing exact workflow line: ' + line);
}

test('activation stays limited to one marker on one isolated branch', () => {
  assert.match(workflow, /^on:\r?\n  push:\r?\n    branches:\r?\n      - codex\/protected-preview-cdp-trigger-20261105\r?\n    paths:\r?\n      - \.github\/preview-cdp-activation\.txt\r?\n/m);
  assert.doesNotMatch(workflow, /\bworkflow_dispatch\s*:/);
  assert.doesNotMatch(workflow, /\bpull_request\s*:/);
  assert.match(workflow, /^permissions:\r?\n  contents: read\r?\n/m);
  assert.match(workflow, /^      id-token: write$/m);
  hasLine("github.repository == 'futurerotech/HealthyLifestyles' &&");
  hasLine("github.ref == 'refs/heads/codex/protected-preview-cdp-trigger-20261105' &&");
  hasLine("github.actor == 'futurerotech' &&");
  hasLine("github.event.head_commit.message == 'activate: HLS protected-preview-cdp'");
  hasLine('test "$' + '{changed[0]}" = \'.github/preview-cdp-activation.txt\'');
  hasLine('test "$' + '{#changed[@]}" -eq 1');
});

test('preview destination remains immutable and never targets Production', () => {
  hasLine('HLS_PREVIEW_URL: ' + PINS.previewUrl);
  hasLine('HLS_PREVIEW_DEPLOYMENT_ID: ' + PINS.deploymentId);
  hasLine('HLS_PREVIEW_SHA: ' + PINS.previewSha);
  hasLine('HLS_APPROVAL: RUN_PREVIEW_CDP_READ_ONLY');
  // Reject executable YAML directives, not commentary mentioning blocked modes.
  assert.doesNotMatch(workflow, /^\s*workflow_dispatch\s*:/m);
  assert.doesNotMatch(workflow, /^\s*environment:\s*production\b/im);
  assert.doesNotMatch(workflow, /^\s*(?:run:\s*)?vercel\s+(?:deploy|promote)\b/im);
});

test('all THREE runner pins match the separately reviewed SHA', () => {
  const matches = workflow.match(/[a-f0-9]{40}/g) || [];
  const runner = matches.filter(s => s === PINS.reviewedRunnerSha);
  assert.equal(runner.length, 3, 'Controller SHA must appear exactly three times');
  hasLine('HLS_RUNNER_REVIEWED_SHA: ' + PINS.reviewedRunnerSha);
  hasLine('ref: ' + PINS.reviewedRunnerSha);
  assert.match(workflow, new RegExp('RUNNER_SHA=' + PINS.reviewedRunnerSha + "'"));
  assert.ok(!workflow.includes('19c4a4fa064b4dc57c26c40d7a28356444079189'),
    'Old reviewed-runner SHA must not remain in the activation workflow');
  hasLine('test "$(git rev-parse HEAD)" = "$HLS_RUNNER_REVIEWED_SHA"');
});

test('previously consumed activation marker is absent or cannot be replayed', () => {
  const expected = [
    'EXPLICIT_OWNER_APPROVED_READ_ONLY_CDP_V1',
    'DEPLOYMENT=' + PINS.deploymentId,
    'PREVIEW_SHA=' + PINS.previewSha,
    'RUNNER_SHA=' + PINS.reviewedRunnerSha,
  ].join('\n');
  if (existsSync(markerPath)) {
    const actual = readFileSync(markerPath, 'utf8').trim();
    assert.notEqual(actual, expected,
      'Existing consumed marker must not authorize another live run');
  }
  assert.match(workflow, /test "\$\(cat \.github\/preview-cdp-activation\.txt\)" = "\$expected"/);
});

test('the exact reviewed controller is checked out without persistent Git credentials', () => {
  assert.match(workflow, /Checkout exact reviewed controller \(not the activation commit\)[\s\S]*?\n          ref: 07d4b20010dbdc676d2b52d7e1e46b2607a6ae08\n          path: runner\n          persist-credentials: false/);
  assert.match(workflow, /Install reviewed frozen deps with no lifecycle scripts[\s\S]*?\n        run: npm ci --ignore-scripts --no-audit --no-fund/);
  assert.match(workflow, /Verify offline OIDC and request-isolation policies[\s\S]*?node scripts\/seo\/protected-preview-cdp\.mjs --self-test[\s\S]*?node scripts\/seo\/run-protected-preview-gh-oidc\.mjs --self-test/);
});

console.log('OFFLINE_ONLY: Protected Preview activation contract assertions; no OIDC request, HTTP call, or Chrome navigation.');
