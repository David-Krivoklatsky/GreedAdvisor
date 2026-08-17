import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, hashPassword, verifyAccessToken } from '@greed-advisor/auth';
import { profileUpdateSchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

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
        profilePicture: true,
        riskProfile: true,
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

export async function PUT(req: NextRequest) {
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
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, profilePicture, riskProfile } = parsed.data;

    // If email is changing, check it isn't taken by another user
    if (
      email &&
      email !== (await prisma.user.findUnique({ where: { id: decoded.userId } }))?.email
    ) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== decoded.userId) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }
    }

    const updateData: {
      email?: string;
      password?: string;
      profilePicture?: string;
      riskProfile?: string;
    } = {};

    if (email) {
      updateData.email = email;
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (profilePicture !== undefined) {
      updateData.profilePicture = profilePicture;
    }

    if (riskProfile !== undefined) {
      updateData.riskProfile = riskProfile;
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
