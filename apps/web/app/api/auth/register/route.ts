import { prisma } from '@/lib/prisma';
import { hashPassword, signAccessToken, signRefreshToken } from '@greed-advisor/auth';
import { withApiMiddleware, withValidation, withRateLimit } from '@greed-advisor/middleware';
import { registerSchema } from '@greed-advisor/validations';
import type { RegisterInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const POST = withApiMiddleware(
  withRateLimit(
    withValidation(registerSchema)(async (req, ctx) => {
      const { email, password } = ctx.data as RegisterInput;

      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'User with this email already exists',
            error: 'User already exists'
          },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword
        }
      });

      const payload = { userId: user.id, email: user.email };
      const accessToken = signAccessToken(payload);
      const refreshToken = signRefreshToken(payload);

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
            updatedAt: user.updatedAt
          }
        },
        { status: 201 }
      );

      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });

      return response;
    })
  )
);
