import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { marketDataKeySchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

// GET /api/user/market-data-keys - Get all market data keys for user
export async function GET(req: NextRequest) {
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

    const marketDataKeys = await prisma.marketDataKey.findMany({
      where: {
        userId: decoded.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        provider: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ marketDataKeys });
  } catch (error) {
    console.error('Get market data keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/market-data-keys - Create new market data key
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
    const result = marketDataKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    const { title, provider, apiKey } = result.data;

    const newKey = await prisma.marketDataKey.create({
      data: {
        userId: decoded.userId,
        title,
        provider,
        apiKey,
      },
      select: {
        id: true,
        title: true,
        provider: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Market data key created successfully',
        marketDataKey: newKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create market data key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
