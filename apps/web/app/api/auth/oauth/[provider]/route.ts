import { buildProviderAuthUrl, createOAuthState, isOAuthProvider } from '@/lib/oauth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/auth/oauth/[provider] - starts the OAuth flow
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;

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
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', req.url));
  }
}
