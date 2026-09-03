# CI Troubleshooting

## Common Issue: `DATABASE_URL` not found in Prisma

**Cause**: Turbo runs `db:migrate` in `packages/db`; env vars don't propagate to Prisma process.

**Fix**: CI workflow (`.github/workflows/ci.yml`) now:

1. Runs `scripts/setup-env.sh` to create `.env` files in root, `packages/db`, `apps/web`
2. Turbo config passes env vars to DB tasks:
   ```json
   "db:migrate": { "cache": false, "env": ["DATABASE_URL", "JWT_SECRET", "NEXTAUTH_SECRET", "ENCRYPTION_KEY"] }
   ```
3. Waits for Postgres readiness before migrate:
   ```yaml
   - run: for i in {1..30}; do pg_isready -h localhost -p 5432 -U postgres && break; sleep 2; done
   ```

## Debugging Locally

```bash
docker run -d --name test-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=greed_advisor_test -p 5433:5432 postgres:15
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/greed_advisor_test"
export JWT_SECRET="test-jwt-secret"
npm run db:migrate
```

## CI Pipeline Order

1. `lint` → 2. `type-check` (runs `db:generate` + `tsc --noEmit`) → 3. `db:migrate` → 4. `test` → 5. `build`

## Secrets vs Env Vars

- **Production**: GitHub Secrets → `${{ secrets.DATABASE_URL }}`
- **CI testing**: Hardcoded in workflow (test DB, test secrets)

## Quick Fixes

| Issue                 | Fix                                               |
| --------------------- | ------------------------------------------------- |
| Postgres not ready    | Increase wait loop / health check interval        |
| Env var scope         | Use `GITHUB_ENV` for persistence across steps     |
| DB name mismatch      | Ensure `greed_advisor_test` matches CI service    |
| Prisma generate fails | Add explicit `npx prisma generate` before migrate |
