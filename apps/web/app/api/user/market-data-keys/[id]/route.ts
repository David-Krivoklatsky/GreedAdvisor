import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { updateMarketDataKeySchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

// PUT /api/user/market-data-keys/[id] - Update market data key
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const keyId = parseInt(resolvedParams.id);
    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    const body = await req.json();
    const result = updateMarketDataKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const existingKey = await prisma.marketDataKey.findFirst({
      where: {
        id: keyId,
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'Market data key not found' }, { status: 404 });
    }

    const updatedKey = await prisma.marketDataKey.update({
      where: { id: keyId },
      data: {
        ...result.data,
        updatedAt: new Date(),
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

    return NextResponse.json({
      message: 'Market data key updated successfully',
      marketDataKey: updatedKey,
    });
  } catch (error) {
    console.error('Update market data key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user/market-data-keys/[id] - Delete market data key
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const keyId = parseInt(resolvedParams.id);
    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    const existingKey = await prisma.marketDataKey.findFirst({
      where: {
        id: keyId,
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'Market data key not found' }, { status: 404 });
    }

    await prisma.marketDataKey.update({
      where: { id: keyId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ message: 'Market data key deleted successfully' });
  } catch (error) {
    console.error('Delete market data key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
