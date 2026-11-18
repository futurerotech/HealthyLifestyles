import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../orphan-check.ts', import.meta.url));

function withFixture({ broken = false, spam = false, href } = {}, run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-link-integrity-'));
  const output = path.join(root, 'dist', 'client');
  const addPage = (route, html) => {
    const file = route === '/'
      ? path.join(output, 'index.html')
      : path.join(output, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  };
  try {
    addPage('/', '<a href="/tools/example">Start</a>');
    const toolHref = href ?? (broken ? '/nonexistent' : spam ? '/game/spam' : '/about');
    addPage('/tools/example', '<a href="' + toolHref + '">Destination</a>');
    addPage('/about', '<main>Available page</main>');
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function audit(cwd, strict) {
  return spawnSync(process.execPath, [
    script,
    ...(strict ? ['--strict-dead-links'] : []),
  ], { cwd, encoding: 'utf8', timeout: 10000 });
}

// This project's link audit is fail-closed: a dead internal link always fails,
// with or without the --strict-dead-links flag used by PR #64's review workflow.
for (const strict of [false, true]) {
  test(`link audit rejects broken internal routes (strict flag: ${strict})`, () =>
    withFixture({ broken: true }, (root) => {
      const result = audit(root, strict);
      assert.equal(result.error, undefined);
      assert.equal(result.status, 1, result.stderr || result.stdout);
      assert.match(result.stdout, /Dead internal links: 1/);
      assert.match(result.stdout, /FAIL: dead internal links found/);
      assert.doesNotMatch(result.stdout, /WARN: dead internal links/);
    }));
}

test('strict link audit accepts real build targets and zero orphan pages', () =>
  withFixture({}, (root) => {
    const result = audit(root, true);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Dead internal links: 0/);
    assert.match(result.stdout, /Orphans: 0/);
    assert.match(result.stdout, /Spam \(\/game\/\) links: 0/);
  }));

test('existing spam-link block remains effective in default mode', () =>
  withFixture({ spam: true }, (root) => {
    const result = audit(root, false);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(result.stdout, /Spam \(\/game\/\) links: 1/);
  }));

test('strict mode detects broken same-site absolute links, including query and hash', () =>
  withFixture({ href: 'https://www.healthylifesstyles.com/nonexistent?utm=1#part' }, (root) => {
    const result = audit(root, true);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(result.stdout, /Dead internal links: 1/);
  }));

test('strict mode resolves same-site protocol-relative and apex links', () => {
  for (const href of [
    '//www.healthylifesstyles.com/nonexistent',
    'https://healthylifesstyles.com/nonexistent',
  ]) {
    withFixture({ href }, (root) => {
      const result = audit(root, true);
      assert.equal(result.error, undefined);
      assert.equal(result.status, 1, href + ': ' + (result.stderr || result.stdout));
      assert.match(result.stdout, /Dead internal links: 1/);
    });
  }
});

test('offsite absolute and protocol-relative links are not misreported as internal', () => {
  for (const href of [
    'https://www.example.org/nonexistent',
    '//www.example.org/nonexistent',
    'https://www.healthylifesstyles.com.evil.example/nonexistent',
  ]) {
    withFixture({ href }, (root) => {
      const result = audit(root, true);
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, href + ': ' + (result.stderr || result.stdout));
      assert.match(result.stdout, /Dead internal links: 0/);
    });
  }
});
