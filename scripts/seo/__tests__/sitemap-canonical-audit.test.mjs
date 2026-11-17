import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditBuiltSitemap } from '../sitemap-canonical-audit.mjs';

const origin = 'https://www.healthylifesstyles.com';
const xmlLoc = (url) => '<loc>' + url + '</loc>';

function withBuild(pages, run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-sitemap-canonical-'));
  try {
    fs.writeFileSync(path.join(root, 'sitemap-index.xml'),
      '<sitemapindex><sitemap>' + xmlLoc(origin + '/sitemap-0.xml') + '</sitemap></sitemapindex>');
    fs.writeFileSync(path.join(root, 'sitemap-0.xml'),
      '<urlset>' + pages.map(page => '<url>' + xmlLoc(page.url) + '</url>').join('') + '</urlset>');
    for (const page of pages) {
      if (page.noFile) continue;
      const rel = new URL(page.url).pathname.slice(1);
      const dir = rel ? path.join(root, rel) : root;
      fs.mkdirSync(dir, { recursive: true });
      const canonical = page.canonical ?? page.url;
      const robots = page.noindex ? 'noindex, nofollow' : 'max-image-preview:large';
      fs.writeFileSync(path.join(dir, 'index.html'),
        '<!doctype html><html><head><link rel="canonical" href="' + canonical +
        '"><meta name="robots" content="' + robots + '"></head><body>Visible article</body></html>');
    }
    run(auditBuiltSitemap(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('root and flat article sitemap entries match built canonicals', () => {
  withBuild([{url: origin + '/'}, {url: origin + '/wellness-hub/guide'}], result => {
    assert.equal(result.count, 2);
    assert.deepEqual(result.issues, []);
  });
});

test('sitemap URL with mismatched canonical fails', () => {
  withBuild([{url: origin + '/about', canonical: origin + '/other'}], result => {
    assert.match(result.issues.join('\n'), /Sitemap\/canonical mismatch/);
  });
});

test('sitemap URL with noindex built HTML fails', () => {
  withBuild([{url: origin + '/privacy', noindex: true}], result => {
    assert.match(result.issues.join('\n'), /includes noindex HTML/);
  });
});

test('advertised route absent from static output fails', () => {
  withBuild([{url: origin + '/missing', noFile: true}], result => {
    assert.match(result.issues.join('\n'), /no built HTML/);
  });
});

test('root must be slash terminated and subpages must not', () => {
  withBuild([{url: origin + '/about/'}], result => {
    assert.match(result.issues.join('\n'), /Trailing slash on nonroot/);
  });
});

test('sitemap entry on a foreign host fails', () => {
  withBuild([{url: 'https://example.invalid/about'}], result => {
    assert.match(result.issues.join('\n'), /Noncanonical sitemap URL/);
  });
});

test('sitemap must not advertise embed and utility pages', () => {
  withBuild([{url: origin + '/embed/example'}], result => {
    assert.match(result.issues.join('\n'), /Utility or noindex route advertised/);
  });
});

test('duplicate URLs fail', () => {
  withBuild([{url: origin + '/about'}, {url: origin + '/about'}], result => {
    assert.match(result.issues.join('\n'), /Duplicate page URL/);
  });
});

test('missing sitemap index fails closed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-empty-sitemap-'));
  try {
    assert.match(auditBuiltSitemap(root).issues.join('\n'), /Missing built sitemap-index/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
