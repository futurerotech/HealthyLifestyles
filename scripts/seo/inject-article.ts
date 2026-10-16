/**
 * inject-article.ts
 *
 * Pushes one article JSON file into the Payload CMS as a DRAFT via REST API.
 * Resolves all relationship fields (tools, tags, categories, authors, related
 * articles) dynamically by slug. Creates missing tags on the fly. Aborts on
 * slug collision (re-run safety).
 *
 * Usage:
 *   npx tsx scripts/seo/inject-article.ts --file=scripts/seo/article-payloads/<name>.json [--dry-run]
 */
import * as fs from 'fs'
import * as path from 'path'

/* ─── Config ──────────────────────────────────────────────────── */

const CMS = process.env.CMS_URL || 'https://cms.healthylifesstyles.com'
const DRY_RUN = process.argv.includes('--dry-run')
const fileArg = process.argv.find((a) => a.startsWith('--file='))?.slice('--file='.length)
if (!fileArg) {
  console.error('FATAL: pass --file=<path-to-article.json>')
  process.exit(1)
}
const RAW = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), fileArg), 'utf-8'))

function cmsEnv(key: string): string {
  for (const file of ['.env', '.env.production.backup']) {
    try {
      const envPath = path.resolve(process.cwd(), 'cms', file)
      const text = fs.readFileSync(envPath, 'utf-8')
      const line = text.split('\n').find((l) => l.startsWith(`${key}=`))
      if (line) return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '').trim()
    } catch { /* try next file */ }
  }
  return process.env[key] || ''
}

/* ─── Auth ────────────────────────────────────────────────────── */

async function login(): Promise<string> {
  const email = cmsEnv('PAYLOAD_EMAIL')
  const password = cmsEnv('PAYLOAD_PASSWORD')
  if (!email || !password) throw new Error('PAYLOAD_EMAIL / PAYLOAD_PASSWORD not found in cms/.env')
  const res = await fetch(`${CMS}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  if (!data.token) throw new Error('Login response missing token')
  return data.token as string
}

async function api<T = any>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) }
  if (init?.token) headers.Authorization = `JWT ${init.token}`
  const { token: _t, ...rest } = init ?? {}
  const res = await fetch(`${CMS}${path}`, { ...rest, headers })
  if (!res.ok) throw new Error(`${init?.method || 'GET'} ${path} → ${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

/* ─── Lookup helpers ──────────────────────────────────────────── */

async function resolveSlug(
  collection: string,
  slug: string,
  token: string,
): Promise<number | null> {
  const data = await api<{ docs: { id: number }[] }>(
    `/api/${collection}?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0&draft=false`,
    { token },
  )
  return data.docs?.[0]?.id ?? null
}

const slugify = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
/** "health-risk" → "Health Risk" (only used when CREATING a tag from slug-style input). */
const toDisplayName = (s: string): string => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** Known near-miss slugs from the content pipeline → real CMS slugs. */
const AUTHOR_ALIASES: Record<string, string> = {
  'medical-review-team': 'medical-review',
}

/** Find a tag by slug; create it if missing. Returns the tag ID. */
async function ensureTag(name: string, token: string): Promise<number> {
  const existing = await resolveSlug('tags', slugify(name), token)
  if (existing) return existing
  const displayName = toDisplayName(name)
  if (DRY_RUN) {
    console.log(`  [dry] Would create tag "${displayName}" (not found)`)
    return -1
  }
  const res = await api<{ doc: { id: number } }>(
    '/api/tags',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: displayName }),
      token,
    },
  )
  return res.doc.id
}

/* ─── Shape normalizers (accept string or object forms) ──────── */

function parseSource(raw: string | { label: string; url?: string }): { label: string; url: string } {
  if (typeof raw !== 'string') return { label: raw.label, url: raw.url || '' }
  const urlMatch = raw.match(/(https?:\/\/\S+)\s*$/)
  const url = urlMatch?.[1] ?? ''
  const label = url ? raw.slice(0, raw.indexOf(url)).trim().replace(/:\s*$/, '') : raw.trim()
  return { label, url }
}

function parseEntity(raw: string | { term: string; url?: string }): { term: string; url: string } {
  if (typeof raw !== 'string') return { term: raw.term, url: raw.url || '' }
  return { term: raw, url: '' }
}

/* ─── Layout block mapper ─────────────────────────────────────── */

interface JsonBlock {
  type: string
  text?: string
  level?: number
  items?: string[]
  ordered?: boolean
  toolSlug?: string
}

function mapLayout(blocks: JsonBlock[]): any[] {
  return blocks.map((b) => {
    switch (b.type) {
      case 'paragraph':
        return { blockType: 'text', style: 'p', text: b.text }

      case 'heading':
        if (b.text && /\[([^\]]+)\]\(([^)]+)\)/.test(b.text)) {
          throw new Error(`Heading contains a markdown link (not allowed): "${b.text}"`)
        }
        return { blockType: 'text', style: b.level === 2 ? 'h2' : b.level === 3 ? 'h3' : 'p', text: b.text }

      case 'list':
        return {
          blockType: 'list',
          style: b.ordered ? 'ordered' : 'unordered',
          items: (b.items || []).map((t) => ({ text: t })),
        }

      case 'toolEmbed':
        return { blockType: 'toolEmbed', _toolSlug: b.toolSlug }

      case 'disclaimer':
        return { blockType: 'callout', tone: 'info', title: 'Medical disclaimer', text: b.text }

      default:
        console.warn(`  ⚠ Unknown block type "${b.type}", converting to text`)
        return { blockType: 'text', style: 'p', text: b.text || '' }
    }
  })
}

/* ─── Main ────────────────────────────────────────────────────── */

async function main() {
  const token = DRY_RUN ? '' : await login()

  console.log(DRY_RUN ? '🧪 DRY RUN — will build payload but not send\n' : '🚀 Pushing article to CMS...\n')

  // Slug collision guard (re-run safety)
  const targetSlug: string = RAW.seo.slug
  const existingArticle = await resolveSlug('articles', targetSlug, token)
  if (existingArticle) {
    throw new Error(`Article with slug "${targetSlug}" already exists (id ${existingArticle}). Aborting to prevent a duplicate.`)
  }

  // ── Resolve relationships ──────────────────────────────────────

  const categoryId = await resolveSlug('categories', RAW.category, token)
  if (!categoryId) throw new Error(`Category "${RAW.category}" not found`)
  console.log(`  ✓ Category: ${RAW.category} → ${categoryId}`)

  const tagIds: number[] = []
  for (const tagName of RAW.tags) {
    const id = await ensureTag(tagName, token)
    tagIds.push(id)
    console.log(`  ✓ Tag: "${tagName}" → ${id}`)
  }

  const authorId = await resolveSlug('authors', RAW.author, token)
  if (!authorId) throw new Error(`Author "${RAW.author}" not found`)
  console.log(`  ✓ Author: ${RAW.author} → ${authorId}`)

  let reviewerId: number | null = null
  if (RAW.reviewer) {
    const aliased = AUTHOR_ALIASES[RAW.reviewer] || RAW.reviewer
    if (aliased !== RAW.reviewer) console.log(`  ⤷ Reviewer slug "${RAW.reviewer}" aliased → "${aliased}"`)
    reviewerId = await resolveSlug('authors', aliased, token)
    if (!reviewerId) console.log(`  ⚠ Reviewer "${aliased}" not found — skipping`)
  }

  const primaryToolId = await resolveSlug('tools', RAW.primaryTool, token)
  if (!primaryToolId) throw new Error(`Primary tool "${RAW.primaryTool}" not found`)
  console.log(`  ✓ Primary tool: ${RAW.primaryTool} → ${primaryToolId}`)

  const relatedToolIds: number[] = []
  for (const slug of RAW.relatedTools) {
    const id = await resolveSlug('tools', slug, token)
    if (id) { relatedToolIds.push(id); console.log(`  ✓ Related tool: ${slug} → ${id}`) }
    else console.log(`  ⚠ Tool "${slug}" not found — skipping`)
  }

  const relatedArticleIds: number[] = []
  for (const slug of RAW.relatedArticles) {
    const id = await resolveSlug('articles', slug, token)
    if (id) { relatedArticleIds.push(id); console.log(`  ✓ Related article: ${slug} → ${id}`) }
    else console.log(`  ⚠ Article "${slug}" not found — skipping`)
  }

  // ── Resolve toolEmbed slugs inside layout ──────────────────────

  const layout = mapLayout(RAW.layoutBlocks)
  for (const block of layout) {
    if (block.blockType === 'toolEmbed' && block._toolSlug) {
      const id = await resolveSlug('tools', block._toolSlug, token)
      if (id) {
        block.tool = id
        console.log(`  ✓ Embed tool: ${block._toolSlug} → ${id}`)
      } else {
        console.log(`  ⚠ Embed tool "${block._toolSlug}" not found — removing block`)
        layout.splice(layout.indexOf(block), 1)
      }
      delete block._toolSlug
    }
  }

  // ── Normalize arrays ───────────────────────────────────────────

  const sources = (RAW.sources || []).map(parseSource)
  const semanticEntities = (RAW.semanticEntities || []).map(parseEntity)

  // ── Build payload ──────────────────────────────────────────────

  // hasFAQ: only valid when a peopleAlsoAsk block exists in layout (CMS rule)
  const hasPeopleAlsoAsk = RAW.layoutBlocks.some((b: JsonBlock) => b.type === 'peopleAlsoAsk')

  const payload: Record<string, any> = {
    title: RAW.title,
    excerpt: RAW.excerpt,
    heroImage: null,                  // images handled manually in CMS
    layout,
    faq: RAW.faq || [],
    takeaways: [],
    sources,
    relatedTools: relatedToolIds,
    category: categoryId,
    author: authorId,
    reviewer: reviewerId || null,
    tags: tagIds,
    publishDate: RAW.publishDate || null,
    updatedDate: RAW.updatedDate || null,
    featured: RAW.featured ?? false,
    isHowTo: RAW.isHowTo ?? false,
    isHealthTopic: RAW.isHealthTopic ?? false,
    hasFAQ: hasPeopleAlsoAsk,
    primaryTool: primaryToolId,
    relatedArticles: relatedArticleIds,
    slug: targetSlug,
    seo: {
      metaTitle: RAW.seo.metaTitle,
      metaDescription: RAW.seo.metaDescription,
      canonical: RAW.seo.canonical || '',
      noIndex: RAW.seo.noindex ?? false,
      keywords: RAW.seo.keywords || [],
      ogImage: null,                  // images handled manually in CMS
      ogTitle: RAW.ogTitle,
      ogDescription: RAW.ogDescription,
      twitterTitle: RAW.twitterTitle,
      twitterDescription: RAW.twitterDescription,
      twitterImage: null,
    },
    semanticEntities,
    aiGenerated: RAW.aiGenerated ?? false,
    reviewedByHuman: RAW.reviewedByHuman ?? false,
    aiImagePrompt: RAW.aiImagePrompt || null,
    _status: 'draft',
  }

  // ── Print or send ──────────────────────────────────────────────

  if (DRY_RUN) {
    console.log('\n──────────── Draft payload (exact POST body) ─────────────')
    console.log(JSON.stringify(payload, null, 2))
    console.log('──────────── End payload ─────────────────────────────────')
    return
  }

  const result = await api<{ doc: { id: number; slug: string } }>(
    '/api/articles',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      token,
    },
  )

  console.log(`\n✅ Article created (draft)`)
  console.log(`   ID:   ${result.doc.id}`)
  console.log(`   Slug: ${result.doc.slug}`)
  console.log(`   URL:  https://www.healthylifesstyles.com/wellness-hub/${result.doc.slug}`)
  console.log(`\n   Open CMS to attach hero image and review before publishing.`)
}

main().catch((err) => {
  console.error('FATAL:', err.message)
  process.exit(1)
})
