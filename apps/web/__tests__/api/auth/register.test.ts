import { prisma } from '@/lib/prisma';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { POST } from '../../../app/api/auth/register/route';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock auth functions
jest.mock('@greed-advisor/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
  signAccessToken: jest.fn().mockReturnValue('accessToken'),
  signRefreshToken: jest.fn().mockReturnValue('refreshToken'),
}));

// Mock rate limiting
jest.mock('@greed-advisor/rate-limit', () => ({
  rateLimit: jest.fn(() => ({ success: true })),
}));

// Mock middleware
jest.mock('@greed-advisor/middleware', () => ({
  withApiMiddleware: jest.fn((handler: any) => handler),
  withValidation: jest.fn((_schema: any) => (handler: any) => async (req: any) => {
    try {
      // Actually parse the request body for validation
      const body = await req.json();
      const { registerSchema } = require('@greed-advisor/validations');
      const validatedData = registerSchema.parse(body);
      return handler(req, validatedData);
    } catch {
      // Return validation error
      const { NextResponse } = require('next/server');
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          error: 'Validation error',
        },
        { status: 400 }
      );
    }
  }),
}));

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup the rate limit mock after clearing
    require('@greed-advisor/rate-limit').rateLimit.mockReturnValue({ success: true });
  });

  it('should create a new user successfully', async () => {
    // Mock successful user creation
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      openAiKey: null,
      t212Key: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // NextRequest does not accept a body directly, so we mock .json()
    const request: any = {
      method: 'POST',
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        password: 'password123',
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toBe('User created successfully');
    expect(data.user.email).toBe('test@example.com');
  });

  it('should return error if user already exists', async () => {
    // Mock existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    const request: any = {
      method: 'POST',
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        password: 'password123',
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toBe('User with this email already exists');
  });

  it('should return validation error for invalid input', async () => {
    const request: any = {
      method: 'POST',
      json: jest.fn().mockResolvedValue({
        email: 'invalid-email',
        password: '123', // Too short
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Validation failed');
  });
});
