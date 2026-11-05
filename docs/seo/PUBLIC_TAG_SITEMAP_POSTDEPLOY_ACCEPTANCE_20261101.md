# HealthyLifeStyles — public Wellness Hub tag sitemap post-deploy acceptance

**Status on 2026-11-01: LIVE DISCOVERY GAP VERIFIED; PR #17 NOT MERGED OR DEPLOYED.**

This is a read-only public evidence checkpoint and future acceptance procedure, not authorization to merge, deploy, request indexing or change Google Search Console settings. This is a public snapshot, not a claim about Google's own index.

## Reproduced public baseline — 2026-11-01

- The live robots.txt references the canonical sitemap-index.xml, which contains one child, sitemap-0.xml.
- The published child sitemap listed **164 URLs** and **zero** /wellness-hub/tag/ URLs.
- The public /wellness-hub HTML linked to **28 distinct** /wellness-hub/tag/:slug archives. All 28 of those linked archive URLs were missing from the public sitemap in this snapshot.
- Sampled publicly accessible archives included nutrition (6 articles), sleep (3), blood-pressure (2), strength-training (3), protein (3), and evidence-based (35). The inspected metadata had matching self-canonicals and no visible noindex direction. Hydration had a self-canonical and visible article as well.
- The samples do not establish the index status or full HTML integrity of every tag page.

These facts demonstrate a sitemap-discovery omission, **not** that Google necessarily rejected the 28 pages. Crawlers can also discover them through internal links.

## Code-build versus real production acceptance

PR #17 (fix/seo-wellness-tag-sitemap-20261031) adjusts the sitemap filter to allow eligible CMS-backed /wellness-hub/tag/:slug paths without allowing legacy /tag/*, private routes, noindex or non-self-canonical URLs.

The existing scripts/seo/verify-built-tag-sitemap.mjs checks published-CMS build output and Vercel bundle parity. This is a CI artifact test, not proof of a live deployment.

The NEW scripts/seo/verify-public-tag-sitemap.mjs runs a separate bounded **public GET-only** post-deployment acceptance check. It is inert by default. Its offline tests at scripts/seo/__tests__/public-tag-postdeploy.test.mjs cover missing tags, duplicates, unsafe child sitemap origins, excluded legacy aliases, noindex, wrong canonical, redirects, oversized responses, and an inert command-line interface.

## Operator process — only AFTER an authorized production release

First verify a new Vercel Production Ready build for the exact owner-approved frontend commit. Only then may the operator run the following public read-only verification from a trusted environment:

    HLS_PUBLIC_TAG_SITEMAP_READONLY_APPROVED=yes node scripts/seo/verify-public-tag-sitemap.mjs --verify

The verifier contacts the **fixed** https://www.healthylifesstyles.com origin only. It reads the sitemap index, up to ten canonical child sitemap files, the Wellness Hub landing page, and up to three representative tag archives. Each request is capped at 10 seconds; response bodies have a size limit. It uses neither credentials nor POSTs, and it does not follow redirects, change files, request indexing or invoke CMS/Neon.

Acceptance requires: a valid same-origin index and child sitemap set without duplicate locations; at least one tag sitemap location; no legacy /tag/* entries; every archive linked on the public Wellness Hub represented in the sitemap; sample archives responding HTTP 200 with exact self-canonicals and no noindex/none directive; and a sanitized public counts-only success receipt. Counts can legitimately change when published CMS data changes.

For a safe pre-release no-network check:

    node scripts/seo/verify-public-tag-sitemap.mjs --check

This is also the default behavior with no arguments.

**Separate release and indexing gates remain NO-GO:** the check does not prove Google's selected canonical, actual indexation, Search Console account permission, Hostinger staging or Neon recovery, and never authorizes IndexNow or article publication. PR #17 remains open and must not merge or deploy without a separate owner release decision. After a permitted release, record the exact commit, Production Ready artifact identity, verification time, counts and any exceptions before accepting the change.
