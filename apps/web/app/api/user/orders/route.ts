import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { Trading212Client, T212Environment } from '@greed-advisor/trading212';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/user/orders - Place a market order with optional stop-loss / take-profit
// The user reviews and confirms every field in the UI; this route never runs unattended.
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
    const { tradingKeyId, ticker, quantity, side, stopLoss, takeProfit, extendedHours } = body;

    if (!tradingKeyId || !ticker || !quantity || !side) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    if (!['BUY', 'SELL'].includes(side)) {
      return NextResponse.json({ error: 'Side must be BUY or SELL' }, { status: 400 });
    }

    const key = await prisma.t212ApiKey.findFirst({
      where: { id: Number(tradingKeyId), userId: decoded.userId, deletedAt: null, isActive: true },
    });

    if (!key) {
      return NextResponse.json({ error: 'No active Trading212 key found' }, { status: 404 });
    }

    const client = new Trading212Client({
      apiKey: key.apiKey,
      apiSecret: key.apiSecret,
      environment: key.environment as T212Environment,
    });

    // T212 convention: sell orders use a negative quantity
    const signedQty = side === 'SELL' ? -Math.abs(qty) : Math.abs(qty);

    // 1) Entry order (market)
    const entry = await client.placeOrder({
      ticker,
      quantity: signedQty,
      orderType: 'MARKET',
      extendedHours: extendedHours ?? false,
    });

    // 2) Optional protections (separate stop + limit orders, opposite side of entry)
    const protections: { stop: unknown; takeProfit: unknown } | null =
      side === 'BUY' || side === 'SELL'
        ? {
            stop:
              stopLoss != null && Number(stopLoss) > 0
                ? await client.placeOrder({
                    ticker,
                    quantity: -signedQty,
                    orderType: 'STOP',
                    stopPrice: Number(stopLoss),
                    timeValidity: 'GOOD_TILL_CANCEL',
                  })
                : null,
            takeProfit:
              takeProfit != null && Number(takeProfit) > 0
                ? await client.placeOrder({
                    ticker,
                    quantity: -signedQty,
                    orderType: 'LIMIT',
                    limitPrice: Number(takeProfit),
                    timeValidity: 'GOOD_TILL_CANCEL',
                  })
                : null,
          }
        : null;

    await prisma.t212ApiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } });

    return NextResponse.json(
      { entry, stop: protections?.stop ?? null, takeProfit: protections?.takeProfit ?? null },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Place order error:', error);
    return NextResponse.json({ error: 'Failed to place order', details: message }, { status: 500 });
  }
}
