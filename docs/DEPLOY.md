# Frontend Deployment Flow

The frontend (`healthylifesstyles.com`) is an Astro static site deployed on Vercel from the `main` branch.

## Current release hold (2026-10-15)

SEO/CMS synchronization changes are prepared locally on `codex/seo-cms-sync` in both repositories. The owner has authorized implementation, but no push, deployment, or production migration. Any push may trigger hosting, including preview builds; obtain explicit release approval first.

The major Astro/adapter security upgrade is a separate task. The frontend still has six reported dependency vulnerabilities (one critical, four high, one low). `npm run security:check` blocks both the normal build lifecycle and CI on high/critical findings. Do not renew the expired audit baseline to bypass this hold. Resolve the separate upgrade and rerun the gate before release.

## Coordinated release procedure (requires approval)

1. Review both local branches and pass the security gate, type checks, unit tests, and CMS fixture build (`npm run test:cms-build`). The fixture uses a loopback CMS and performs no production writes.
2. Release the CMS first, following its migration instructions. Keep the frontend deployment hook paused until both repositories are ready. Confirm public reads expose published content only, including `pages` and `pseo-pages`.
3. Review the two legacy tool aliases and keep their canonical tool records published and enabled. The frontend suppresses alias documents and redirects old URLs to `body-fat-calculator` and `protein-intake-calculator`.
4. Release the frontend with the production `CMS_URL` and without `CMS_DISABLE=1`. A failed/incomplete CMS read or unsupported published route must fail the build. The build also checks internal links, metadata, dates, and localized shells.
5. Check the deployed `/content-manifest.json`: `source` must be `cms`, `cmsOrigin` must match this CMS, and revisions must include the changes being released. This receipt contains public revision metadata only and must not be cached by the CDN.
6. Open CMS pending deployments. Entries clear only after a matching deployed receipt confirms them. Edits arriving during a build stay pending; failed deployments leave the queue intact. Verify publish, update, unpublish, and delete in staging before normal editorial use.
7. Check legacy tool redirects, custom pages, pSEO pages, the HTML sitemap and `/sitemap-index.xml`. CMS `/sitemap.xml` redirects to the frontend. `noIndex` and non-self editorial canonicals must be absent from XML. Submit the sitemap in Search Console; IndexNow does not guarantee indexing.

The mirrored `src/lib/site-contract.json` and `site-routes.ts` define supported public URLs. Update both copies together when adding a tool or static page; the contract tests reject drift.

## Local validation evidence (2026-10-15)

- Frontend: 62 SEO/routing/snapshot tests and five subscription API tests passed; TypeScript check passed.
- CMS: 66 unit tests, TypeScript check, domain guard and database-isolated Next build passed. Production migrations have not been executed.
- Real Astro/Vercel builds passed with an isolated loopback CMS and explicit offline data. The CMS fixture checks editorial SEO/social overrides, all supported block types, legacy links, disabled bespoke tools, pSEO, XML exclusions and the deployed revision receipt.
- Offline output: 178 HTML pages checked, zero dead internal links, zero tool/article orphans; metadata, dates, JSON-LD and size checks passed. Metadata length suggestions remain advisory. No localized pages exist, so the localized-shell check has no production translations to evaluate.
- Security gate intentionally fails with six remaining dependency findings. Full GitHub CI, Lighthouse, staging database migration and live deployment verification remain release-time checks; no production changes were made.

## How code goes live

1. **Commit and push to `dev`.**
   ```bash
   git checkout dev
   git pull origin dev
   # make changes
   git commit -m "..."
   git push origin dev
   ```
2. **GitHub Actions runs `.github/workflows/promote.yml`.**
   - Job `verify`: installs dependencies, runs `npx tsc --noEmit`, then `npm run build`.
   - Job `promote` (only if `verify` succeeds): fast-forwards `origin/main` to the current `dev` HEAD.
3. **Vercel's Git integration** detects the new `main` commit and starts a production deploy.

## Rules

- **Never push directly to `main`.** Promotion is the workflow's job only.
- **Never force-push `main`.** If promotion fails because `main` has diverged, resolve it manually with a merge or rebase on `dev`.
- **Review locally before landing on `dev`.** Pushing `dev` starts automatic promotion and is a release action.

## Rollback

With release approval, restore a known-good deployment in the Vercel dashboard and prepare a normal revert through `dev`. Do not rewrite `main` history. To inspect existing deployments:

1. Open [vercel.com/dashboard](https://vercel.com/dashboard).
2. Select the `healthylifesstyles.com` project.
3. Go to **Deployments**.
4. Find the deployment for the rollback commit (or the previous known-good deployment).
5. Click the three-dots menu → **Redeploy** → confirm.

## Default branch

The repository default branch is `dev`. New pull requests and edits in the GitHub UI target `dev` automatically.

To verify or change the default branch (requires repo admin):

1. Open the repository on GitHub.
2. Go to **Settings** → **General**.
3. Under "Default branch", confirm it is set to `dev`.
