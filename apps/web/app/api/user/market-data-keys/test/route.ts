import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { TwelveDataProvider } from '@greed-advisor/market-data';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/user/market-data-keys/test - Test a market data key by fetching a quote
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const keyId = Number(body?.keyId);

    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
    }

    const marketDataKey = await prisma.marketDataKey.findFirst({
      where: {
        id: keyId,
        userId: decoded.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        apiKey: true,
        isActive: true,
      },
    });

    if (!marketDataKey) {
      return NextResponse.json({ error: 'Market data key not found' }, { status: 404 });
    }

    if (!marketDataKey.isActive) {
      return NextResponse.json({ error: 'Market data key is inactive' }, { status: 400 });
    }

    const provider = new TwelveDataProvider(marketDataKey.apiKey);
    const quote = await provider.getQuote('AAPL');

    await prisma.marketDataKey.update({
      where: { id: marketDataKey.id },
      data: { lastUsed: new Date() },
    });

    return NextResponse.json({
      message: 'Market data key test successful',
      quote: {
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
      },
    });
  } catch (error) {
    console.error('Test market data key error:', error);
    const message = error instanceof Error ? error.message : 'Failed to test market data key';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
