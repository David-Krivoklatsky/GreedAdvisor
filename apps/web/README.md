# Web App

Main Next.js 14 application for Greed Advisor - fullstack application with App Router.

## Structure

- `app/` - Next.js App Router pages and API routes
  - `api/` - Backend API endpoints
  - `dashboard/`, `login/`, `register/` - Frontend pages
- `components/` - React components
  - `ui/` - shadcn/ui base UI components
- `lib/` - App-specific utilities (e.g., Prisma client)

## Packages

This application uses shared packages from `../../packages/`:

- `@greed-advisor/auth` - JWT and bcrypt functions
- `@greed-advisor/db` - Prisma database
- `@greed-advisor/utils` - Utility functions (cn, clsx)
- `@greed-advisor/validations` - Zod schemas
- `@greed-advisor/rate-limit` - Rate limiting middleware

## Running

```bash
npm run dev
```

Application will be available at `http://localhost:3000`.
