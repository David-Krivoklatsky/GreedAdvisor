import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { t212ApiKeySchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

// GET /api/user/trading-keys - Get all Trading keys for user
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

    const tradingKeys = await prisma.t212ApiKey.findMany({
      where: {
        userId: decoded.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        accessType: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
        apiKey: true, // Include API key for display
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tradingKeys });
  } catch (error) {
    console.error('Get Trading keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/trading-keys - Create new Trading key
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
    const result = t212ApiKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { title, accessType, apiKey } = result.data;

    const newTradingKey = await prisma.t212ApiKey.create({
      data: {
        userId: decoded.userId,
        title,
        accessType,
        apiKey,
      },
      select: {
        id: true,
        title: true,
        accessType: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log the creation
    await prisma.apiKeyLog.create({
      data: {
        userId: decoded.userId,
        keyType: 'trading',
        action: 'created',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        userAgent: req.headers.get('user-agent') || '',
      },
    });

    return NextResponse.json(
      {
        message: 'Trading key created successfully',
        tradingKey: newTradingKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Trading key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
