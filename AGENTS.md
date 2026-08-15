# AGENTS.md

Turborepo + npm workspaces monorepo (Node 18 per `.nvmrc`, npm@11.4.2). Only app: `apps/web` (Next.js 14 App Router). Shared TS packages in `packages/*` (`ai`, `auth`, `config`, `db`, `market-data`, `middleware`, `rate-limit`, `trading212`, `types`, `utils`, `validations`), consumed as raw TS (`main: index.ts`, no build step); Next.js transpiles them via `transpilePackages`.

## Commands (run from root; turbo delegates to whichever workspace defines the script)

- `npm run dev` / `build` / `lint` — Next.js app tasks (`lint` passes with warnings only)
- `npm run test` — jest in `apps/web`. Single test: `cd apps/web && npx jest __tests__/api/auth/register.test.ts`
- `npm run db:up` / `db:down` — docker-compose Postgres (host port **5433**, not 5432)
- `npm run db:generate|migrate|push|seed|reset` — Prisma in `packages/db`
- `npm run format` / `format:check` — Prettier on `**/*.{ts,tsx,md,json}`
- Pre-commit: lint-staged runs `eslint --fix` + `prettier --write`. Conventional Commits enforced by `commitlint.config.js` (the husky `commit-msg` hook is currently disabled, so it is not actually enforced).

## Gotchas

- **`npm run type-check` is a no-op.** No workspace defines a `type-check` script, so turbo runs only its `db:generate` dependency and reports "success". Real type checking only happens during `next build`; for a standalone check run `npx tsc --noEmit` in `apps/web`.
- **npm 11 arborist bug**: incremental `npm install`/`npm ls` can fail with `Cannot read properties of undefined (reading 'ruleset')` when the `overrides` tree changes. Workaround: delete `node_modules` + `package-lock.json` and clean-install.
- **Dependency pins** (do not "fix" without reproducing): `next` must stay pinned to exact `15.4.11` (15.5.x regresses the `/_not-found` prerender), `react`/`react-dom` `^18.3.1` declared at the **root** `package.json` (duplicate React 19 at root caused `Objects are not valid as a React child` at build), `eslint` `^8.57.1` (ESLint 9 needs flat config; `eslint-config-next@15.5.23` has no flat export), `@babel/runtime` in `apps/web` (required by `cmdk@0.2.1`).
- **Three separate `.env` files are required**: root `.env`, `packages/db/.env` (Prisma CLI reads this one), `apps/web/.env` (Next.js). `scripts/setup-env.sh` writes all three (used by CI).
- Turbo caches `db:generate` keyed on `packages/db/prisma/schema.prisma` + `packages/db/.env`; after changing `DATABASE_URL` in that `.env`, the cached Prisma client may be stale.
- Env constraints enforced by `@greed-advisor/config`: `JWT_SECRET`/`NEXTAUTH_SECRET` ≥ 32 chars, `ENCRYPTION_KEY` exactly 32 chars. `@greed-advisor/auth` throws at import time if `JWT_SECRET` is missing (tests mock it, real code needs it).
- Prisma schema lives at `packages/db/prisma/schema.prisma` — **not** `apps/web/prisma`.
- **Stale docs**: `README.md` and `docs/database.md` describe the old single-key `User` model; `docs/route-structure.md` describes a `routes/` directory that does not exist. Trust the code.
- API keys are stored in plaintext (`apiKey` is `Text` in the schema). Rate limiting is in-memory (100 req / 15 min per IP).
- To add a new `@greed-advisor/*` package, you must update `apps/web/next.config.js` (`transpilePackages`), `apps/web/tsconfig.json` (`paths`), and `apps/web/jest.config.js` (`moduleNameMapper`).

## Conventions

- TypeScript strict; `@/*` path alias maps to `apps/web/*`.
- API handlers in `apps/web/app/api/**/route.ts` compose wrappers from `@greed-advisor/middleware` (`withApiMiddleware`, `withValidation`, `withAuth`) and Zod schemas from `@greed-advisor/validations`.
- Auth flow: access token (30 min) in localStorage via `apps/web/lib/token-manager.ts`; refresh token (30 d) in httpOnly cookie. On 401 the client refreshes and retries.
- `apps/web/next.config.js` sets `eslint.ignoreDuringBuilds: true` — the build will not fail on lint errors; run `npm run lint` explicitly.
- CI (GitHub Actions, branches `main`/`develop`) order: lint → type-check → `db:migrate` → test → build.
