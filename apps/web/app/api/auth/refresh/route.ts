import { prisma } from '@/lib/prisma';
import { signAccessToken, verifyRefreshToken } from '@greed-advisor/auth';
import { withApiMiddleware } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const POST = withApiMiddleware(async req => {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: 'Refresh token not found', error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Invalid refresh token', error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { success: false, message: 'User not found or inactive', error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email });

  return NextResponse.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    },
  });
});
