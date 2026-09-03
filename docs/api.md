# API Reference

Base: `/api` (Next.js App Router handlers in `apps/web/app/api/**/route.ts`)

Middleware chain: `withApiMiddleware(withAuth(handler))` or `withApiMiddleware(withValidation(schema)(withAuth(handler)))`
Context: `ctx.userId`, `ctx.data` (validated), `ctx.params`

## Auth

| Method | Endpoint         | Description                                 |
| ------ | ---------------- | ------------------------------------------- |
| POST   | `/auth/register` | Register (rate-limited inline)              |
| POST   | `/auth/login`    | Login (rate-limited inline)                 |
| POST   | `/auth/refresh`  | Refresh access token (reads refresh cookie) |
| POST   | `/auth/logout`   | Clear refresh cookie                        |

## User

| Method | Endpoint                    | Description                                                                  |
| ------ | --------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/user/me`                  | Current user profile + keys                                                  |
| PUT    | `/user/api-keys`            | Upsert encrypted API keys (provider: openai, twelvedata, trading212, alpaca) |
| DELETE | `/user/api-keys?provider=x` | Delete a key                                                                 |

## Watchlist

| Method | Endpoint                   | Description   |
| ------ | -------------------------- | ------------- |
| GET    | `/user/watchlist`          | List symbols  |
| POST   | `/user/watchlist`          | Add symbol    |
| DELETE | `/user/watchlist?symbol=X` | Remove symbol |

## Automation (Bots)

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/user/automation`                   | List configs             |
| POST   | `/user/automation`                   | Create config            |
| GET    | `/user/automation/[id]`              | Get config + recent runs |
| PATCH  | `/user/automation/[id]`              | Update config            |
| DELETE | `/user/automation/[id]`              | Delete config            |
| POST   | `/user/automation/[id]/run`          | Trigger one engine cycle |
| GET    | `/user/automation/[id]/runs`         | Paginated run history    |
| GET    | `/user/automation/[id]/runs/[runId]` | Run detail + steps       |

## Signals (approval flow)

| Method | Endpoint                     | Description                                                           |
| ------ | ---------------------------- | --------------------------------------------------------------------- |
| GET    | `/user/signals`              | List signals (`pending_approval`, `approved`, `rejected`, `executed`) |
| POST   | `/user/signals/[id]/approve` | Approve → queue for execution                                         |
| POST   | `/user/signals/[id]/reject`  | Reject                                                                |

## Positions & Market Data

| Method | Endpoint                                 | Description                                       |
| ------ | ---------------------------------------- | ------------------------------------------------- |
| GET    | `/user/positions`                        | Open/closed positions (with P&L)                  |
| GET    | `/user/positions/[id]`                   | Position detail + trail/stop                      |
| GET    | `/market/quote?symbol=X`                 | Twelve Data quote (requires user Market Data Key) |
| GET    | `/market/candles?symbol=X&interval=1day` | Daily candles                                     |
| GET    | `/market/earnings?symbol=X`              | Earnings calendar                                 |
| GET    | `/market/movers?market=us                | eu                                                | crypto` | Top movers (Alpaca) |

## AI Reports

| Method | Endpoint              | Description                                                                          |
| ------ | --------------------- | ------------------------------------------------------------------------------------ |
| POST   | `/ai/generate-report` | Generate report (strategy-aware: momentum/trend/mean_reversion/breakout/scalp/swing) |

## Engine (internal / cron)

| Method | Endpoint      | Description                                                           |
| ------ | ------------- | --------------------------------------------------------------------- |
| POST   | `/engine/run` | Vercel cron / cron-job.org trigger (requires `ENGINE_WEBHOOK_SECRET`) |
| GET    | `/engine/run` | Health check                                                          |

## Error Envelope

```json
{ "success": false, "message": "...", "error": "..." }
```

500 errors never leak `error.message`.

## Rate Limiting

- In-memory: 100 req / 15 min / IP
- Covers: auth, orders, AI, automation, key creation
