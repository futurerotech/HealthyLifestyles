/**
 * fix-orphan-tag-pages.ts
 *
 * Phase: orphan tag-page fix (heart-health + mental-wellness).
 *
 * Two-part mutation against the hosted CMS REST API:
 *   1. Attach the orphan tag to topically relevant articles (so their tag pages
 *      gain content and every tagged article renders an inbound chip link).
 *   2. Append one natural contextual sentence with a markdown link to the tag
 *      page inside an existing body block of the strongest candidates.
 *
 * Idempotent: skips tag attachments and text splices already present.
 * Prints a review table (source → anchor → target) at the end.
 *
 * Usage: node scripts/seo/fix-orphan-tag-pages.ts [--dry-run]
 */
import * as fs from 'fs'
import * as path from 'path'

const CMS = process.env.CMS_URL || 'https://cms.healthylifesstyles.com'
const DRY_RUN = process.argv.includes('--dry-run')

function cmsEnv(key: string): string {
  // Credentials live in the sibling CMS repo's env (same pattern as Phase 4
  // scripts). Production creds are checked first, then local .env.
  for (const file of ['.env', '.env.production.backup']) {
    try {
      const envPath = path.resolve(process.cwd(), 'cms', file)
      const text = fs.readFileSync(envPath, 'utf-8')
      const line = text.split('\n').find((l) => l.startsWith(`${key}=`))
      if (line) return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '').trim()
    } catch {
      /* try next file */
    }
  }
  return process.env[key] || ''
}

const HEART = { id: 14, slug: 'heart-health' }
const MENTAL = { id: 16, slug: 'mental-wellness' }

interface Splice {
  /** Distinct ASCII fragment that must exist in the block text. */
  anchorFragment: string
  /** Sentence to append to that block (contains the markdown link). */
  append: string
}

interface Mutation {
  articleId: number
  slug: string
  attachTag: typeof HEART
  splice?: { blockIndex: number } & Splice
}

const MUTATIONS: Mutation[] = [
  // ── heart-health ──────────────────────────────────────────────
  {
    articleId: 21,
    slug: 'what-is-an-anti-inflammatory-diet',
    attachTag: HEART,
    splice: {
      blockIndex: 3,
      anchorFragment: 'pattern-level association, not a promise',
      append:
        ' That pattern-level association shows up most consistently for cardiovascular outcomes — the strongest evidence for plant-forward, unsaturated-fat eating sits squarely in [heart health](/wellness-hub/tag/heart-health).',
    },
  },
  {
    articleId: 3,
    slug: 'healthy-bmi-by-age',
    attachTag: HEART,
    splice: {
      blockIndex: 8,
      anchorFragment: 'can make a "normal" BMI hide low strength',
      append:
        ' It is also why BMI reads best alongside [heart-health markers](/wellness-hub/tag/heart-health) like waist size and blood pressure rather than on its own.',
    },
  },
  {
    articleId: 1,
    slug: 'how-many-calories-to-lose-weight',
    attachTag: HEART,
    splice: {
      blockIndex: 7,
      anchorFragment: 'a healthy, sustainable pace',
      append:
        ' It is also the pace that keeps the [heart-health](/wellness-hub/tag/heart-health) benefits of weight loss intact — crash diets tend to cost lean mass and blood-pressure stability along with the fat.',
    },
  },
  {
    articleId: 7,
    slug: 'intermittent-fasting-for-beginners',
    attachTag: HEART,
    // Tag only — the article already carries dense internal links.
  },
  // ── mental-wellness ───────────────────────────────────────────
  {
    articleId: 8,
    slug: 'sleep-chronotypes-explained',
    attachTag: MENTAL,
    splice: {
      blockIndex: 10,
      anchorFragment: 'not skip good sleep habits',
      append:
        ' Chronic social jet lag shows up as more than tiredness — it tracks with mood and stress, which is why sleep timing belongs in the [mental wellness](/wellness-hub/tag/mental-wellness) conversation too.',
    },
  },
  {
    articleId: 4,
    slug: 'best-time-to-stop-drinking-coffee-for-sleep',
    attachTag: MENTAL,
    splice: {
      blockIndex: 7,
      anchorFragment: 'repay it gradually',
      append:
        ' And because caffeine-driven sleep loss feeds next-day anxiety, the curfew is a [mental wellness](/wellness-hub/tag/mental-wellness) lever as much as a sleep one.',
    },
  },
  {
    articleId: 22,
    slug: 'how-do-you-know-if-your-gut-is-healthy',
    attachTag: MENTAL,
    splice: {
      blockIndex: 3,
      anchorFragment: 'interact with your immune system',
      append:
        ' The conversation runs both ways — the gut-brain axis links digestion to mood and stress, which is why gut health keeps surfacing in our [mental wellness](/wellness-hub/tag/mental-wellness) guides.',
    },
  },
  {
    articleId: 23,
    slug: 'how-to-keep-a-food-and-symptom-diary',
    attachTag: MENTAL,
    splice: {
      blockIndex: 4,
      anchorFragment: 'partly about the day around it',
      append:
        ' Stress in particular can mimic a food trigger, so log it honestly — the overlap with [mental wellness](/wellness-hub/tag/mental-wellness) is often the real pattern.',
    },
  },
]

async function login(): Promise<string> {
  const email = cmsEnv('PAYLOAD_EMAIL')
  const password = cmsEnv('PAYLOAD_PASSWORD')
  if (!email || !password) throw new Error('PAYLOAD_EMAIL/PAYLOAD_PASSWORD not found in cms/.env')
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

async function api(path: string, init?: RequestInit & { token?: string }) {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) }
  if (init?.token) headers.Authorization = `JWT ${init.token}`
  const { token: _t, ...rest } = init ?? {}
  const res = await fetch(`${CMS}${path}`, { ...rest, headers })
  if (!res.ok) throw new Error(`${init?.method || 'GET'} ${path} → ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const token = DRY_RUN ? '' : await login()
  const review: { source: string; anchor: string; target: string; action: string }[] = []

  for (const m of MUTATIONS) {
    const a = await api(`/api/articles/${m.articleId}?depth=0&draft=false`)
    const patch: Record<string, unknown> = {}
    const actions: string[] = []

    // 1. Tag attachment (raw IDs at depth=0)
    const tagIds: number[] = (a.tags || []).map((t: any) => (typeof t === 'object' ? t.id : t))
    if (!tagIds.includes(m.attachTag.id)) {
      patch.tags = [...tagIds, m.attachTag.id]
      actions.push(`tag +${m.attachTag.slug}`)
    } else {
      actions.push(`tag ${m.attachTag.slug} already present`)
    }

    // 2. Contextual link splice
    if (m.splice) {
      const block = a.layout?.[m.splice.blockIndex]
      if (!block || block.blockType !== 'text') {
        throw new Error(`${m.slug}: block ${m.splice.blockIndex} is not a text block`)
      }
      if (block.text.includes(`/wellness-hub/tag/${m.attachTag.slug}`)) {
        actions.push('link already present')
      } else {
        if (!block.text.includes(m.splice.anchorFragment)) {
          throw new Error(`${m.slug}: anchor fragment not found in block ${m.splice.blockIndex}`)
        }
        block.text = block.text.trimEnd() + m.splice.append
        patch.layout = a.layout
        actions.push('link appended')
      }
      const anchorMatch = m.splice.append.match(/\[([^\]]+)\]\(([^)]+)\)/)
      review.push({
        source: m.slug,
        anchor: anchorMatch?.[1] ?? '',
        target: anchorMatch?.[2] ?? '',
        action: actions.join('; '),
      })
    } else {
      review.push({ source: m.slug, anchor: '(tag chip only)', target: `/wellness-hub/tag/${m.attachTag.slug}`, action: actions.join('; ') })
    }

    if (Object.keys(patch).length > 0 && !DRY_RUN) {
      await api(`/api/articles/${m.articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
        token,
      })
      console.log(`✓ ${m.slug}: ${actions.join('; ')}`)
    } else {
      console.log(`${DRY_RUN ? '(dry) ' : '✓ (no-op) '}${m.slug}: ${actions.join('; ')}`)
    }
  }

  console.log('\nReview table:')
  console.log('| Source article | Anchor text | Target | Action |')
  console.log('|---|---|---|---|')
  for (const r of review) console.log(`| ${r.source} | ${r.anchor} | ${r.target} | ${r.action} |`)
}

main().catch((err) => {
  console.error('FATAL:', err.message)
  process.exit(1)
})
