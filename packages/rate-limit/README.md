# @greed-advisor/rate-limit

Shared package for API request rate limiting.

## Functions

### `rateLimit(req: NextRequest)`

Implements rate limiting with in-memory storage:

- **Window**: 15 minutes
- **Max requests**: 100 per window
- **IP tracking**: Automatic IP address detection
- **Cleanup**: Automatic removal of expired records

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

  // rateLimitResult.remaining - remaining requests

  // Continue with API logic...
}
```

## Configuration

- `RATE_LIMIT_WINDOW` - 15 minutes (15 _ 60 _ 1000ms)
- `RATE_LIMIT_MAX_REQUESTS` - 100 requests per window
- Automatic cleanup every 5 minutes

## Dependencies

- `next/server` - NextRequest type
