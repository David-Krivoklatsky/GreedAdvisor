import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock auth so no JWT_SECRET is required at import time
jest.mock('@greed-advisor/auth', () => ({
  extractTokenFromHeader: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

const { extractTokenFromHeader, verifyAccessToken } = require('@greed-advisor/auth');

import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';

const jsonRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

describe('withApiMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies security headers and a generic 500 on unhandled errors', async () => {
    const handler = withApiMiddleware(async () => {
      throw new Error('boom');
    });

    const response = await handler(jsonRequest({}), {});

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('An unexpected error occurred');
    expect(body.message).not.toContain('boom');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('preserves the handler response and still adds security headers', async () => {
    const handler = withApiMiddleware(async () =>
      NextResponse.json({ success: true }, { status: 200 })
    );

    const response = await handler(jsonRequest({}), {});

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

describe('withAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the decoded userId to the handler', async () => {
    jest.mocked(extractTokenFromHeader).mockReturnValue('token');
    jest.mocked(verifyAccessToken).mockReturnValue({ userId: 7, email: 'a@b.com' });

    let seenUserId: number | undefined;
    const handler = withAuth(async (_req, ctx) => {
      seenUserId = ctx.userId;
      return NextResponse.json({ success: true });
    });

    await handler(
      new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer token' },
      }),
      {}
    );

    expect(seenUserId).toBe(7);
  });

  it('returns 401 when the header is missing', async () => {
    jest.mocked(extractTokenFromHeader).mockReturnValue(null);

    const handler = withAuth(async () => NextResponse.json({ success: true }));
    const response = await handler(new NextRequest('http://localhost:3000/api/test'), {});

    expect(response.status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    jest.mocked(extractTokenFromHeader).mockReturnValue('bad-token');
    jest.mocked(verifyAccessToken).mockReturnValue(null);

    const handler = withAuth(async () => NextResponse.json({ success: true }));
    const response = await handler(
      new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer bad-token' },
      }),
      {}
    );

    expect(response.status).toBe(401);
  });
});

describe('withValidation', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes parsed data to the handler for valid input', async () => {
    let seenData: unknown;
    const handler = withValidation(schema)(async (_req, ctx) => {
      seenData = ctx.data;
      return NextResponse.json({ success: true });
    });

    await handler(jsonRequest({ email: 'a@b.com', password: 'secret123' }), {});

    expect(seenData).toEqual({ email: 'a@b.com', password: 'secret123' });
  });

  it('returns a 400 envelope for invalid input', async () => {
    const handler = withValidation(schema)(async () => NextResponse.json({ success: true }));
    const response = await handler(jsonRequest({ email: 'not-an-email', password: 'x' }), {});

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('email');
  });

  it('composes with withAuth: validates body then authenticates', async () => {
    jest.mocked(extractTokenFromHeader).mockReturnValue('token');
    jest.mocked(verifyAccessToken).mockReturnValue({ userId: 3, email: 'a@b.com' });

    let seen: { userId?: number; data?: unknown } = {};
    const handler = withValidation(schema)(
      withAuth(async (_req, ctx) => {
        seen = ctx;
        return NextResponse.json({ success: true });
      })
    );

    const response = await handler(
      new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret123' }),
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
      }),
      {}
    );

    expect(response.status).toBe(200);
    expect(seen.userId).toBe(3);
    expect(seen.data).toEqual({ email: 'a@b.com', password: 'secret123' });
  });
});
