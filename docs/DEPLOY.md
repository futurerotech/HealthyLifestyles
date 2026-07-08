# Frontend Deployment Flow

The frontend (`healthylifesstyles.com`) is an Astro static site deployed on Vercel from the `main` branch.

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
- **Always land changes on `dev` first.** Routine edits, hotfixes, and content updates all go through `dev` so the gate can run.

## Rollback

If a promotion needs to be reverted immediately:

```bash
# Roll main back to the pre-promotion tag (or any known-good ref)
git push origin backup/pre-autopromo-2026-07-08:main --force-with-lease
```

Then trigger a redeploy in the Vercel dashboard:

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
