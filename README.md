# BADAWI brand website

Official multilingual BADAWI brand site for `badawifour.com`.

## Architecture

- Zero-runtime-dependency static site generator in `scripts/build.mjs`
- Cloudflare Worker for APIs and static asset delivery
- Cloudflare D1 for registrations, support, professional and contact records
- Private R2 bucket for receipt/support uploads
- FR / AR (RTL) / EN
- Product-first SEO and conversion architecture

## Local development

```bash
npm install
npm run build
npm run dev
```

Then open `http://localhost:8788/fr/`.

## Production resources

Create these Cloudflare resources once:

- D1 database: `badawifour-prod`
- Private R2 bucket: `badawifour-private-uploads`
- Worker secret: `RATE_LIMIT_SALT`

Apply `migrations/0001_init.sql`, then add D1/R2 bindings to `wrangler.jsonc`.

## Deployment

Preferred: Cloudflare Workers Builds connected to GitHub. GitHub Actions deployment is also included and activates automatically when these repository secrets exist:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Product truth policy

Only verified product facts are published. The current catalog contains BF65INOXP and BF65CINOX; each product owns its localized content, verified specifications, media and Digitronics URL in `src/catalog.mjs`. Do not infer dimensions, capacity, gas configuration, country of manufacture, safety features or other claims from photography.

BF65CINOX uses a repository-owned approved source image. The build verifies its SHA-256 and source dimensions before generating non-upscaled responsive WebP assets under `/products/v1/bf65cinox/`. Add or change verified specifications only after checking an authoritative technical source, and update the catalog, tests and discovery output together.

## Product-aware public interfaces

- Product pages: `/{fr|ar|en}/products/{product-slug}/`
- Retailer data: `GET /api/retailer/{product-slug}` for catalog allowlisted slugs
- Forms accept only catalog model numbers and retain the existing D1 schema
- WhatsApp actions always target Digitronics and include the selected product model and localized product URL

Retailer responses expose `model`, `slug`, `price`, `currency`, `availability`, backward-compatible `in_stock`, `url`, `source` and `checked_at`. Availability is one of `in_stock`, `on_order`, `out_of_stock` or `unknown`; never publish retailer price as static Product structured data.
