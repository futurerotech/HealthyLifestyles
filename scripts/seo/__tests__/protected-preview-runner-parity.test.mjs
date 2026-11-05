/**
 * Static, local-only contract for the exact runner checked out by Verify.
 * No HTTP requests, OIDC token minting, browser navigation, or secrets.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const runnerRoot = resolve(root, '.ci-reviewed-controller');
const read = path => readFileSync(resolve(root, path), 'utf8');
const readPinned = path => readFileSync(resolve(runnerRoot, path), 'utf8');
const workflow = read('.github/workflows/protected-preview-cdp-activation.yml');
const launcher = readPinned('scripts/seo/run-protected-preview-gh-oidc.mjs');
const controller = readPinned('scripts/seo/protected-preview-cdp.mjs');
const localFixture = read('scripts/seo/article-calculator-browser-proof.mjs');

const PIN = Object.freeze({
  sha: 'e46c09e44105fb4e0e10a6174dfd606e0f545a11',
  repo: 'futurerotech/HealthyLifestyles',
  branch: 'codex/protected-preview-cdp-trigger-20261105',
  workflow: '.github/workflows/protected-preview-cdp-activation.yml',
  url: 'https://healthy-lifestyles-6qxe0ldyl-healthy-lifestyles.vercel.app/',
  deployment: 'dpl_FkEKMnHXy1gKWpodmS4b7P6imFVb',
  previewSha: '90fd4d4d880827dd7ea6f7a69164b622e35e449e',
});

test('actual pinned launcher uses the same owner-only push identity as activation YAML', () => {
  assert.match(workflow, /^on:\r?\n  push:\r?\n    branches:\r?\n      - codex\/protected-preview-cdp-trigger-20261105\r?\n    paths:\r?\n      - \.github\/preview-cdp-activation\.txt\r?\n/m);
  assert.ok(launcher.includes("workflowRef: '" + PIN.repo + '/' + PIN.workflow +
    '@refs/heads/' + PIN.branch + "'"), 'Pinned launcher workflow identity mismatch');
  assert.match(launcher, /assert\.equal\(e\.GITHUB_EVENT_NAME,\s*'push'/,
    'Pinned launcher does not accept a push event');
  assert.doesNotMatch(launcher, /assert\.equal\(e\.GITHUB_EVENT_NAME,\s*'workflow_dispatch'/,
    'Pinned launcher incorrectly requires workflow_dispatch');
  assert.ok(launcher.includes("assert.equal(e.GITHUB_REF, 'refs/heads/" + PIN.branch + "'"),
    'Pinned launcher requires wrong branch');
  assert.match(launcher, /assert\.equal\(e\.GITHUB_WORKFLOW_REF,\s*PINS\.workflowRef/);
  assert.match(launcher, /assert\.equal\(e\.GITHUB_ACTOR\?\.toLowerCase\(\),\s*'futurerotech'/);
  assert.ok(workflow.includes('HLS_RUNNER_REVIEWED_SHA: ' + PIN.sha));
  assert.ok(workflow.includes('ref: ' + PIN.sha));
});

test('pinned launcher and workflow agree on immutable protected Preview', () => {
  assert.ok(launcher.includes("origin: '" + PIN.url + "'"));
  assert.ok(launcher.includes("deploymentId: '" + PIN.deployment + "'"));
  assert.ok(launcher.includes("previewSha: '" + PIN.previewSha + "'"));
  assert.ok(workflow.includes('HLS_PREVIEW_URL: ' + PIN.url));
  assert.ok(workflow.includes('HLS_PREVIEW_DEPLOYMENT_ID: ' + PIN.deployment));
  assert.ok(workflow.includes('HLS_PREVIEW_SHA: ' + PIN.previewSha));
  assert.match(workflow, /^      id-token: write$/m);
});

test('both tested article cases match genuine local Chrome fixture tool and input', () => {
  const cases = [
    { slug: 'calories-burned-calculator-guide', tool: 'bmi-calculator', field: 'weight' },
    { slug: 'how-many-calories-to-lose-weight', tool: 'body-fat-calculator', field: 'waist' },
  ];
  for (const entry of cases) {
    const a = "slug: '" + entry.slug + "', tool: '" + entry.tool +
      "', field: '" + entry.field + "'";
    const b = "article: '" + entry.slug + "', slug: '" + entry.tool +
      "', field: '" + entry.field + "'";
    assert.ok(controller.includes(a), 'Hosted runner field/tool mismatch: ' + entry.slug);
    assert.ok(localFixture.includes(b), 'Local Chrome fixture mismatch: ' + entry.slug);
  }
  assert.match(controller, /const expectedFieldId = 'calc-' \+ article.tool \+ '-' \+ article.field;/);
  assert.match(controller, /assert\.equal\(data\.embedTool,\s*article\.tool,/);
});

test('pinned runner preserves the zero-box fix and refuses mutation requests', () => {
  assert.match(controller, /function viewportExposureExpression\(\)/);
  assert.match(controller, /root\.scrollIntoView\(/);
  assert.doesNotMatch(controller, /i\.scrollIntoView\(/);
  assert.match(controller, /const WRITE = new Set\(\['POST', 'PUT', 'PATCH', 'DELETE'\]\)/);
  assert.match(controller, /delete process\.env\.VERCEL_OIDC_TOKEN/);
  assert.match(controller, /delete process\.env\.ACTIONS_ID_TOKEN_REQUEST_TOKEN/);
  assert.match(controller, /Fetch\.enable/);
  assert.match(controller, /const scrolled = await cdp\.evaluate\(viewportExposureExpression\(\)\)/);
});

console.log('OFFLINE_ONLY: checked-out runner and activation workflow agree on GitHub push, Preview pins and fixture fields.');
