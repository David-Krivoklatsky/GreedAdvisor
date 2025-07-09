# Web App

Hlavná Next.js 14 aplikácia pre Greed Advisor - fullstack aplikácia s App Router.

## Štruktúra

- `app/` - Next.js App Router stránky a API routes
  - `api/` - Backend API endpoints
  - `dashboard/`, `login/`, `register/` - Frontend stránky
- `components/` - React komponenty
  - `ui/` - shadcn/ui základné UI komponenty
- `lib/` - App-špecifické utilities (napr. Prisma klient)

## Packages

Táto aplikácia používa zdieľané packages z `../../packages/`:

- `@greed-advisor/auth` - JWT a bcrypt funkcie
- `@greed-advisor/db` - Prisma databáza
- `@greed-advisor/utils` - Utility funkcie (cn, clsx)
- `@greed-advisor/validations` - Zod schémy
- `@greed-advisor/rate-limit` - Rate limiting middleware

## Spustenie

```bash
npm run dev
```

Aplikácia bude dostupná na `http://localhost:3000`.
