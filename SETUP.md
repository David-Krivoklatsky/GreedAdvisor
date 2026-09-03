# Setup Guide

## Prerequisites

- Node.js 22 (per `.nvmrc`)
- Docker Desktop (for Postgres)
- npm 11.4.2+

## Quick Start

```bash
git clone https://github.com/David-Krivoklatsky/GreedAdvisor.git
cd GreedAdvisor

# Install deps (root)
npm install

# Start Postgres on port 5433
npm run db:up

# Generate Prisma client & push schema
npm run db:generate
npm run db:push

# Optional: seed demo data
npm run db:seed

# Start dev (Next.js + trading engine)
npm run dev
```

App at `http://localhost:3000`. Engine runs by default — set `ENGINE_ENABLED=0` in root `.env` to disable.

## Database

```bash
# Connection (Docker)
Host: localhost
Port: 5433
Database: greed_advisor
User: postgres
Password: postgres

# Prisma Studio
cd apps/web && npx prisma studio
```

## Useful Commands

```bash
npm run db:down           # Stop Postgres
npm run format            # Prettier
npm run lint              # ESLint
npm run build             # Build web
npm run test              # Jest
npm run db:encrypt-keys   # Encrypt plaintext keys at rest
```

## Environment Files (3 required)

| File               | Purpose                         |
| ------------------ | ------------------------------- |
| `.env` (root)      | Engine, webhooks, feature flags |
| `packages/db/.env` | `DATABASE_URL` for Prisma CLI   |
| `apps/web/.env`    | Next.js runtime vars            |

Copy `.env.example` in each location and fill in values.

## CI/CD

GitHub Actions runs on push to `main`/`develop`:

1. `lint` → 2. `type-check` → 3. `db:migrate` → 4. `test` → 5. `build`

Local CI debug:

```bash
export CI=true
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/greed_advisor_test"
npm run db:up && npm run db:migrate
```

## Production Deploy (Vercel)

1. Push to GitHub
2. Import in Vercel, set **Root Directory** to `apps/web`
3. Add secrets: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `NEXTAUTH_URL`
4. Deploy
