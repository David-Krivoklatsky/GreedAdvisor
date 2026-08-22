import { withApiMiddleware } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const POST = withApiMiddleware(async () => {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Clear refresh token cookie
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });

  return response;
});
