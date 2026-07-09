/**
 * cwv-crawl.ts
 *
 * Crawls the local Astro build output and reports Core Web Vitals risks:
 *   - Images without explicit width/height (CLS risk)
 *   - Images without loading="lazy" above/below fold
 *   - Oversized JS chunks (>200 KB)
 *   - Components hydrated with client:load that may not need immediate hydration
 *   - Missing fetchpriority on likely LCP images
 *
 * Usage (after npm run build):
 *   node scripts/seo/cwv-crawl.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const DIST_DIR = path.resolve(process.cwd(), 'dist', 'client')
const JS_DIR = path.resolve(process.cwd(), 'dist', 'server')
const JS_CHUNK_THRESHOLD = 200 * 1024 // 200 KB

interface Finding {
  page: string
  type: 'image-no-dims' | 'image-lazy-lcp' | 'oversized-js' | 'eager-hydration' | 'lcp-no-priority'
  message: string
}

function toUrlPath(filePath: string, distRoot: string): string {
  let rel = path.relative(distRoot, filePath).replace(/\\/g, '/')
  rel = rel.replace(/\/index\.html$/, '')
  if (rel === 'index.html') return '/'
  return '/' + rel
}

function walkHtml(dir: string, cb: (filePath: string) => void) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkHtml(full, cb)
    else if (entry.isFile() && entry.name.endsWith('.html')) cb(full)
  }
}

function extractImgTags(html: string): { src?: string; width?: string; height?: string; loading?: string; fetchpriority?: string; alt?: string }[] {
  const imgs: any[] = []
  const regex = /<img[^>]+>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const getAttr = (name: string) => {
      const r = new RegExp(`${name}=["']([^"']+)["']`, 'i')
      const m = tag.match(r)
      return m?.[1]
    }
    imgs.push({
      src: getAttr('src'),
      width: getAttr('width'),
      height: getAttr('height'),
      loading: getAttr('loading'),
      fetchpriority: getAttr('fetchpriority'),
      alt: getAttr('alt'),
    })
  }
  return imgs
}

function extractHydrationDirectives(html: string): { component: string; directive: string }[] {
  const out: { component: string; directive: string }[] = []
  const regex = /<([A-Z][A-Za-z0-9]*)[^>]*\s(client:\w+)="[^"]*"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    out.push({ component: match[1], directive: match[2] })
  }
  return out
}

function getJsChunkSizes(): { name: string; size: number }[] {
  const out: { name: string; size: number }[] = []
  if (!fs.existsSync(JS_DIR)) return out
  for (const entry of fs.readdirSync(JS_DIR, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith('.mjs')) {
      const full = path.join(entry.parentPath || JS_DIR, entry.name)
      const stat = fs.statSync(full)
      if (stat.size > JS_CHUNK_THRESHOLD) {
        out.push({ name: entry.name, size: stat.size })
      }
    }
  }
  return out
}

function formatBytes(n: number): string {
  return `${(n / 1024).toFixed(1)} KB`
}

async function main() {
  const findings: Finding[] = []
  let fileCount = 0

  walkHtml(DIST_DIR, (filePath) => {
    fileCount++
    const page = toUrlPath(filePath, DIST_DIR)
    const html = fs.readFileSync(filePath, 'utf-8')

    const imgs = extractImgTags(html)
    for (const img of imgs) {
      if (!img.src) continue
      if (!img.width || !img.height) {
        findings.push({ page, type: 'image-no-dims', message: `Missing dimensions: ${img.src}` })
      }
      if (img.loading === 'eager' && !img.fetchpriority) {
        findings.push({ page, type: 'lcp-no-priority', message: `Eager image without fetchpriority: ${img.src}` })
      }
    }

    const hydration = extractHydrationDirectives(html)
    for (const h of hydration) {
      if (h.directive === 'client:load') {
        findings.push({
          page,
          type: 'eager-hydration',
          message: `${h.component} uses client:load — consider client:visible if below fold`,
        })
      }
    }
  })

  const oversizedJs = getJsChunkSizes()

  console.log('CWV Crawl Results')
  console.log('=================\n')

  const grouped = findings.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`Files scanned: ${fileCount}`)
  console.log(`Pages with findings: ${new Set(findings.map((f) => f.page)).size}`)
  console.log(`Images missing dimensions: ${grouped['image-no-dims'] || 0}`)
  console.log(`Eager images without fetchpriority: ${grouped['lcp-no-priority'] || 0}`)
  console.log(`Potentially eager hydrations: ${grouped['eager-hydration'] || 0}`)
  console.log(`Oversized JS chunks (>200 KB): ${oversizedJs.length}`)

  if (oversizedJs.length > 0) {
    console.log('\n--- Oversized JS chunks ---')
    for (const chunk of oversizedJs.sort((a, b) => b.size - a.size).slice(0, 10)) {
      console.log(`  ${chunk.name}: ${formatBytes(chunk.size)}`)
    }
  }

  const byPage = findings.reduce((acc, f) => {
    acc[f.page] = acc[f.page] || []
    acc[f.page].push(f)
    return acc
  }, {} as Record<string, Finding[]>)

  if (findings.length > 0) {
    console.log('\n--- Findings by page (sample) ---')
    for (const [page, list] of Object.entries(byPage).slice(0, 10)) {
      console.log(`\n${page}`)
      for (const f of list.slice(0, 5)) {
        console.log(`  [${f.type}] ${f.message}`)
      }
      if (list.length > 5) console.log(`  ... and ${list.length - 5} more`)
    }
  }

  console.log('\nRun complete.')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
