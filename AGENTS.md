## Deploys — READ FIRST
- GitHub Actions is DISABLED on this repo.
  Do not create, edit or wait on workflows for deploys.
- Release = push to `main`. Cloudflare Workers Builds deploys it (runs checks
  and D1 migrations). Confirm the build passed and check the live URL.
- Local direct release (only when asked or builds are broken): `npm run release`.
- Rollback: `npx wrangler rollback`.
- Cloud sessions: never run `wrangler deploy`; push to main instead.
- Never print or commit secret values. Secrets live in Cloudflare.

