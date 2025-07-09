# @greed-advisor/rate-limit

Zdieľaný balíček pre rate limiting API requestov.

## Funkcie

### `rateLimit(req: NextRequest)`

Implementuje rate limiting s in-memory úložiskom:

- **Window**: 15 minút
- **Max requests**: 100 za window
- **IP tracking**: Automatické rozpoznanie IP adresy
- **Cleanup**: Automatické mazanie expirovaných záznamov

```typescript
import { rateLimit } from '@greed-advisor/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limiting check
  const rateLimitResult = rateLimit(req);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // rateLimitResult.remaining - zostávajúce requesty

  // Pokračuj s API logikou...
}
```

## Konfigurácia

- `RATE_LIMIT_WINDOW` - 15 minút (15 _ 60 _ 1000ms)
- `RATE_LIMIT_MAX_REQUESTS` - 100 requestov na window
- Automatický cleanup každých 5 minút

## Závislosti

- `next/server` - NextRequest typ
