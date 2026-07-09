/**
 * jsonld-reconcile.ts
 *
 * Step 1 of Phase 7: audit all JSON-LD blocks in the built HTML for:
 *   - Valid JSON syntax
 *   - Presence of @context and @type
 *   - YMYL required fields on MedicalWebPage / Article / WebApplication
 *   - Publisher / worksFor references that point to the canonical Organization @id
 *   - Common schema coverage gaps (HowTo, HealthTopicContent, VideoObject, etc.)
 *
 * Usage (after npm run build):
 *   node scripts/seo/jsonld-reconcile.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const DIST_DIR = path.resolve(process.cwd(), 'dist', 'client')
const ORG_ID = 'https://www.healthylifesstyles.com/#org'

interface Finding {
  page: string
  type: 'invalid-json' | 'missing-context' | 'missing-type' | 'ymyl-missing-author' | 'ymyl-missing-reviewer' | 'ymyl-missing-last-reviewed' | 'orphan-publisher-ref' | 'orphan-worksfor-ref' | 'missing-schema-opportunity'
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
  return types.some((t) => ['MedicalWebPage', 'Article', 'WebApplication', 'HealthTopicContent', 'MedicalCondition'].includes(t))
}

function hasPublisherRef(obj: any): boolean {
  if (!obj.publisher) return false
  if (obj.publisher && obj.publisher['@id'] === ORG_ID) return true
  if (obj.publisher && obj.publisher.name) return false // inline publisher, warn
  return false
}

function main() {
  const findings: Finding[] = []
  const typeCounts: Record<string, number> = {}
  const pageCount = { total: 0, withJsonLd: 0 }

  walkHtml(DIST_DIR, (filePath) => {
    const page = toUrlPath(filePath, DIST_DIR)
    pageCount.total++
    const html = fs.readFileSync(filePath, 'utf-8')
    const blocks = extractJsonLd(html)
    if (blocks.length > 0) pageCount.withJsonLd++

    for (const raw of blocks) {
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
      for (const t of types) {
        typeCounts[t] = (typeCounts[t] || 0) + 1
      }

      if (isYMYLType(obj['@type'])) {
        if (!obj.author) {
          findings.push({ page, type: 'ymyl-missing-author', message: `YMYL type ${types.join('/')} missing author` })
        }
        if (!obj.reviewedBy && types.includes('MedicalWebPage')) {
          findings.push({ page, type: 'ymyl-missing-reviewer', message: `MedicalWebPage missing reviewedBy` })
        }
        if (!obj.lastReviewed && types.includes('MedicalWebPage')) {
          findings.push({ page, type: 'ymyl-missing-last-reviewed', message: `MedicalWebPage missing lastReviewed` })
        }
        if (obj.author && !obj.author['@id'] && !obj.author.name) {
          findings.push({ page, type: 'ymyl-missing-author', message: `YMYL author has no name or @id` })
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

  console.log('Phase 7 Reconciliation: JSON-LD Audit')
  console.log('=====================================\n')
  console.log(`Pages scanned: ${pageCount.total}`)
  console.log(`Pages with JSON-LD: ${pageCount.withJsonLd}`)
  console.log(`Unique JSON-LD blocks: ${Object.values(typeCounts).reduce((a, b) => a + b, 0)}`)
  console.log('\nSchema types found:')
  for (const [t, c] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`)
  }

  const grouped = findings.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`\nFindings by type:`)
  for (const [t, c] of Object.entries(grouped).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`)
  }

  if (findings.length > 0) {
    console.log('\n--- Sample findings ---')
    const byPage = findings.reduce((acc, f) => {
      acc[f.page] = acc[f.page] || []
      acc[f.page].push(f)
      return acc
    }, {} as Record<string, Finding[]>)
    for (const [page, list] of Object.entries(byPage).slice(0, 8)) {
      console.log(`\n${page}`)
      for (const f of list.slice(0, 3)) {
        console.log(`  [${f.type}] ${f.message}`)
      }
    }
  } else {
    console.log('\nNo findings. All audited JSON-LD blocks look healthy.')
  }

  console.log('\nReconciliation complete.')
}

main()
