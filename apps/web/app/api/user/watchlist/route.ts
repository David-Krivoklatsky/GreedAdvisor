import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const items = await prisma.watchlistItem.findMany({
      where: { userId: decoded.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to load watchlist', details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { ticker, name, instrumentType } = body;

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const normalizedTicker = ticker.trim().toUpperCase();
    const type = (instrumentType ?? 'STOCK').toUpperCase();

    // If it already exists and is active, just return it
    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_ticker: { userId: decoded.userId, ticker: normalizedTicker } },
    });

    if (existing?.isActive) {
      return NextResponse.json({ item: existing }, { status: 200 });
    }

    const item = existing
      ? await prisma.watchlistItem.update({
          where: { id: existing.id },
          data: { isActive: true, name: name ?? existing.name, instrumentType: type },
        })
      : await prisma.watchlistItem.create({
          data: {
            userId: decoded.userId,
            ticker: normalizedTicker,
            name: name ?? null,
            instrumentType: type,
          },
        });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Add watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add watchlist item', details: message },
      { status: 500 }
    );
  }
}
