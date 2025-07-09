import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@greed-advisor/auth';
import { registerSchema } from '@greed-advisor/validations';
import { rateLimit } from '@greed-advisor/rate-limit';
import { withApiMiddleware, withValidation } from '@greed-advisor/middleware';
import type { RegisterRequest, RegisterResponse } from '@greed-advisor/types';

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

  // Generate JWT token
  const token = signToken({ userId: user.id, email: user.email });

  return NextResponse.json(
    {
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        openAiKey: user.openAiKey,
        t212Key: user.t212Key,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
    { status: 201 }
  );
}

export const POST = withApiMiddleware(withValidation(registerSchema)(registerHandler));
