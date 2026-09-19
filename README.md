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

Only verified BF65INOXP facts are published. Do not infer dimensions, capacity, gas configuration, country of manufacture or safety features from photography. Add verified specifications to `scripts/build.mjs` only after checking the manufacturer technical sheet.
