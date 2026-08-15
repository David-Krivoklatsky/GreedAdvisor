import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { Trading212Client, T212Environment } from '@greed-advisor/trading212';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

// Helper: find the user's active T212 key and build a client
async function getT212Client(userId: number, keyId?: string) {
  const where = {
    userId,
    deletedAt: null,
    isActive: true,
    ...(keyId ? { id: Number(keyId) } : {}),
  };

  const key = await prisma.t212ApiKey.findFirst({ where });

  if (!key) {
    return null;
  }

  const client = new Trading212Client({
    apiKey: key.apiKey,
    apiSecret: key.apiSecret,
    environment: key.environment as T212Environment,
  });

  return { key, client };
}

// GET /api/user/positions - Fetch real positions from Trading212
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

    const keyId = new URL(request.url).searchParams.get('keyId') ?? undefined;
    const { key, client } = (await getT212Client(decoded.userId, keyId)) ?? {};

    if (!key || !client) {
      return NextResponse.json({ error: 'No active Trading212 key found' }, { status: 404 });
    }

    try {
      const positions = await client.getPositions();
      const cash = await client.getCashAccount();

      await prisma.t212ApiKey.update({
        where: { id: key.id },
        data: { lastUsed: new Date() },
      });

      return NextResponse.json({ positions, cash });
    } catch (t212Error) {
      // Trading212 rejected the request (bad credentials, key removed, etc.)
      const message = t212Error instanceof Error ? t212Error.message : 'Trading212 request failed';
      console.error('Trading212 positions error:', t212Error);
      return NextResponse.json(
        { error: 'Trading212 sync failed', details: message },
        { status: 502 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions', details: message },
      { status: 500 }
    );
  }
}

// POST /api/user/positions - Place a market order on Trading212
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
    const { tradingKeyId, symbol, quantity, orderType } = body;

    if (!tradingKeyId || !symbol || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty === 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Buy = positive, sell = negative (Trading212 convention)
    const orderQty = orderType === 'SELL' ? -Math.abs(qty) : Math.abs(qty);

    const { key, client } = (await getT212Client(decoded.userId, tradingKeyId)) ?? {};

    if (!key || !client) {
      return NextResponse.json({ error: 'No active Trading212 key found' }, { status: 404 });
    }

    const order = await client.placeOrder({
      ticker: symbol,
      quantity: orderQty,
      orderType: 'MARKET',
      timeValidity: 'DAY',
    });

    await prisma.t212ApiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error placing order:', error);
    return NextResponse.json({ error: 'Failed to place order', details: message }, { status: 500 });
  }
}
