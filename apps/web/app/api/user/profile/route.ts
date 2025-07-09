import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { NextRequest, NextResponse } from 'next/server';

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        aiApiKeys: {
          select: {
            id: true,
            title: true,
            provider: true,
            isActive: true,
            createdAt: true,
          },
        },
        t212ApiKeys: {
          select: {
            id: true,
            title: true,
            accessType: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { user },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        },
      }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
