import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { aiApiKeySchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

// GET /api/user/ai-keys - Get all AI keys for user
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

    const aiKeys = await prisma.aiApiKey.findMany({
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
        apiKey: true, // Include API key for display
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ aiKeys });
  } catch (error) {
    console.error('Get AI keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/ai-keys - Create new AI key
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
    const result = aiApiKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { title, provider, apiKey } = result.data;

    const newAiKey = await prisma.aiApiKey.create({
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

    // Log the creation
    await prisma.apiKeyLog.create({
      data: {
        userId: decoded.userId,
        keyType: 'ai',
        action: 'created',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        userAgent: req.headers.get('user-agent') || '',
      },
    });

    return NextResponse.json(
      {
        message: 'AI key created successfully',
        aiKey: newAiKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create AI key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
