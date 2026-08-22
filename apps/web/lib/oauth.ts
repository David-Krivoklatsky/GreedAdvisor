import crypto from 'crypto';

export type OAuthProvider = 'google' | 'github';

export const OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'github'];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return OAUTH_PROVIDERS.includes(value as OAuthProvider);
}

function getCredentials(provider: OAuthProvider): { clientId: string; clientSecret: string } {
  const envPrefix = provider === 'google' ? 'GOOGLE' : 'GITHUB';
  const clientId = process.env[`${envPrefix}_CLIENT_ID`];
  const clientSecret = process.env[`${envPrefix}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(`${envPrefix} OAuth is not configured`);
  }

  return { clientId, clientSecret };
}

export function getRedirectUri(origin: string, provider: OAuthProvider): string {
  return `${origin}/api/auth/oauth/${provider}/callback`;
}

export function createOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function buildProviderAuthUrl(
  provider: OAuthProvider,
  state: string,
  origin: string
): string {
  const { clientId } = getCredentials(provider);
  const redirectUri = getRedirectUri(origin, provider);

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export interface OAuthProfile {
  providerAccountId: string;
  email: string;
  name?: string;
  profilePicture?: string;
}

export async function exchangeCodeForProfile(
  provider: OAuthProvider,
  code: string,
  origin: string
): Promise<OAuthProfile> {
  const { clientId, clientSecret } = getCredentials(provider);
  const redirectUri = getRedirectUri(origin, provider);

  if (provider === 'google') {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Google OAuth token exchange failed');
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error('Google OAuth did not return an access token');
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Google profile');
    }

    const user = (await userResponse.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!user.id || !user.email) {
      throw new Error('Google profile is missing required fields');
    }

    return {
      providerAccountId: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.picture
    };
  }

  // GitHub
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('GitHub OAuth token exchange failed');
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error('GitHub OAuth did not return an access token');
  }

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'GreedAdvisor'
    }
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub profile');
  }

  const user = (await userResponse.json()) as {
    id?: number;
    email?: string | null;
    name?: string | null;
    login?: string;
    avatar_url?: string;
  };

  let email = user.email ?? null;

  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'GreedAdvisor'
      }
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{
        email?: string;
        primary?: boolean;
        verified?: boolean;
      }>;
      email = emails.find(e => e.primary && e.verified)?.email ?? emails[0]?.email ?? null;
    }
  }

  if (user.id == null || !email) {
    throw new Error('GitHub profile is missing required fields');
  }

  return {
    providerAccountId: String(user.id),
    email,
    name: user.name ?? user.login ?? undefined,
    profilePicture: user.avatar_url ?? undefined
  };
}
