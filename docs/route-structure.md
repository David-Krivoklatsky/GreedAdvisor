# Route Structure

**Note**: The `routes/` directory described here was a proposal — it **does not exist** in the current codebase. Trust the code.

## Current Structure

API handlers live directly in `apps/web/app/api/**/route.ts` and compose middleware from `@greed-advisor/middleware`:

```typescript
// apps/web/app/api/auth/register/route.ts
import { withApiMiddleware, withValidation } from '@greed-advisor/middleware';
import { registerSchema } from '@greed-advisor/validations';
import { registerUser } from '@/lib/auth/register';

export const POST = withApiMiddleware(withValidation(registerSchema)(registerUser));
```

Handler signature: `(req: NextRequest, ctx: { userId?: string; data?: any; params?: any }) => Promise<NextResponse>`

## Middleware Chain

```typescript
withApiMiddleware(withAuth(handler)); // auth required
withApiMiddleware(withValidation(schema)(withAuth(handler))); // validate + auth
```

Context: `ctx.userId`, `ctx.data` (validated), `ctx.params`

## Error Envelope

```json
{ "success": false, "message": "...", "error": "..." }
```

500 errors never leak `error.message`.

## Rate Limiting

Auth endpoints (`register`, `login`) call `rateLimit(ip)` manually inside handler.
Other endpoints covered by middleware (orders, AI, automation, key creation).

## Adding a New Endpoint

1. Create `apps/web/app/api/<feature>/<action>/route.ts`
2. Import middleware + validation schema
3. Write handler in `apps/web/lib/<feature>/<action>.ts` (or inline)
4. Export `METHOD = withApiMiddleware(...)(handler)`
