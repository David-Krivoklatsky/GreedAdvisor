import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let JWT_SECRET: string | null = null;

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    JWT_SECRET = process.env.JWT_SECRET ?? null;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
  }
  return JWT_SECRET;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30m' });
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export interface TokenPayload {
  userId: number;
  email: string;
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    if (!decoded || typeof decoded.userId === 'undefined') {
      throw new Error('Invalid token payload');
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  return verifyAccessToken(token);
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}
