# HealthyLifeStyles — CURRENT ENGINEERING INSTRUCTIONS (owner-approved, 2026-11-04)

> **READ FIRST:** [docs/HEALTHYLIFESTYLES_ENGINEERING_CONTINUITY.md](docs/HEALTHYLIFESTYLES_ENGINEERING_CONTINUITY.md).
> This is the current, scoped handoff and safety contract for anyone continuing the HealthyLifeStyles frontend release work. It reflects the owner's explicit request to continue from the last verified point, follow the established master prompt without scope drift, persist evidence, and **always end with the exact next action**.
>
> The material under **Historical AGENTS snapshot** is preserved unchanged for provenance, but describes an older local CMS/adapter layout and is **not evidence of the current deployed architecture or release status**.

## Mandatory operating rules
- First read this file, the linked continuity record, the current PR #19 and its latest comments, and the applicable Google Drive project journal. Verify live HEAD and provider state instead of assuming historical snapshots remain current.
- **Scope lock:** continue the latest owner-approved HealthyLifeStyles milestone; do not pivot to other projects, unrelated features, DNS/staging rebuilds, or repeat passing tests without a regression reason.
- Implement authorized, reversible engineering fixes with proof; save code and exact results on the existing development PR. Do not claim work or tests that were not performed.
- **Production change control:** no PR merge, main push, Vercel Production deployment, Hostinger CMS deployment, rollback, production DNS change, paid upgrade, Neon/R2/CMS production write, indexing submission or secret replacement without the owner's specific approval. Preview creation itself also requires separate approval after safety/cost gates.
- The owner's existing **conditional** approval only permits removing Preview access to `CMS_API_KEY` and `INTERNAL_API_KEY` when the current Production assignments **and stored values** are demonstrably preserved. If identity, CLI version, record scope, or preservation is uncertain: make no change. Never expose or request secrets in chat.
- Keep Astro/Vercel frontend and Payload/Next.js Hostinger CMS distinct. Do not rewrite `vercel.json`, `astro.config.mjs`, ads, security headers, redirects or CMS schemas wholesale.
- Every engineer's end-of-session report must state observed changes, evidence, blockers, **GO/NO-GO**, and one concrete **NEXT STEP**. Save this handoff on PR #19; do not imply any task continues in the background without an actual running mechanism.

---

## Historical AGENTS snapshot (preserved for reference; superseded where stale)

## Goal
Build a complete omnichannel SEO, indexing, social preview, AI copilot, pSEO, ad management, Lead Gen, Viral Share, and Audience/Push Notification system for a Payload CMS + Astro stack.

## Constraints & Preferences
- All ad/lead components must be self-fetching (call `getAdConfig()`/`getLeadGenConfig()` internally) — no prop-drilling through 40+ pages
- Viral share images are generated server-side via sharp SVG→PNG at a dynamic API endpoint
- Lead-gen CTA forms forward submissions to n8n webhook for automated email sequencing
- Subscribers collection deduplicates by email (unique index); web push uses VAPID via web-push
- CSV import supports quoted fields and detects column headers automatically
- n8n can both push subscriber data into CMS and receive new subscriber events
- Default `never` → `as any` casts for new Payload globals/collections before types are regenerated

## Progress
### Done
- **Ad Management + Partytown**: self-fetching `src/lib/ad-config.ts` singleton; rewrote `AdSlot.astro` (5 placements, Partytown scripts, lazy-load, close btn); rewrote `AdsLoader.astro` (Partytown-aware, IntersectionObserver lazy-push); simplified `BaseLayout.astro` — no adConfig prop needed; 0 page-level changes across 40+ tool/article pages
- **Viral Share & Dynamic Images**: `src/pages/api/result-image.ts` (1200×630 branded PNG via sharp SVG→PNG); `src/components/ShareResult.tsx` (Preact island with X/Facebook share, copy-link, download-image); integrated in Calculator, QuizCalculator, Fasting, HealthScore
- **Lead Generation & Newsletter**: `src/globals/LeadGen.ts` (offers + n8n config); `src/collections/Leads.ts` (audit trail); `src/lib/lead-config.ts` (build-time singleton); `POST /api/lead` (validates email, forwards to n8n + saves subscriber); `src/islands/LeadForm.tsx`; `src/components/LeadCTA.astro` (CMS-fetching, matched by tool slug); wired in ToolPageLayout.astro
- **Audience & Push Notifications**: `src/collections/Subscribers.ts` (unique email, interests, source, metadata); `src/collections/PushSubscriptions.ts` (endpoint, authKey, p256dhKey); `src/collections/PushHistory.ts` (sent push audit log); `src/globals/Audience.ts` (n8n integration, VAPID keys, CSV import tabs); `src/lib/push.ts` (initPush, sendToOne, broadcast, afterPublishPushHook); `src/endpoints/csvImport.ts` (parse CSV, upsert subscribers); `src/endpoints/sendPush.ts` (broadcast to all subscribers); `src/endpoints/subscriberSync.ts` (n8n→CMS sync, array support, CORS); `src/components/admin/ImportCsvButton.tsx`; `src/components/admin/SendPushButton.tsx` (on Article sidebar); `src/pages/api/subscribe.ts` (Astro→CMS proxy); `src/pages/api/push-subscribe.ts` (browser→CMS proxy); `public/sw.js` (push event + notification click handlers)
- Registered all collections/globals/endpoints in `payload.config.ts` and wired `SendPushButton` + `afterPublishPushHook` in `Articles.ts`

### In Progress
- (none — all planned modules built)

### Blocked
- (none)

## Key Decisions
- **Self-fetching components** instead of prop-drilling: AdSlot, AdsLoader, LeadCTA all call `getAdConfig()`/`getLeadGenConfig()` internally via build-time singletons — zero page-level changes required
- **Hybrid static + adapter**: Astro stays `output: 'static'` but uses `@astrojs/node` adapter so API endpoints with `export const prerender = false` work as server routes
- **n8n webhook forwarding** in LeadForm: client → POST /api/lead (Astro) → forward to n8n + save to CMS subscribers (fire-and-forget, doesn't block on n8n)
- **Web Push flow**: admin clicks SendPushButton on Article edit → POST /api/push/send → fetches all PushSubscriptions → broadcasts via web-push → logs results to PushHistory; auto-push on publish via afterPublishPushHook
- **CSV import** reads CSV from uploaded media file, handles quoted fields, uses unique email index for dedup/upsert
- **`as any` casts** for all new Payload collection/global operations to work around Payload's typed slug system before types are regenerated

## Next Steps
1. Generate Payload types (`npx next build` already generates `payload-types.ts` — but confirm 'audience', 'subscribers', 'push-subscriptions', 'push-history' are included after build)
2. Write integration tests: CSV upload → bulk subscribers → sync endpoint → push from article edit screen
3. Add VAPID keys, n8n webhook URL, and AdSense client ID to .env (all modules degrade gracefully when empty)
4. Verify Partytown ad serving in production (requires AdSense approval + live domain)
5. Consider adding a push subscription UI (allow/deny prompt) on the frontend

## Critical Context
- Astro frontend at F:\cloud\ is `output: 'static'` with `@astrojs/node` adapter (mode: standalone)
- CMS is Next.js 15 + Payload 3 at F:\cloud\cms\
- `web-push` v3.6.7 + `@types/web-push` installed in CMS
- All old `AdSlot` usage across 40+ tool/article pages continues to work unchanged (backward-compatible self-fetching)
- No VAPID keys, n8n webhook URL, or CSV file are set yet — all modules degrade gracefully when empty
- `@builder.io/partytown@0.10.3` installed for AdSense offloading

## Relevant Files (this session)
- `F:\cloud\cms\src\collections\Subscribers.ts` — email subscribers (unique, interests, source)
- `F:\cloud\cms\src\collections\PushSubscriptions.ts` — browser push subscription storage
- `F:\cloud\cms\src\collections\PushHistory.ts` — push notification audit log
- `F:\cloud\cms\src\globals\Audience.ts` — n8n, VAPID, CSV import config
- `F:\cloud\cms\src\lib\push.ts` — initPush, sendToOne, broadcast, afterPublishPushHook
- `F:\cloud\cms\src\endpoints\csvImport.ts` — CSV→subscribers import
- `F:\cloud\cms\src\endpoints\sendPush.ts` — broadcast push to all subscribers
- `F:\cloud\cms\src\endpoints\subscriberSync.ts` — n8n→CMS sync with CORS
- `F:\cloud\cms\src\components\admin\ImportCsvButton.tsx` — admin UI for CSV import
- `F:\cloud\cms\src\components\admin\SendPushButton.tsx` — admin UI in Article sidebar
- `F:\cloud\cms\payload.config.ts` — registered Audience, Subscribers, PushSubscriptions, PushHistory, csvImport, sendPush, subscriberSync
- `F:\cloud\cms\src\collections\Articles.ts` — wired SendPushButton + afterPublishPushHook
- `F:\cloud\src\pages\api\subscribe.ts` — Astro→CMS subscriber proxy
- `F:\cloud\src\pages\api\push-subscribe.ts` — Astro→CMS push subscription proxy
- `F:\cloud\public\sw.js` — push event + click handlers
- `F:\cloud\src\pages\api\lead.ts` — now also saves to CMS subscribers
