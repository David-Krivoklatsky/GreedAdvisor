import { prisma } from '@/lib/prisma';
import { hashPassword } from '@greed-advisor/auth';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { profileUpdateSchema } from '@greed-advisor/validations';
import type { ProfileUpdateInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApiMiddleware(
  withAuth(async (_req, ctx) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
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
      return NextResponse.json(
        { success: false, message: 'User not found', error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, user },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  })
);

export const PUT = withApiMiddleware(
  withValidation(profileUpdateSchema)(
    withAuth(async (_req, ctx) => {
      const { email, password, profilePicture, riskProfile } = ctx.data as ProfileUpdateInput;

      const currentUser = await prisma.user.findUnique({ where: { id: ctx.userId } });

      // If email is changing, check it isn't taken by another user
      if (email && email !== currentUser?.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== ctx.userId) {
          return NextResponse.json(
            {
              success: false,
              message: 'User with this email already exists',
              error: 'Email already in use',
            },
            { status: 409 }
          );
        }
      }

      const updateData: {
        email?: string;
        password?: string;
        profilePicture?: string;
        riskProfile?: string;
      } = {};

      if (email) updateData.email = email;
      if (password) updateData.password = await hashPassword(password);
      if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
      if (riskProfile !== undefined) updateData.riskProfile = riskProfile;

      const updatedUser = await prisma.user.update({
        where: { id: ctx.userId },
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

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    })
  )
);
