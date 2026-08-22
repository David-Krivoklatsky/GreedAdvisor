import { prisma } from '@/lib/prisma';
import { exchangeCodeForProfile, isOAuthProvider } from '@/lib/oauth';
import { signAccessToken, signRefreshToken } from '@greed-advisor/auth';
import { withApiMiddleware } from '@greed-advisor/middleware';
import { NextResponse } from 'next/server';

export const GET = withApiMiddleware(async (req, ctx) => {
  const params = (await ctx.params) ?? {};
  const provider = params.provider;
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = req.cookies.get('oauth_state')?.value;
  const origin = req.nextUrl.origin;

  const failRedirect = (error: string) =>
    NextResponse.redirect(new URL(`/login?error=${error}`, req.url));

  if (!isOAuthProvider(provider)) {
    return failRedirect('unsupported_provider');
  }

  if (!code) {
    return failRedirect('missing_code');
  }

  if (!state || state !== storedState) {
    return failRedirect('state_mismatch');
  }

  try {
    const profile = await exchangeCodeForProfile(provider, code, origin);

    let user = await prisma.user.findFirst({
      where: { provider, providerAccountId: profile.providerAccountId }
    });

    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });

      if (byEmail) {
        // Link the OAuth account to the existing email account
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            provider,
            providerAccountId: profile.providerAccountId,
            name: byEmail.name ?? profile.name ?? null,
            firstName: byEmail.firstName ?? profile.name?.split(' ')[0] ?? null,
            lastName: byEmail.lastName ?? (profile.name?.split(' ').slice(1).join(' ') || null),
            profilePicture: byEmail.profilePicture ?? profile.profilePicture ?? null
          }
        });
      } else {
        const nameParts = profile.name?.split(' ') ?? [];
        user = await prisma.user.create({
          data: {
            email: profile.email,
            provider,
            providerAccountId: profile.providerAccountId,
            name: profile.name,
            firstName: nameParts[0] ?? null,
            lastName: nameParts.slice(1).join(' ') || null,
            profilePicture: profile.profilePicture
          }
        });
      }
    } else {
      // Refresh display fields on every login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: profile.name ?? user.name,
          profilePicture: profile.profilePicture ?? user.profilePicture,
          lastLogin: new Date()
        }
      });
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const response = NextResponse.redirect(
      new URL(`/auth/callback?token=${encodeURIComponent(accessToken)}`, req.url)
    );

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });

    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });

    return response;
  } catch {
    return failRedirect('oauth_failed');
  }
});
