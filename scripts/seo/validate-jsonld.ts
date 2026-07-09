/**
 * validate-jsonld.ts
 *
 * Build-time JSON-LD validator. Crawls dist/client HTML, extracts every
 * application/ld+json block, and fails with exit code 1 if any block is
 * invalid JSON, missing required fields, or has broken entity references.
 *
 * Usage (after npm run build):
 *   node scripts/seo/validate-jsonld.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const DIST_DIR = path.resolve(process.cwd(), 'dist', 'client')
const ORG_ID = 'https://www.healthylifesstyles.com/#org'

interface Finding {
  page: string
  type: 'invalid-json' | 'missing-context' | 'missing-type' | 'ymyl-missing-author' | 'ymyl-missing-reviewer' | 'ymyl-missing-last-reviewed' | 'orphan-publisher-ref' | 'orphan-worksfor-ref'
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

function extractJsonLd(html: string): string[] {
  const out: string[] = []
  const regex = /<script type="application\/ld\+json">(.*?)<\/script>/gis
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    out.push(match[1].trim())
  }
  return out
}

function isYMYLType(type: string | string[]): boolean {
  const types = Array.isArray(type) ? type : [type]
  return types.some((t) => ['MedicalWebPage', 'Article', 'WebApplication', 'HealthTopicContent'].includes(t))
}

function main() {
  const findings: Finding[] = []
  let blocks = 0

  walkHtml(DIST_DIR, (filePath) => {
    const page = toUrlPath(filePath, DIST_DIR)
    const html = fs.readFileSync(filePath, 'utf-8')
    const rawBlocks = extractJsonLd(html)
    blocks += rawBlocks.length

    for (const raw of rawBlocks) {
      let obj: any
      try {
        obj = JSON.parse(raw)
      } catch (err) {
        findings.push({ page, type: 'invalid-json', message: `Invalid JSON-LD: ${(err as Error).message.slice(0, 80)}` })
        continue
      }

      if (!obj['@context']) {
        findings.push({ page, type: 'missing-context', message: 'JSON-LD missing @context' })
      }
      if (!obj['@type']) {
        findings.push({ page, type: 'missing-type', message: 'JSON-LD missing @type' })
        continue
      }

      const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']]

      if (isYMYLType(obj['@type'])) {
        if (!obj.author) {
          findings.push({ page, type: 'ymyl-missing-author', message: `YMYL type ${types.join('/')} missing author` })
        } else if (!obj.author['@id'] && !obj.author.name) {
          findings.push({ page, type: 'ymyl-missing-author', message: `YMYL author has no name or @id` })
        }
        if (types.includes('MedicalWebPage') && !obj.reviewedBy) {
          findings.push({ page, type: 'ymyl-missing-reviewer', message: 'MedicalWebPage missing reviewedBy' })
        }
        if (types.includes('MedicalWebPage') && !obj.lastReviewed) {
          findings.push({ page, type: 'ymyl-missing-last-reviewed', message: 'MedicalWebPage missing lastReviewed' })
        }
      }

      if (types.includes('MedicalWebPage') || types.includes('Article') || types.includes('WebApplication')) {
        if (obj.publisher && obj.publisher['@id'] && obj.publisher['@id'] !== ORG_ID) {
          findings.push({ page, type: 'orphan-publisher-ref', message: `publisher @id does not match ${ORG_ID}` })
        }
      }

      if (obj.author && obj.author.worksFor && obj.author.worksFor['@id'] && obj.author.worksFor['@id'] !== ORG_ID) {
        findings.push({ page, type: 'orphan-worksfor-ref', message: `author.worksFor @id does not match ${ORG_ID}` })
      }
    }
  })

  console.log('JSON-LD Validation Results')
  console.log('==========================\n')
  console.log(`Pages scanned: ${new Set(findings.map((f) => f.page)).size} with findings`)
  console.log(`Total JSON-LD blocks inspected: ${blocks}`)

  const grouped = findings.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (findings.length === 0) {
    console.log('\nPASS: all JSON-LD blocks are valid and YMYL-compliant.')
    process.exit(0)
  }

  console.log(`\nFAIL: ${findings.length} issue(s) found:\n`)
  for (const [t, c] of Object.entries(grouped).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`)
  }

  console.log('\n--- Issues by page ---')
  const byPage = findings.reduce((acc, f) => {
    acc[f.page] = acc[f.page] || []
    acc[f.page].push(f)
    return acc
  }, {} as Record<string, Finding[]>)
  for (const [page, list] of Object.entries(byPage).sort()) {
    console.log(`\n${page}`)
    for (const f of list) {
      console.log(`  [${f.type}] ${f.message}`)
    }
  }

  process.exit(1)
}

main()
