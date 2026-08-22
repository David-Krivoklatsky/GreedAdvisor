import { buildProviderAuthUrl, createOAuthState, isOAuthProvider } from '@/lib/oauth';
import { withApiMiddleware } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const GET = withApiMiddleware(async (req, ctx) => {
  const params = (await ctx.params) ?? {};
  const provider = params.provider;

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL('/login?error=unsupported_provider', req.url));
  }

  try {
    const state = createOAuthState();
    const origin = req.nextUrl.origin;
    const authUrl = buildProviderAuthUrl(provider, state, origin);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/'
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', req.url));
  }
});
