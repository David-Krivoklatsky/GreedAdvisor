import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the prisma client first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

// Mock auth functions
jest.mock('@greed-advisor/auth', () => ({
  comparePassword: jest.fn(),
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn()
}));

// Mock rate limiting
jest.mock('@greed-advisor/rate-limit', () => ({
  rateLimit: jest.fn()
}));

// Mock middleware
jest.mock('@greed-advisor/middleware', () => ({
  withApiMiddleware: jest.fn((handler: any) => handler),
  withValidation: jest.fn(() => (handler: any) => handler),
  withRateLimit: jest.fn((handler: any) => {
    return async (req: any, ctx: any) => {
      // Call the rateLimit mock
      const { rateLimit } = await import('@greed-advisor/rate-limit');
      const result = rateLimit('test-ip');
      if (!result.success) {
        return {
          status: 429,
          json: async () => ({
            success: false,
            message: 'Too many requests. Please try again later.',
            error: 'Rate limit exceeded',
            statusCode: 429
          })
        };
      }
      return handler(req, ctx);
    };
  })
}));

// Import the route handler after mocks are set up
import { POST } from '../../../app/api/auth/login/route';

// Get references to mocked modules
import { prisma } from '@/lib/prisma';
import { comparePassword, signAccessToken, signRefreshToken } from '@greed-advisor/auth';
import { rateLimit } from '@greed-advisor/rate-limit';

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(comparePassword).mockResolvedValue(true);
    jest.mocked(signAccessToken).mockReturnValue('accessToken');
    jest.mocked(signRefreshToken).mockReturnValue('refreshToken');
    jest.mocked(rateLimit).mockReturnValue({ success: true });
  });

  const makeRequest = () =>
    new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      headers: { 'content-type': 'application/json' }
    });

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    name: null,
    provider: 'credentials',
    providerAccountId: null,
    profilePicture: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    openAiKey: null,
    t212Key: null
  };

  it('should return tokens and user on successful login', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const response = await POST(makeRequest(), {
      data: { email: mockUser.email, password: 'password123' }
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.accessToken).toBe('accessToken');
    expect(data.user.email).toBe('test@example.com');
    expect(response.cookies.get('refreshToken')?.value).toBe('refreshToken');
  });

  it('should return 401 when the user does not exist', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await POST(makeRequest(), {
      data: { email: 'nobody@example.com', password: 'password123' }
    } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 401 when the password is wrong', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    jest.mocked(comparePassword).mockResolvedValue(false);

    const response = await POST(makeRequest(), {
      data: { email: mockUser.email, password: 'wrong' }
    } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 429 when rate limited', async () => {
    jest.mocked(rateLimit).mockReturnValue({ success: false });

    const response = await POST(makeRequest(), {
      data: { email: mockUser.email, password: 'password123' }
    } as any);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
  });
});
