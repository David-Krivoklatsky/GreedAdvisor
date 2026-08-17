import { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
}
