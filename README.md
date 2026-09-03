# Greed Advisor

Autonomous trading advisor with encrypted API key storage, AI-powered market analysis, and a Next.js 16 dashboard.

## Quick Start

```bash
# Clone & install
git clone https://github.com/David-Krivoklatsky/GreedAdvisor.git
cd GreedAdvisor
npm install

# Start PostgreSQL (port 5433)
npm run db:up

# Generate Prisma client & push schema
npm run db:generate
npm run db:push

# Start dev (Next.js + engine)
npm run dev
```

App at `http://localhost:3000`. Engine runs automatically (set `ENGINE_ENABLED=0` in `.env` to disable).

## Architecture

- **Monorepo**: Turborepo + npm workspaces (Node 22)
- **App**: `apps/web` (Next.js 16 App Router)
- **Packages**: `packages/*` (shared TS, consumed raw via `transpilePackages`)
- **Database**: PostgreSQL (Neon/local Docker) via Prisma (`packages/db`)
- **Auth**: JWT (access 30m in localStorage, refresh 30d in httpOnly cookie)
- **Encryption**: AES-256-GCM at rest (`@greed-advisor/crypto`, `ENCRYPTION_KEY`)

## Key Commands

```bash
# Development
npm run dev          # Start web + engine
npm run build        # Build web
npm run lint         # ESLint
npm run test         # Jest (apps/web)

# Database
npm run db:up|down   # Docker Postgres (port 5433)
npm run db:generate  # Prisma generate
npm run db:push      # Push schema (no migrate)
npm run db:seed      # Seed demo data
npm run db:encrypt-keys  # Encrypt plaintext keys at rest

# Engine
npm run engine:start        # Scheduler (PM2 in prod, tsx in dev)
npm run engine:cycle <id>   # Run one cycle by config ID

# Formatting
npm run format|format:check  # Prettier
```

## Environment Files (3 required)

- Root `.env` — engine, webhook secrets, feature flags
- `packages/db/.env` — `DATABASE_URL` for Prisma CLI
- `apps/web/.env` — Next.js runtime vars

## Tech Stack

- Next.js 16, React 19, TypeScript strict
- Tailwind CSS + shadcn/ui
- Prisma ORM, PostgreSQL
- Twelve Data (market data), Trading212 (execution)
- OpenAI (AI reports), Vercel AI SDK
