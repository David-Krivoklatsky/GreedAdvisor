import { prisma } from '@/lib/prisma';
import { withApiMiddleware, withAuth } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Maximum profile picture size (5MB)
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// POST /api/user/profile-picture - Upload profile picture
export const POST = withApiMiddleware(
  withAuth(async (req, ctx) => {
    const formData = await req.formData();
    const file = formData.get('profilePicture') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided', error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
          error: 'Invalid file type'
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          error: 'File too large'
        },
        { status: 400 }
      );
    }

    // Convert to base64 data URL for serverless-safe storage (no filesystem on Vercel)
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Store in database
    await prisma.user.update({
      where: { id: ctx.userId },
      data: { profilePicture: dataUrl }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: dataUrl
    });
  })
);
