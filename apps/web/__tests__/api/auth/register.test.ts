import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the prisma client first
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
  hashPassword: jest.fn(),
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
}));

// Mock rate limiting
jest.mock('@greed-advisor/rate-limit', () => ({
  rateLimit: jest.fn(),
}));

// Mock middleware
jest.mock('@greed-advisor/middleware', () => ({
  withApiMiddleware: jest.fn((handler: any) => handler),
  withValidation: jest.fn(() => (handler: any) => handler),
}));

// Import the route handler after mocks are set up
import { POST } from '../../../app/api/auth/register/route';

// Get references to mocked modules
const { prisma } = require('@/lib/prisma');
const { hashPassword, signAccessToken, signRefreshToken } = require('@greed-advisor/auth');
const { rateLimit } = require('@greed-advisor/rate-limit');

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks using mockReturnValue and mockResolvedValue
    jest.mocked(hashPassword).mockResolvedValue('hashedPassword');
    jest.mocked(signAccessToken).mockReturnValue('accessToken');
    jest.mocked(signRefreshToken).mockReturnValue('refreshToken');
    jest.mocked(rateLimit).mockReturnValue({ success: true });
  });

  it('should create a new user successfully', async () => {
    // Mock successful user creation
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      openAiKey: null,
      t212Key: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
    jest.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

    // Create a proper NextRequest mock
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request, requestBody as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toBe('User created successfully');
    expect(data.user.email).toBe('test@example.com');
  });

  it('should return error if user already exists', async () => {
    // Mock existing user
    const existingUser = {
      id: 1,
      email: 'test@example.com',
    };

    jest.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);

    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request, requestBody as any);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toBe('User with this email already exists');
  });

  it('should return error when rate limit is exceeded', async () => {
    // Mock rate limit to return failure
    jest.mocked(rateLimit).mockReturnValue({ success: false });

    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request, requestBody as any);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Too many requests. Please try again later.');
  });
});
