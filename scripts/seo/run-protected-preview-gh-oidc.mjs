/**
 * GitHub Actions OIDC launcher for the already reviewed protected Preview CDP gate.
 * Only executable from a manually approved, main-branch workflow_dispatch.
 * NEVER logs or saves the short-lived ID token. This file does NOT add any
 * Vercel Trusted Source and is inert until one is separately authorized.
 */
import assert from 'node:assert/strict';

export const PINS = Object.freeze({
  repository: 'futurerotech/HealthyLifestyles',
  workflowRef: 'futurerotech/HealthyLifestyles/.github/workflows/protected-preview-cdp.yml@refs/heads/main',
  approval: 'RUN_PREVIEW_CDP_READ_ONLY',
  origin: 'https://healthy-lifestyles-6qxe0ldyl-healthy-lifestyles.vercel.app/',
  deploymentId: 'dpl_FkEKMnHXy1gKWpodmS4b7P6imFVb',
  previewSha: '90fd4d4d880827dd7ea6f7a69164b622e35e449e',
});

export function validateContext(e) {
  assert.equal(e.GITHUB_ACTIONS, 'true', 'Only an authorized GitHub Actions job may run');
  assert.equal(e.GITHUB_REPOSITORY, PINS.repository, 'Unexpected repository');
  assert.equal(e.GITHUB_EVENT_NAME, 'workflow_dispatch', 'No automatic trigger allowed');
  assert.equal(e.GITHUB_REF, 'refs/heads/main', 'Dispatch must originate from main workflow');
  assert.equal(e.GITHUB_WORKFLOW_REF, PINS.workflowRef, 'Unexpected workflow identity');
  assert.equal(e.GITHUB_ACTOR?.toLowerCase(), 'futurerotech', 'Manual dispatch must be the owner');
  assert.equal(e.HLS_APPROVAL, PINS.approval, 'Explicit read-only approval missing');
  assert.equal(e.HLS_PREVIEW_URL, PINS.origin, 'Pinned Preview host changed');
  assert.equal(e.HLS_PREVIEW_SHA, PINS.previewSha, 'Pinned Preview commit changed');
  assert.equal(e.HLS_PREVIEW_DEPLOYMENT_ID, PINS.deploymentId, 'Pinned Preview ID changed');
  assert.match(e.HLS_RUNNER_REVIEWED_SHA || '', /^[a-f0-9]{40}$/, 'Exact reviewed runner SHA is required');
  assert.ok(e.ACTIONS_ID_TOKEN_REQUEST_TOKEN, 'GitHub OIDC request credential unavailable');
  let url;
  try { url = new URL(e.ACTIONS_ID_TOKEN_REQUEST_URL || ''); }
  catch { throw new Error('GitHub OIDC request endpoint unavailable'); }
  assert.equal(url.protocol, 'https:', 'OIDC request must be HTTPS');
  assert.match(url.hostname, /(^|\.)actions\.githubusercontent\.com$/,
    'OIDC request endpoint must belong to GitHub Actions');
  return url;
}

export function policySelfTest() {
  const values = {
    GITHUB_ACTIONS: 'true',
    GITHUB_REPOSITORY: PINS.repository,
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REF: 'refs/heads/main',
    GITHUB_WORKFLOW_REF: PINS.workflowRef,
    GITHUB_ACTOR: 'futurerotech',
    HLS_APPROVAL: PINS.approval,
    HLS_PREVIEW_URL: PINS.origin,
    HLS_PREVIEW_SHA: PINS.previewSha,
    HLS_PREVIEW_DEPLOYMENT_ID: PINS.deploymentId,
    HLS_RUNNER_REVIEWED_SHA: 'a'.repeat(40),
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://pipelines.actions.githubusercontent.com/example?token=redacted',
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'offline-fake',
  };
  validateContext(values);
  for (const [key, bad] of [
    ['GITHUB_REPOSITORY', 'other/repository'],
    ['GITHUB_EVENT_NAME', 'push'],
    ['GITHUB_REF', 'refs/heads/dev'],
    ['GITHUB_WORKFLOW_REF', 'other/workflow'],
    ['GITHUB_ACTOR', 'attacker'],
    ['HLS_APPROVAL', 'NO'],
    ['HLS_PREVIEW_URL', 'https://www.healthylifesstyles.com/'],
    ['HLS_PREVIEW_SHA', 'b'.repeat(40)],
    ['HLS_PREVIEW_DEPLOYMENT_ID', 'dpl_wrong'],
    ['HLS_RUNNER_REVIEWED_SHA', 'not-a-sha'],
    ['ACTIONS_ID_TOKEN_REQUEST_URL', 'http://pipelines.actions.githubusercontent.com/'],
    ['ACTIONS_ID_TOKEN_REQUEST_TOKEN', ''],
  ]) assert.throws(() => validateContext({ ...values, [key]: bad }), 'Must reject ' + key);
  console.log('PASS offline GitHub OIDC dispatch policy: owner, workflow, branch, exact Preview pins, HTTPS issuer');
}

async function main() {
  const tokenUrl = validateContext(process.env);
  const response = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error('OIDC issuer rejected request (HTTP ' + response.status + ')');
  const data = await response.json();
  assert.match(data?.value || '', /^[\w-]+\.[\w-]+\.[\w-]+$/,
    'GitHub did not return a short-lived JWT');
  try {
    process.env.VERCEL_OIDC_TOKEN = data.value;
    // This child script filters auth headers to exact Preview origin and denies writes.
    await import('./protected-preview-cdp.mjs');
  } finally {
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  }
}

if (process.argv.includes('--self-test')) policySelfTest();
else await main();
