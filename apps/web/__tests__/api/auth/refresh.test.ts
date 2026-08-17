import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the prisma client first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth functions
jest.mock('@greed-advisor/auth', () => ({
  signAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

// Mock middleware
jest.mock('@greed-advisor/middleware', () => ({
  withApiMiddleware: jest.fn((handler: any) => handler),
}));

// Import the route handler after mocks are set up
import { POST } from '../../../app/api/auth/refresh/route';

// Get references to mocked modules
const { prisma } = require('@/lib/prisma');
const { signAccessToken, verifyRefreshToken } = require('@greed-advisor/auth');

describe('/api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(signAccessToken).mockReturnValue('newAccessToken');
    jest.mocked(verifyRefreshToken).mockReturnValue({ userId: 1, email: 'test@example.com' });
  });

  const makeRequest = (withCookie: boolean) =>
    new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: withCookie ? { cookie: 'refreshToken=valid-refresh-token' } : {},
    });

  it('should issue a new access token with a valid refresh token', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      isActive: true,
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date(),
    });

    const response = await POST(makeRequest(true), {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.accessToken).toBe('newAccessToken');
  });

  it('should return 401 when no refresh token cookie is present', async () => {
    const response = await POST(makeRequest(false), {});
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 when the refresh token is invalid', async () => {
    jest.mocked(verifyRefreshToken).mockReturnValue(null);

    const response = await POST(makeRequest(true), {});
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 401 when the user is inactive', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      isActive: false,
      firstName: null,
      lastName: null,
      createdAt: new Date(),
    });

    const response = await POST(makeRequest(true), {});

    expect(response.status).toBe(401);
  });
});
