# Previous project instructions

Historical architecture and operating evidence, preserved at b6f63b5cee88addf75295f134edb6c50032dbff4.
Current process and authorization are exclusively in [the authored contract](../agent-contract.md).
Past approvals are not permission. Verify dated facts against current code.
Read relevant sections only; paths below have been rebased for this reference.

## Previous AGENTS.md project material

## Deploys — READ FIRST
- GitHub Actions is OFF for every workflow except the Claude fallback review (`.github/workflows/claude-fallback-review.yml`, managed from digitronics2025/claude-config).
  Do not create, edit or wait on workflows for deploys.
- Release = push to `main`. Cloudflare Workers Builds deploys it (runs checks
  and D1 migrations). Confirm the build passed and check the live URL.
- Local direct release (only when asked or builds are broken): `npm run release`.
- Rollback: `npx wrangler rollback`.
- Cloud sessions: never run `wrangler deploy`; push to main instead.
- Never print or commit secret values. Secrets live in Cloudflare.

