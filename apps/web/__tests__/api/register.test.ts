import { POST } from '@/app/api/auth/register/route';
import { createMocks } from 'node-mocks-http';

// Mock the database
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock rate limiter
jest.mock('@greed-advisor/rate-limit', () => ({
  rateLimit: jest.fn(() => ({ success: true })),
}));

// Mock auth functions
jest.mock('@greed-advisor/auth', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hashedpassword')),
  signAccessToken: jest.fn(() => 'accesstoken'),
  signRefreshToken: jest.fn(() => 'refreshtoken'),
}));

// Mock middleware
jest.mock('@greed-advisor/middleware', () => ({
  withApiMiddleware: jest.fn((handler) => handler),
  withValidation: jest.fn((schema) => (handler) => (req) => {
    // Mock validation - assume valid data
    const validatedData = {
      email: 'test@example.com',
      password: 'password123',
    };
    return handler(req, validatedData);
  }),
}));

// Mock validations
jest.mock('@greed-advisor/validations', () => ({
  registerSchema: {
    safeParse: jest.fn(() => ({
      success: true,
      data: { email: 'test@example.com', password: 'password123' },
    })),
  },
}));

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    // Mock that user doesn't exist
    const mockPrisma = require('@/lib/prisma').prisma;
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      createdAt: new Date(),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('User created successfully');
    expect(data.user.email).toBe('test@example.com');
  });

  it('should return error for existing user', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'existing@example.com',
        password: 'password123',
      },
    });

    // Mock that user exists
    const mockPrisma = require('@/lib/prisma').prisma;
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'existing@example.com',
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User already exists');
  });
});
