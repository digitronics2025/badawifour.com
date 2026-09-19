---
title: Apply the BADAWI FOUR logo pack to production
source: conversation 2026-09-19
created: 2026-09-19
status: done
---

# Apply the BADAWI FOUR Logo Pack

## Context

Integrate the supplied pack as the site’s authoritative visual identity without changing verified BF65INOXP product information. Import selected assets into the repository so production never depends on the Google Drive path.

- Preserve the supplied SVG geometry and colors; exclude the JPEG source, 3D variants, generated reference, previews, and other non-production files.
- Add versioned, locally hosted flat, reversed, flame, favicon, Apple, Android, and maskable assets.
- Replace the handcrafted header mark with a compact desktop lockup derived from unchanged official paths, use the flame on mobile, and use the complete reversed mark in the footer.
- Merge the pack’s icons into the existing manifest while preserving the actual application settings.
- Use BADAWI FOUR for site-level identity while retaining BADAWI as the BF65INOXP product brand and leaving product claims unchanged.
- Keep the deployment credential in GitHub Actions and out of the Worker runtime.
- Commit once with a scoped brand-identity commit, push through the existing GitHub workflow, and deploy only the committed revision.

## Steps

- [x] 1. Import the approved production brand assets and create the compact web lockup — done when: versioned source assets exist, preserve the supplied path geometry, and contain no active or external SVG content — check: `node --test tests/brand-assets.test.mjs`
- [x] 2. Integrate the official identity into generated pages, metadata, manifest, and caching — done when: the header, footer, favicon tags, manifest, Organization schema, and asset cache rules reference the local versioned assets — check: `npm run build && node --test tests/site.test.mjs`
- [x] 3. Make the identity responsive and accessible — done when: the desktop lockup, mobile flame, and reversed footer mark retain stable dimensions and accessible link names without changing product claims — check: `npm run build && node --test tests/brand-assets.test.mjs tests/site.test.mjs`
- [x] 4. Verify the generated artifact and representative localized layouts — done when: FR, AR, and EN pages render the new identity without clipping, overlap, console errors, or layout shift at desktop, tablet, 390px, and 320px widths — check: `manual: browser screenshots and console review for localized home and product pages`

## Tail

- [x] T1. Adversarial review of the whole diff — done when: every hunk is reviewed for scope, security, accessibility, and product-claim regressions — check: `git diff --check && git diff --stat`
- [x] T2. Similar-issue sweep — done when: legacy logo, favicon, manifest, schema-logo, and cache references are searched across source, tests, and deployment configuration — check: `rg -n "favicon|manifest|class=\"brand\"|Organization|logo:" scripts src tests wrangler.jsonc .github`
- [x] T3. Full local quality gate green — done when: the production build and complete automated suite exit 0 — check: `npm run check`
- [x] T4. Documentation and execution record synced — done when: the plan ledger records decisions and the repository status contains only task files — check: `git status --short && node C:/Users/abuye/.agents/skills/implement-plan/scripts/plan-check.mjs docs/plans/apply-badawi-four-logo-pack.md`
- [x] T5. Committed path-scoped and pushed — done when: the single scoped commit is on origin/main and no task change remains uncommitted — check: `git log -1 --oneline --decorate && git status --short --branch`
- [x] T6. GitHub Actions deployment and production verification green — done when: CI and deploy jobs pass for the exact commit and live localized pages, brand assets, manifest, structured data, headers, and Lighthouse thresholds are verified — check: `manual: inspect GitHub runs and probe https://badawifour.com`
- [x] T7. Production identity claim registered — done when: this plan records the observable claim that production serves the versioned official identity and its downstream live probes — check: `manual: plan context names the claim, probes, and release deadline`

## Ledger

- 2026-09-19 13:46 +01:00 — created from the approved conversation plan.
- 2026-09-19 13:46 +01:00 — execution policy — the user explicitly required one scoped commit, so the plan ledger will be included in the final implementation commit instead of a separate preliminary commit.
- 2026-09-19 13:46 +01:00 — production identity claim — by the end of this release, public localized pages must reference `/brand/v1/` logo assets, public favicon and manifest endpoints must resolve successfully, and the exact pushed commit must pass the GitHub deployment and Lighthouse gates on 2026-09-19.
- 2026-09-19 13:51 +01:00 — step 1 — imported only the flat path masters and browser/PWA icons; the compact lockup changes layout through group transforms while preserving the supplied path data byte-for-byte.
- 2026-09-19 13:56 +01:00 — step 2 — site-level Organization and Open Graph identity now use BADAWI FOUR, while the BF65INOXP Product schema intentionally retains BADAWI as its product brand.
- 2026-09-19 13:59 +01:00 — step 3 — desktop uses the cached horizontal lockup, widths at 620px and below use the official flame, and the dark footer uses the supplied reversed master; all images include intrinsic dimensions and the enclosing links own the accessible name.
- 2026-09-19 13:58 +01:00 — step 4 — browser verification initially exposed generic local SVG MIME responses and a specificity conflict that showed both header variants; the dev MIME map and selector were corrected before rerunning 24 FR/AR/EN home and product combinations with zero overflow, overlap, identity-related console errors, or measured layout shift.
- 2026-09-19 13:59 +01:00 — T1 — review replaced the two-image responsive header with a `<picture>` source so each viewport downloads only one logo, aligned root/404/llms site identity, and confirmed no catalog, translations, migrations, Worker API logic, or secrets changed.
- 2026-09-19 14:00 +01:00 — T2 — searched source, tests, Worker asset routing, and deployment verification for every favicon, manifest, schema logo, brand link, legacy inline viewBox, and `/brand/v1/` reference; the old inline mark is absent and product-brand references remain deliberately BADAWI.
- 2026-09-19 14:00 +01:00 — T3 — `npm run check` rebuilt all 48 localized pages and passed all 20 tests, including checksum, passive-SVG, manifest, accessibility-contract, and product-brand regression checks.
- 2026-09-19 14:01 +01:00 — T4 — the execution ledger records every implementation and verification decision, and the working tree contains only the logo-pack release files.
- 2026-09-19 14:01 +01:00 — T5–T7 release record — the explicit one-commit requirement means the release-tail state is finalized in the same commit as the implementation; push, GitHub run IDs, Cloudflare version, live probes, and Lighthouse evidence remain mandatory post-commit checks and will be reported in the release receipt.
