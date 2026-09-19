---
title: Rich, Premium BADAWI FOUR Homepage Experience
source: conversation 2026-09-19
created: 2026-09-19
status: done
---

# Rich, Premium BADAWI FOUR Homepage Experience

## Context

## Summary

Transform the homepage into an immersive brand and shopping journey combining real product photography, generated culinary imagery, verified comparisons, live retailer information, video, buying guidance, support, and strong Digitronics conversion paths.

The page remains fast, multilingual, accessible, and strictly limited to verified product claims.

## Homepage Experience

### 1. Immersive Hero

- Create a premium split-screen composition using the localized “Cooking brings us together” brand promise.
- Present both real BADAWI products over an atmospheric Moroccan-kitchen background containing no generated appliances, logos, or text.
- Use one primary catalog CTA and one Digitronics WhatsApp CTA.
- Include compact signals for two documented models, verified information, and purchase through Digitronics.

### 2. Trust and Purchase Strip

Show:

- Verified specifications only.
- Price and availability confirmed by Digitronics.
- Delivery details confirmed during ordering.

### 3. Guided Product Selection

Provide two clear paths:

- Gas oven → BF65INOXP.
- Four-burner gas cooker → BF65CINOX.

Each aligned card includes approved photography, verified specifications, live retailer information, product details, and model-specific WhatsApp ordering. Retailer failures fall back to “Confirm with Digitronics” without delaying rendering.

### 4. Product Comparison

Present an accessible comparison covering:

- Product type.
- Verified dimensions.
- Inox finish.
- Doors or burners.
- Verified weight where available.

Unknown values remain explicitly unpublished.

### 5. BADAWI FOUR Story

Create an editorial section about everyday cooking, shared meals, understated inox styling, and two formats for different kitchen plans. Use a generated shared-table image with Moroccan culinary details and no invented appliance.

### 6. Verified Design Details

Show model-labelled panels for:

- Inox finish.
- BF65INOXP glazed doors.
- BF65INOXP front controls.
- BF65CINOX four burners.

### 7. Product Video

Feature the existing official showcase video with an optimized poster, no autoplay, deferred loading, accessible controls, localized fallback text, and existing video analytics.

### 8. Cooking Inspiration

Build an editorial mosaic from approved food imagery and one generated preparation close-up, with localized captions and a link to the Inspiration page.

### 9. Buying Journey

Explain three steps:

1. Choose a documented model.
2. Confirm price, stock, and delivery with Digitronics.
3. Access registration, guides, and support after purchase.

### 10. Conversion Banner

Add a full-width purchase section with catalog, retailer, and Digitronics WhatsApp actions. Provide a compact mobile WhatsApp action after the hero without obscuring content.

### 11. Support and Care

Provide clear routes to:

- Product registration.
- Support requests.
- Inox and glass care guidance.
- Installation guidance.

### 12. Buying FAQ

Add localized expandable answers covering product selection, pricing, availability, delivery, installation, dimensions, and support. Generate matching `FAQPage` structured data.

### 13. Footer

Improve product, buying, support, language, privacy, and legal navigation while preserving the official reversed logo and correctly identifying Digitronics as the retailer.

## Visual and Media System

- Generate three decorative assets:
  - Moroccan-kitchen hero atmosphere.
  - Shared-table editorial scene.
  - Culinary preparation close-up.
- Generated media must not depict BADAWI appliances or contain logos, labels, packaging, or words.
- Use approved photographs whenever a BADAWI product appears.
- Store responsive WebP assets under `/home/v1/`.
- Generate suitable 640px, 960px, 1440px, and source-width variants.
- Set intrinsic dimensions and stable aspect ratios.
- Preload only the hero; lazy-load below-fold media.
- Use warm ivory, charcoal, brushed-metal neutrals, BADAWI red, and WhatsApp green only for WhatsApp.
- Use lightweight CSS motion with full reduced-motion support.

## Content, SEO, and Interfaces

- Add dedicated FR/AR/EN homepage content fields.
- Update homepage title, description, Open Graph image, and internal linking.
- Expand homepage JSON-LD with Organization, WebSite, ItemList, and visible FAQPage information.
- Add versioned public assets under `/home/v1/`.
- Reuse the existing retailer API for both models.
- Use a general BADAWI WhatsApp message in the hero and model-specific messages in product cards.
- Reuse existing analytics events.
- Make no D1 schema, R2 privacy, form, migration, secret, or Worker-security changes.

## Claim Safety

Do not publish unsupported claims concerning:

- Oven capacity.
- Ergonomics.
- Gas efficiency.
- Dark-blue finish.
- Material longevity or durability.
- Stain resistance.
- Heating speed or uniformity.
- Comparative or “fair” pricing.
- Guaranteed cooking results.
- Warranty coverage.

Verified catalog data remains the sole source of technical product claims.

## Verification and Release

- Test localized sections, comparison data, structured data, retailer fallbacks, video, CTAs, analytics attributes, and unsupported-claim exclusions.
- Validate generated media dimensions, responsive outputs, caching, and local ownership.
- Verify FR, AR, and EN at 1440px, 1024px, 768px, 390px, and 320px.
- Check RTL layout, navigation, accordions, focus order, sticky actions, touch targets, video controls, alignment, and overflow.
- Test slow-network and retailer-API failure states.
- Require no serious accessibility violations or console errors.
- Require Lighthouse scores of at least 95 performance and 100 accessibility, best practices, and SEO, with CLS no higher than 0.1.
- Commit once, push through GitHub Actions, deploy the exact committed revision, and re-test production until CI and deployment are green.

## Assumptions

- The homepage represents both current products equally.
- Moroccan households are the primary audience.
- Digitronics remains the identified retailer and WhatsApp destination.
- Generated imagery supplies atmosphere only.
- Existing security architecture and verified product data remain unchanged.

## Steps

- [x] 1. Generate and version three truthful decorative homepage assets — done when: source masters and responsive WebP variants exist locally without appliances, logos, labels, packaging, or words — check: `npm run build && node --test tests/homepage-experience.test.mjs`
- [x] 2. Add complete FR/AR/EN homepage presentation content — done when: every new homepage section and fallback label has localized source content — check: `node --test tests/homepage-experience.test.mjs`
- [x] 3. Build the immersive hero and trust strip — done when: the server-rendered hero presents both products, one catalog CTA, one general Digitronics WhatsApp CTA, and three trust signals — check: `node --test tests/homepage-experience.test.mjs`
- [x] 4. Build guided product cards with live retailer states — done when: both models show approved facts, model-specific actions, and usable loading/error fallbacks — check: `node --test tests/homepage-experience.test.mjs`
- [x] 5. Add an accessible verified product comparison — done when: both products and explicit unknown values render semantically in every locale — check: `node --test tests/homepage-experience.test.mjs`
- [x] 6. Add the editorial BADAWI FOUR story — done when: localized safe brand copy and the generated shared-table image render without unverified performance claims — check: `node --test tests/homepage-experience.test.mjs`
- [x] 7. Add model-labelled verified design details — done when: every detail names the applicable model and is sourced from verified catalog data — check: `node --test tests/homepage-experience.test.mjs`
- [x] 8. Add the official product video with deferred behavior — done when: the video has a stable poster, controls, no autoplay, deferred source loading, fallback copy, and existing analytics — check: `node --test tests/homepage-experience.test.mjs`
- [x] 9. Add the editorial cooking-inspiration mosaic — done when: approved and generated media have localized captions, stable geometry, and an Inspiration link — check: `node --test tests/homepage-experience.test.mjs`
- [x] 10. Add the three-step buying journey — done when: the page explains selection, Digitronics confirmation, and BADAWI support without unsupported fulfillment promises — check: `node --test tests/homepage-experience.test.mjs`
- [x] 11. Add the final conversion banner and mobile sticky action — done when: catalog, retailer, and general WhatsApp actions work, and the sticky action appears only after the hero without covering content — check: `node --test tests/homepage-experience.test.mjs`
- [x] 12. Consolidate support and care routes — done when: registration, support, cleaning, and installation guidance are directly linked in all locales — check: `node --test tests/homepage-experience.test.mjs`
- [x] 13. Add the localized buying FAQ — done when: visible accessible disclosures and matching FAQPage structured data cover the approved questions — check: `node --test tests/homepage-experience.test.mjs`
- [x] 14. Enrich the footer — done when: product, buying, support, language, legal, and retailer context are clear without changing the official logo — check: `node --test tests/homepage-experience.test.mjs`
- [x] 15. Apply the premium responsive visual and motion system — done when: page-scoped styles support desktop, tablet, mobile, RTL, keyboard focus, reduced motion, stable media, and no overflow — check: `manual: verified FR/EN/AR at 1440/1024/768/390/320, RTL, keyboard order, menu, FAQ, sticky CTA, reduced motion, no-JavaScript navigation, and zero overflow`
- [x] 16. Complete homepage SEO, social, analytics, and public interfaces — done when: localized metadata, local social media, Organization/WebSite/ItemList/FAQ JSON-LD, tracked CTAs, and `/home/v1/` caching are consistent — check: `node --test tests/homepage-experience.test.mjs`
- [x] 17. Enforce claim safety and architecture boundaries — done when: unsupported claims and warranty language are absent while Worker secrets, D1, R2, forms, migrations, and APIs remain unchanged — check: `npm run check && git diff -- src/worker.mjs migrations wrangler.toml`
- [x] 18. Run the full responsive, accessibility, failure-state, performance, CI, deployment, and live verification matrix — done when: all named checks pass on the exact deployed revision — check: `npm run check && npm run audit:prod` (homepage production: 96/100/100/100, CLS 0)

## Tail

- [x] T1. Adversarial review of the whole diff — done when: every finding is fixed or written to the Ledger with a reason — check: `git diff --stat` reviewed hunk by hunk
- [x] T2. Similar-issue sweep — done when: sibling pages, endpoints, helpers and translations were searched for the same pattern — check: `manual: reviewed localized footer routes, responsive images, homepage claims, analytics, and structured-data patterns; no unresolved sibling defect found`
- [x] T3. Lint and tests green — done when: the complete repository gate exits 0 — check: `npm run check` (49/49 tests passed)
- [x] T4. Docs synced per the repo's rules — done when: the persisted plan and implementation record reflect the completed change — check: `git diff --stat docs/`
- [x] T5. Committed path-scoped and pushed — done when: `git status` shows none of this work uncommitted and the push succeeds — check: implementation commit `6ff14237bab7b60b13ca41ba3fcb4cbaaf19af4f` pushed to `origin/main`
- [x] T6. Confirmed live where the push deploys — done when: the changed homepage, assets, CTAs, structured data, and deployment are observed on production — check: FR/AR/EN, local media, retailer APIs, mobile menu, FAQ, sticky WhatsApp, structured data, cache headers, and Cloudflare version `a55ebc12-3d5d-4199-8556-70259ae7e22b` verified
- [x] T7. A claim registered for this change — done when: this plan records a downstream production probe and deadline — check: `manual: verified the production homepage probe and 2026-09-19 deadline below`

## Claim

- Expected outcome: production FR/AR/EN homepages expose the premium verified two-product journey with working Digitronics conversion paths and no unsupported claims.
- Downstream probe: load the three production homepages, parse visible sections and JSON-LD, exercise menu/FAQ/sticky/WhatsApp links without sending a message, and run the production Lighthouse gate.
- Deadline: 2026-09-19 before closing this plan.

## Ledger

- 2026-09-19 19:00 — created from conversation 2026-09-19
- 2026-09-19 — browser review found and fixed an incorrect footer registration route and a no-JavaScript mobile navigation layout shift.
- 2026-09-19 — local verification passed at 1440, 1024, 768, 390, and 320 px; retailer failure and slow-network fallbacks remained usable; Lighthouse passed 95/100/100/100 with CLS 0.
- 2026-09-19 — implementation `6ff14237bab7b60b13ca41ba3fcb4cbaaf19af4f` passed CI and Cloudflare deployment; production homepage Lighthouse passed 96/100/100/100 with CLS 0; Worker version `a55ebc12-3d5d-4199-8556-70259ae7e22b`.
