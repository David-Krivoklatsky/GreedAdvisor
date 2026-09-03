# Deployment

## Vercel (Recommended)

```bash
# 1. Push to GitHub
# 2. Import in Vercel
# 3. Root Directory: repo root (monorepo). The root `vercel.json` runs
#    `npx turbo run build --filter=web`.
# 4. Add Secrets (not plain env vars):
#    - DATABASE_URL (Neon/Supabase/Railway)
#    - JWT_SECRET (32+ chars)
#    - ENCRYPTION_KEY (32 chars exactly)
#    - NEXTAUTH_SECRET (32+ chars)
#    - NEXTAUTH_URL (https://yourdomain.com)
#    - ENGINE_WEBHOOK_SECRET (for cron)
#    - TELEGRAM_BOT_TOKEN (optional)
#    - NOTIFICATION_WEBHOOK_URL (optional)
# 5. Deploy
```

**Key setting**: Root Directory = repo root. The root `vercel.json` sets the
install command (`npm ci`) and build command (`turbo build --filter=web`). Do
**not** set Root Directory to `apps/web` — the cron, build command and engine
env loading all expect the repo-root layout (there is no separate
`apps/web/vercel.json`).

## Cron / Engine trigger

The root `vercel.json` registers a cron that calls
`GET /api/engine/run?all=true` every 5 minutes. The route authenticates the
request against `ENGINE_WEBHOOK_SECRET`:

```bash
# The cron path in vercel.json has no secret in the URL. Instead, Vercel Secrets
# must be configured. The route accepts:
#   - ?secret=<ENGINE_WEBHOOK_SECRET> (GET, cron)
#   - x-engine-secret header          (POST)
#   - JSON body { "secret": ... }     (POST)
curl -G "https://<your-domain>/api/engine/run?all=true" \
  --data-urlencode "secret=$ENGINE_WEBHOOK_SECRET"
```

## Database

- Use Neon / Supabase / Railway / Vercel Postgres
- Run `DATABASE_URL="..." npm run db:push` once after deploy
- **Do not run `migrate deploy` or `prisma migrate dev`** — migration history is
  broken; the live DB is synced with `db:push`.

## Environment Variables (3 files)

| Location             | Purpose                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel Secrets       | `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ENGINE_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `NOTIFICATION_WEBHOOK_URL` |
| Root `.env` (engine) | `ENGINE_ENABLED=1`, `ENGINE_TICK_MS=60000`, `ENGINE_PAUSED=0`                                                                                                |
| `packages/db/.env`   | `DATABASE_URL` for Prisma CLI                                                                                                                                |

## Engine (Production)

PM2 single fork (never cluster):

```bash
pm2 start ecosystem.config.js --only greed-advisor-engine
```

## Docker (Alternative)

```bash
# Build
docker build -t greed-advisor -f apps/web/Dockerfile.prod .

# Run with compose
docker-compose -f docker-compose.prod.yml up -d
```

## Security Checklist

- [ ] Strong `JWT_SECRET` (32+ chars) & `ENCRYPTION_KEY` (32 chars exactly)
- [ ] HTTPS enforced
- [ ] Database SSL enabled
- [ ] Secrets in Vercel Secrets (not Environment Variables)
- [ ] Rate limiting active
- [ ] Monitoring: Sentry / Vercel Analytics / UptimeRobot

## Rollback

- Vercel: Instant rollback via dashboard
- Database: `psql $DATABASE_URL < backup.sql`
- Code: `git revert <commit> && git push`
