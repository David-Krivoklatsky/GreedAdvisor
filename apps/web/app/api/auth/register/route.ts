import { prisma } from '@/lib/prisma';
import { hashPassword, signAccessToken, signRefreshToken } from '@greed-advisor/auth';
import { withApiMiddleware, withValidation } from '@greed-advisor/middleware';
import { rateLimit } from '@greed-advisor/rate-limit';
import type { RegisterRequest, RegisterResponse } from '@greed-advisor/types';
import { registerSchema } from '@greed-advisor/validations';
import { NextRequest, NextResponse } from 'next/server';

async function registerHandler(
  req: NextRequest,
  validatedData: RegisterRequest
): Promise<NextResponse<RegisterResponse>> {
  // Rate limiting
  const rateLimitResult = rateLimit(req);
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

  const { email, password } = validatedData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        success: false,
        message: 'User with this email already exists',
        error: 'User already exists',
      },
      { status: 409 }
    );
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  // Generate tokens
  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Create response
  const response = NextResponse.json(
    {
      success: true,
      message: 'User created successfully',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
    { status: 201 }
  );

  // Set refresh token as HTTP-only cookie
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });

  return response;
}

export const POST = withApiMiddleware(withValidation(registerSchema)(registerHandler));
