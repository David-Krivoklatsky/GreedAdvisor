import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Force this route to be dynamic since it uses request headers
export const dynamic = 'force-dynamic';

// POST /api/user/profile-picture - Upload profile picture
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

    const formData = await req.formData();
    const file = formData.get('profilePicture') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${decoded.userId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Generate URL
    const profilePictureUrl = `/uploads/profile-pictures/${fileName}`;

    // Update user in database
    // await prisma.user.update({
    //   where: { id: decoded.userId },
    //   data: { profilePicture: profilePictureUrl },
    // });

    return NextResponse.json(
      {
        message: 'Profile picture uploaded successfully',
        profilePictureUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload profile picture error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
