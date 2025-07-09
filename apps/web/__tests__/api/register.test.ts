import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/auth/register/route';

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
  rateLimit: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock auth functions
jest.mock('@greed-advisor/auth', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hashedpassword')),
  signToken: jest.fn(() => 'mocktoken'),
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

    const response = await handler.POST(req as any);
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

    const response = await handler.POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User already exists');
  });
});
