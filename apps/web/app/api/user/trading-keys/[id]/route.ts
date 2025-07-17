import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { updateT212ApiKeySchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

// PUT /api/user/trading-keys/[id] - Update Trading key
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
    const result = updateT212ApiKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Check if the key belongs to the user
    const existingKey = await prisma.t212ApiKey.findFirst({
      where: {
        id: keyId,
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'Trading key not found' }, { status: 404 });
    }

    const updatedKey = await prisma.t212ApiKey.update({
      where: { id: keyId },
      data: {
        ...result.data,
        updatedAt: new Date(),
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

    // Log the update
    await prisma.apiKeyLog.create({
      data: {
        userId: decoded.userId,
        keyType: 'trading',
        action: 'updated',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        userAgent: req.headers.get('user-agent') || '',
      },
    });

    return NextResponse.json({
      message: 'Trading key updated successfully',
      tradingKey: updatedKey,
    });
  } catch (error) {
    console.error('Update Trading key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user/trading-keys/[id] - Delete Trading key
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

    // Check if the key belongs to the user
    const existingKey = await prisma.t212ApiKey.findFirst({
      where: {
        id: keyId,
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'Trading key not found' }, { status: 404 });
    }

    // Soft delete by setting deletedAt
    await prisma.t212ApiKey.update({
      where: { id: keyId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Log the deletion
    await prisma.apiKeyLog.create({
      data: {
        userId: decoded.userId,
        keyType: 'trading',
        action: 'deleted',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        userAgent: req.headers.get('user-agent') || '',
      },
    });

    return NextResponse.json({ message: 'Trading key deleted successfully' });
  } catch (error) {
    console.error('Delete Trading key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
