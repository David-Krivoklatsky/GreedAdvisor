import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { updateAiApiKeySchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

// PUT /api/user/ai-keys/[id] - Update AI key
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
    const result = updateAiApiKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Check if the key belongs to the user
    const existingKey = await prisma.aiApiKey.findFirst({
      where: {
        id: keyId,
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'AI key not found' }, { status: 404 });
    }

    const updatedKey = await prisma.aiApiKey.update({
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

    // Log the update
    await prisma.apiKeyLog.create({
      data: {
        userId: decoded.userId,
        keyType: 'ai',
        action: 'updated',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        userAgent: req.headers.get('user-agent') || '',
      },
    });

    return NextResponse.json({
      message: 'AI key updated successfully',
      aiKey: updatedKey,
    });
  } catch (error) {
    console.error('Update AI key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user/ai-keys/[id] - Delete AI key
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
    const existingKey = await prisma.aiApiKey.findFirst({
      where: {
        id: keyId,
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'AI key not found' }, { status: 404 });
    }

    // Soft delete by setting deletedAt
    await prisma.aiApiKey.update({
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
        keyType: 'ai',
        action: 'deleted',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        userAgent: req.headers.get('user-agent') || '',
      },
    });

    return NextResponse.json({ message: 'AI key deleted successfully' });
  } catch (error) {
    console.error('Delete AI key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
