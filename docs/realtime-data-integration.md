# Market Data Integration

**Actual implementation** (the Alpha Vantage/Finnhub/IEX/Polygon section was a plan, not implemented).

## Provider

**Twelve Data** — quotes, daily candles, earnings calendar, movers.
Configured per-user as **Market Data Keys** (Profile → Market Data Keys).

## Package

`@greed-advisor/market-data` (`packages/market-data`)

- `MarketDataService.getQuote(symbol, apiKey)` — real-time quote
- `MarketDataService.getCandles(symbol, interval, apiKey)` — daily/weekly candles
- `MarketDataService.getEarnings(symbol, apiKey)` — earnings calendar (injected into AI prompts)
- `MarketDataService.getMovers(market)` — Alpaca movers (us/eu/crypto)

## Usage

```typescript
import { MarketDataService } from '@greed-advisor/market-data';

const quote = await MarketDataService.getQuote('AAPL', userTwelveDataKey);
const candles = await MarketDataService.getCandles('AAPL', '1day', userTwelveDataKey);
const earnings = await MarketDataService.getEarnings('AAPL', userTwelveDataKey);
const movers = await MarketDataService.getMovers('us'); // no key needed
```

## API Routes

- `GET /api/market/quote?symbol=X`
- `GET /api/market/candles?symbol=X&interval=1day`
- `GET /api/market/earnings?symbol=X`
- `GET /api/market/movers?market=us|eu|crypto`

## Trading Data

Positions/orders from **Trading212 API** via `@greed-advisor/trading212`:

- `apps/web/app/api/user/positions/route.ts`
- `apps/web/app/api/ai/generate-report/route.ts` (consumes positions + market data)
