import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const JWT_SECRET = process.env.JWT_SECRET;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' });
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): { userId: any; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: any; email: string };
    if (!decoded || typeof decoded.userId === 'undefined') {
      throw new Error('Invalid token payload');
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: any; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: any; email: string };
    if (!decoded || typeof decoded.userId === 'undefined') {
      throw new Error('Invalid token payload');
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Legacy function for backward compatibility
export function signToken(payload: object): string {
  return signAccessToken(payload);
}

export function verifyToken(token: string): { userId: any } | null {
  const result = verifyAccessToken(token);
  return result ? { userId: result.userId } : null;
}
