/** Public GET/HEAD only. An audit build is NEVER a release candidate. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readPublishedInventory } from './inventory.mjs';
import { verifyOutput, inspectHtml, inspectDocument, publicPath, SITE_ORIGIN } from './preflight.mjs';
import { createReviewWorkspace, resolveAstroCli } from './workspace.mjs';
import { documentProof } from '../../src/lib/content-integrity.mjs';

const baseline = JSON.parse(await readFile(new URL('./production-baseline.json', import.meta.url), 'utf8'));
const root = resolve('.content-audit');
await mkdir(join(root, 'production-html'), { recursive: true });
const inventory = await readPublishedInventory(baseline.cmsOrigin);
await writeFile(join(root, 'production-inventory.json'), JSON.stringify(inventory, null, 2));
console.log(`Public inventory: ${inventory.collections.articles.length} articles; ${inventory.collections.tools.length} tool records; ${inventory.requests.length} paginated GET requests.`);

async function parallel(items, operation, concurrency = 4) {
  const results = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => { while (next < items.length) { const index = next++; results[index] = await operation(items[index]); } }));
  return results;
}
const production = await parallel(Object.entries(inventory.collections).flatMap(([collection, docs]) => docs.map((doc) => ({ collection, doc }))), async ({ collection, doc }) => {
  const path = collection === 'tools' ? `/tools/${doc.slug}` : publicPath(collection, doc);
  try {
    const response = await fetch(`${SITE_ORIGIN}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(30000), redirect: 'follow' });
    const html = await response.text();
    await writeFile(join(root, 'production-html', `${collection}-${doc.id}.html`), html);
    const view = inspectHtml(html);
    return { collection, id: String(doc.id), slug: doc.slug, url: `${SITE_ORIGIN}${path}`, finalUrl: response.url, status: response.status, title: view.title, h1: view.h1, canonical: view.canonical, metadata: view.meta, images: view.images, links: view.links };
  } catch (error) { return { collection, id: String(doc.id), slug: doc.slug, status: null, error: error.message }; }
});
await writeFile(join(root, 'production-pages.json'), JSON.stringify(production, null, 2));
console.log(`Production pages read: ${production.filter((p) => p.status === 200).length}/${production.length} HTTP 200.`);

// The normal production-data build deliberately fails on inaccessible groups.
// This separate review proxy records upstream failures and marks every artifact
// diagnostic so neither preflight nor CMS can accept it for a release.
const blockedEndpoints = new Map();
const publicCache = new Map();
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/')) { res.writeHead(404); res.end(); return; }
    const collection = url.pathname.split('/')[2];
    let data;
    if (inventory.collections[collection] && !url.searchParams.has('locale')) {
      let docs = inventory.collections[collection];
      if (url.searchParams.get('where[enabled][equals]') === 'true') docs = docs.filter((d) => d.enabled === true);
      const page = Number(url.searchParams.get('page') || 1), limit = Number(url.searchParams.get('limit') || 10);
      data = { docs: docs.slice((page - 1) * limit, page * limit), totalDocs: docs.length };
    } else {
      if (!publicCache.has(req.url)) publicCache.set(req.url, (async () => {
        const upstream = await fetch(new URL(req.url, inventory.cmsOrigin), { cache: 'no-store', signal: AbortSignal.timeout(30000) });
        if (!upstream.ok) {
          blockedEndpoints.set(url.pathname, upstream.status);
          throw new Error(`Public CMS ${url.pathname}: HTTP ${upstream.status}`);
        }
        return upstream.json();
      })());
      data = await publicCache.get(req.url);
    }
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data));
  } catch { res.writeHead(502); res.end(JSON.stringify({ error: 'Public CMS read failed; diagnostic build must stop.' })); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
try {
  const workspace = await createReviewWorkspace('production-review');
  const env = { ...process.env, CMS_DISABLE: '0', CMS_URL: `http://127.0.0.1:${server.address().port}`, VERCEL_ENV: 'production', INDEXNOW_DISABLE: 'true', CONTENT_BUILD_KIND: 'diagnostic' };
  const child = spawn(process.execPath, [await resolveAstroCli(), 'build'], { cwd: workspace, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = ''; child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.on('data', (chunk) => { output += chunk; });
  const code = await new Promise((done, reject) => { child.once('error', reject); child.once('exit', done); });
  await writeFile(join(workspace, 'build.log'), output);
  if (code !== 0) throw new Error(`Diagnostic build failed:\n${output.slice(-5000)}`);
  const dist = join(workspace, 'dist/client');
  const result = await verifyOutput({ dist, inventory, baseline, requireReleaseProvenance: false, providerDir: join(workspace, '.vercel/output/static') });
  const comparisons = [];
  for (const document of result.documents) {
    const prod = production.find((p) => p.collection === document.collection && p.id === document.id);
    const html = await readFile(join(dist, document.expectedPath.replace(/^\//, ''), 'index.html'), 'utf8');
    const local = inspectHtml(html);
    const metadataDifferences = ['description', 'og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image', 'robots'].filter((key) => prod?.metadata?.[key] !== local.meta[key]).map((key) => ({ key, production: prod?.metadata?.[key] ?? null, local: local.meta[key] ?? null }));
    comparisons.push({ collection: document.collection, id: document.id, slug: document.slug, productionStatus: prod?.status, localFile: document.expectedPath, cmsErrors: document.errors, titleChanged: prod?.title !== local.title, metadataDifferences,
      productionImages: prod?.images || [], localImages: local.images,
      productionInternalLinks: (prod?.links || []).filter((href) => href.startsWith('/') || href.startsWith(SITE_ORIGIN)), localInternalLinks: local.links.filter((href) => href.startsWith('/') || href.startsWith(SITE_ORIGIN)),
    });
  }
  const imageUrls = [...new Set(result.documents.flatMap((d) => { const doc = inventory.collections[d.collection].find((x) => String(x.id) === d.id); return [doc.heroImage?.url, doc.seo?.ogImage?.url, doc.seo?.twitterImage?.url].filter(Boolean); }))];
  const images = await parallel(imageUrls, async (url) => {
    try { const target = new URL(url); if (!['https:'].includes(target.protocol) || ![new URL(SITE_ORIGIN).hostname, new URL(inventory.cmsOrigin).hostname].includes(target.hostname) && !target.hostname.endsWith('.r2.dev')) return { url, status: null, error: 'Unverified media host' };
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20000), redirect: 'follow' }); return { url, status: response.status, contentType: response.headers.get('content-type') };
    } catch (error) { return { url, status: null, error: error.message }; }
  });
  const latestInventory = await readPublishedInventory(baseline.cmsOrigin);
  for (const collection of ['articles', 'tools', 'pages', 'pseo-pages']) {
    const previous = new Map(inventory.collections[collection].map((d) => [String(d.id), documentProof(collection, d).digest]));
    if (latestInventory.collections[collection].length !== previous.size || latestInventory.collections[collection].some((d) => previous.get(String(d.id)) !== documentProof(collection, d).digest)) result.errors.push(`${collection}: production changed during this audit; regenerate and verify a fresh snapshot.`);
  }
  result.contentComplete = result.errors.length === 0;
  const report = { ...result, productionRecheckedAt: latestInventory.capturedAt, artifact: dist, productionPages: production.map(({ images, links, metadata, ...p }) => p), comparisons, images, blockedEndpoints: Object.fromEntries(blockedEndpoints), releaseReady: false,
    releaseBlockers: [...blockedEndpoints].map(([path, status]) => `Production ${path} returned ${status}; full direct CMS build is blocked.`).concat(['Review artifact uses a public CMS snapshot proxy and is explicitly diagnostic.', 'Security release hold and user approval remain in force.']),
  };
  await writeFile(join(root, 'preservation-result.json'), JSON.stringify(report, null, 2));
  await writeFile(join(root, 'latest-review.json'), JSON.stringify({ workspace, dist }, null, 2));
  console.log(JSON.stringify({ artifact: dist, counts: result.counts, contentComplete: result.contentComplete, errors: result.errors, blockedEndpoints: report.blockedEndpoints, imageChecks: images.length, imageFailures: images.filter((i) => i.status !== 200), releaseReady: false }, null, 2));
  if (!result.contentComplete) process.exitCode = 1;
} finally { await new Promise((done) => server.close(done)); }
