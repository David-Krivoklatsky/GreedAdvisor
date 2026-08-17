import { getActiveT212Client } from '@/lib/providers';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import type { T212TradableInstrument } from '@greed-advisor/trading212';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESULTS = 50;

let cache: { at: number; instruments: T212TradableInstrument[] } | null = null;

export const GET = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const provider = await getActiveT212Client(ctx.userId);

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active Trading212 key found',
          error: 'No active Trading212 key found',
        },
        { status: 404 }
      );
    }

    if (!cache || Date.now() - cache.at > CACHE_TTL_MS) {
      const instruments = await provider.client.getInstruments();
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
