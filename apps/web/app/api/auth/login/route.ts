import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/api';
import { comparePassword, signAccessToken, signRefreshToken } from '@greed-advisor/auth';
import { withApiMiddleware, withValidation } from '@greed-advisor/middleware';
import { rateLimit } from '@greed-advisor/rate-limit';
import { loginSchema } from '@greed-advisor/validations';
import type { LoginInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const POST = withApiMiddleware(
  withValidation(loginSchema)(async (req, ctx) => {
    const { email, password } = ctx.data as LoginInput;

    const rateLimitResult = rateLimit(getClientIp(req));
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please try again later.',
          error: 'Rate limit exceeded',
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password', error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password', error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    return response;
  })
);
