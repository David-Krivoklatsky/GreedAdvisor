import { getActiveTradingClient } from '@/lib/providers';
import type { UnifiedInstrument } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESULTS = 50;

let cache: { at: number; instruments: UnifiedInstrument[] } | null = null;

export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const provider = await getActiveTradingClient(ctx.userId);

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active trading key found',
          error: 'No active trading key found'
        },
        { status: 404 }
      );
    }

    if (!cache || Date.now() - cache.at > CACHE_TTL_MS) {
      const instruments = await provider.getInstruments();
      cache = { at: Date.now(), instruments };
    }

    const query = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase();
    const limit = Math.min(
      Number(req.nextUrl.searchParams.get('limit') ?? '25') || 25,
      MAX_RESULTS
    );

    const instruments = cache.instruments
      .filter(i =>
        query
          ? i.ticker.toLowerCase().includes(query) ||
            (i.shortName ?? '').toLowerCase().includes(query) ||
            (i.name ?? '').toLowerCase().includes(query)
          : true
      )
      .slice(0, limit);

    return NextResponse.json({ success: true, instruments });
  })
);
