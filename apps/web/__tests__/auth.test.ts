import { describe, expect, it } from '@jest/globals';

// JWT_SECRET is required at import time by @greed-advisor/auth
process.env.JWT_SECRET = 'a'.repeat(32);

import {
  extractTokenFromHeader,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@greed-advisor/auth';

describe('@greed-advisor/auth', () => {
  const payload = { userId: 1, email: 'test@example.com' };

  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded).toEqual(payload);
  });

  it('signs and verifies a refresh token round-trip', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);

    expect(decoded).toEqual(payload);
  });

  it('returns null for a malformed token', () => {
    expect(verifyAccessToken('not-a-jwt')).toBeNull();
    expect(verifyRefreshToken('not-a-jwt')).toBeNull();
  });

  it('returns null for a token with an invalid payload', () => {
    const token = signAccessToken({ foo: 'bar' });
    expect(verifyAccessToken(token)).toBeNull();
  });

  it('extracts the bearer token from an Authorization header', () => {
    expect(extractTokenFromHeader('Bearer abc123')).toBe('abc123');
    expect(extractTokenFromHeader('Basic abc123')).toBeNull();
    expect(extractTokenFromHeader(null)).toBeNull();
    expect(extractTokenFromHeader('Bearer')).toBeNull();
  });
});
