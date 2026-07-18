/**
 * orphan-check.ts
 *
 * Build-time internal-link audit.
 *
 * Crawls the Astro static output in dist/client, builds an inbound-link graph
 * for every /tools/* and /wellness-hub/* page, and fails if any published
 * tool/article has zero internal inbound links.
 *
 * Also reports:
 *   - Dead paths: internal links whose target does not exist in the build.
 *   - Spam cross-contamination: internal links matching /game/* or other known
 *     injected spam patterns.
 *
 * Usage (after npm run build):
 *   node scripts/seo/orphan-check.ts
 *
 * To wire into CI, add this after `npm run build` in the verify job:
 *   node scripts/seo/orphan-check.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const DIST_DIR = path.resolve(process.cwd(), 'dist', 'client')
const SPAM_PATTERNS = [/^\/game\//i]
const EXCLUDED_PATHS = [/^\/og\//i, /^\/embed\//i, /^\/api\//i, /^\/404/i, /^\/$/]
const ASSET_EXTENSIONS = /\.(woff2?|css|js|mjs|svg|png|jpg|jpeg|webp|ico|webmanifest|txt|xml|json|pdf)$/i
const TRACKED_ARTICLE_OR_TOOL = /^\/(tools|wellness-hub)\/[^/]+$/
const TRACKED_TAG_PAGE = /^\/wellness-hub\/tag\/[^/]+$/

function isTrackedPage(urlPath: string): boolean {
  // Track tools, articles, and tag pages. Tag pages were previously invisible
  // to this audit — which is exactly how two of them shipped as orphans.
  return TRACKED_ARTICLE_OR_TOOL.test(urlPath) || TRACKED_TAG_PAGE.test(urlPath)
}

interface PageInfo {
  filePath: string
  urlPath: string
  outboundLinks: Set<string>
  inboundLinks: Set<string>
}

function toUrlPath(filePath: string, distRoot: string): string {
  let rel = path.relative(distRoot, filePath).replace(/\\/g, '/')
  rel = rel.replace(/\/index\.html$/, '')
  if (rel === 'index.html') return '/'
  return '/' + rel
}

function isSpam(urlPath: string): boolean {
  return SPAM_PATTERNS.some((p) => p.test(urlPath))
}

function extractLinks(html: string): string[] {
  const links: string[] = []
  // Match href="/..." or href='/...' (internal absolute paths only)
  const regex = /href=(["'])(\/[^"']+)\1/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    // Strip query string and fragment for target matching.
    links.push(match[2].split(/[?#]/)[0])
  }
  return links
}

function walkHtml(dir: string, cb: (filePath: string) => void) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkHtml(full, cb)
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      cb(full)
    }
  }
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Build output not found: ${DIST_DIR}`)
    console.error('Run npm run build first.')
    process.exit(1)
  }

  const pages = new Map<string, PageInfo>()
  const htmlFiles: string[] = []
  walkHtml(DIST_DIR, (fp) => htmlFiles.push(fp))

  // First pass: record all tracked pages and their outbound links.
  for (const file of htmlFiles) {
    const urlPath = toUrlPath(file, DIST_DIR)
    const html = fs.readFileSync(file, 'utf-8')
    const outbound = new Set(extractLinks(html).filter((l) => l.startsWith('/')))

    pages.set(urlPath, {
      filePath: file,
      urlPath,
      outboundLinks: outbound,
      inboundLinks: new Set(),
    })
  }

  // Second pass: build inbound graph.
  for (const page of pages.values()) {
    for (const target of page.outboundLinks) {
      const targetPage = pages.get(target)
      if (targetPage) {
        targetPage.inboundLinks.add(page.urlPath)
      }
    }
  }

  const trackedPages = [...pages.values()].filter((p) => isTrackedPage(p.urlPath))
  const orphans = trackedPages.filter((p) => p.inboundLinks.size === 0)

  const deadLinks: { source: string; target: string }[] = []
  const spamLinks: { source: string; target: string }[] = []

  for (const page of pages.values()) {
    for (const target of page.outboundLinks) {
      if (isSpam(target)) {
        spamLinks.push({ source: page.urlPath, target })
      } else if (
        !pages.has(target) &&
        !EXCLUDED_PATHS.some((p) => p.test(target)) &&
        !ASSET_EXTENSIONS.test(target)
      ) {
        deadLinks.push({ source: page.urlPath, target })
      }
    }
  }

  console.log(`Pages scanned: ${pages.size}`)
  console.log(`Tracked tools/articles: ${trackedPages.length}`)
  console.log(`Orphans: ${orphans.length}`)
  console.log(`Dead internal links: ${deadLinks.length}`)
  console.log(`Spam (/game/) links: ${spamLinks.length}`)

  if (orphans.length > 0) {
    console.log('\n--- ORPHAN PAGES (zero inbound internal links) ---')
    for (const p of orphans) {
      console.log(`  ${p.urlPath}`)
    }
  }

  if (deadLinks.length > 0) {
    console.log('\n--- DEAD INTERNAL LINKS ---')
    for (const { source, target } of deadLinks.slice(0, 20)) {
      console.log(`  ${source} → ${target}`)
    }
    if (deadLinks.length > 20) {
      console.log(`  ... and ${deadLinks.length - 20} more`)
    }
  }

  if (spamLinks.length > 0) {
    console.log('\n--- SPAM CROSS-CONTAMINATION LINKS ---')
    for (const { source, target } of spamLinks.slice(0, 20)) {
      console.log(`  ${source} → ${target}`)
    }
    if (spamLinks.length > 20) {
      console.log(`  ... and ${spamLinks.length - 20} more`)
    }
  }

  if (deadLinks.length > 0) {
    console.log('\nWARN: dead internal links found (reported for fixing; not failing build).')
  }

  if (orphans.length > 0 || spamLinks.length > 0) {
    console.log('\nFAIL: orphan/spam-link checks failed.')
    process.exit(1)
  }

  console.log('\nPASS: all tracked pages have inbound links; no spam links found.')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
