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
        '"><meta name="robots" content="' + robots + '">' + (page.extraHead ?? '') +
        '</head><body>Visible article</body></html>');
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


// Fail-closed regressions for XML grammar and HTML metadata interpretation.
test('noindex in a second robots meta with reversed attribute order fails', () => {
  withBuild([{url: origin + '/about', extraHead: '<meta content="noindex,follow" name="robots">'}], result => {
    assert.match(result.issues.join('\n'), /includes noindex HTML/);
  });
});

test('conflicting second canonical tag fails', () => {
  withBuild([{url: origin + '/about', extraHead: '<link href="' + origin + '/wrong" rel="canonical">'}], result => {
    assert.match(result.issues.join('\n'), /Sitemap\/canonical mismatch/);
  });
});

test('missing sitemap XML root cannot pass using orphan loc tags', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-sitemap-malformed-'));
  try {
    fs.writeFileSync(path.join(root, 'sitemap-index.xml'),
      '<something><sitemap><loc>' + origin + '/sitemap-0.xml</loc></sitemap></something>');
    fs.writeFileSync(path.join(root, 'sitemap-0.xml'),
      '<urlset><url><loc>' + origin + '/</loc></url></urlset>');
    fs.writeFileSync(path.join(root, 'index.html'),
      '<link rel="canonical" href="' + origin + '/"><meta name="robots" content="index,follow">');
    assert.match(auditBuiltSitemap(root).issues.join('\n'), /sitemapindex root/);
  } finally {
    fs.rmSync(root, {recursive:true,force:true});
  }
});

test('duplicate sitemap child references fail', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-sitemap-duplicate-'));
  try {
    fs.writeFileSync(path.join(root, 'sitemap-index.xml'),
      '<sitemapindex><sitemap><loc>' + origin + '/sitemap-0.xml</loc></sitemap>' +
      '<sitemap><loc>' + origin + '/sitemap-0.xml</loc></sitemap></sitemapindex>');
    fs.writeFileSync(path.join(root, 'sitemap-0.xml'),
      '<urlset><url><loc>' + origin + '/</loc></url></urlset>');
    fs.writeFileSync(path.join(root, 'index.html'),
      '<link rel="canonical" href="' + origin + '/"><meta name="robots" content="index,follow">');
    assert.match(auditBuiltSitemap(root).issues.join('\n'), /Duplicate sitemap child/);
  } finally {
    fs.rmSync(root, {recursive:true,force:true});
  }
});

test('normal generated XML declaration, sitemap namespaces and xhtml links remain valid', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-sitemap-namespace-'));
  try {
    fs.writeFileSync(path.join(root, 'sitemap-index.xml'),
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      '<sitemap><loc>' + origin + '/sitemap-0.xml</loc></sitemap></sitemapindex>');
    fs.writeFileSync(path.join(root, 'sitemap-0.xml'),
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
      'xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
      '<url><loc>' + origin + '/</loc><changefreq>weekly</changefreq>' +
      '<xhtml:link rel="alternate" hreflang="en" href="' + origin + '/"/>' +
      '</url></urlset>');
    fs.writeFileSync(path.join(root, 'index.html'),
      '<link href="' + origin + '/" rel="canonical"><meta content="index, follow" name="robots">');
    assert.deepEqual(auditBuiltSitemap(root).issues, []);
  } finally {
    fs.rmSync(root, {recursive:true,force:true});
  }
});

test('orphan loc outside url element fails even if valid page is present', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hls-sitemap-orphan-'));
  try {
    fs.writeFileSync(path.join(root, 'sitemap-index.xml'),
      '<sitemapindex><sitemap><loc>' + origin + '/sitemap-0.xml</loc></sitemap></sitemapindex>');
    fs.writeFileSync(path.join(root, 'sitemap-0.xml'),
      '<urlset><url><loc>' + origin + '/</loc></url><loc>' + origin + '/bad</loc></urlset>');
    fs.writeFileSync(path.join(root, 'index.html'),
      '<link rel="canonical" href="' + origin + '/"><meta name="robots" content="index,follow">');
    assert.match(auditBuiltSitemap(root).issues.join('\n'), /loc outside url entries/);
  } finally {
    fs.rmSync(root, {recursive:true,force:true});
  }
});

test('googlebot-specific noindex is excluded from sitemap despite generic index meta', () => {
  withBuild([{url: origin + '/about', extraHead: '<meta content="noindex" name="googlebot">'}], result => {
    assert.match(result.issues.join('\n'), /includes noindex HTML/);
  });
});
