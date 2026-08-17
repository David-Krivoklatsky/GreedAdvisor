import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function logKeyAudit(
  userId: number,
  keyType: 'ai' | 'trading' | 'market-data',
  action: 'created' | 'updated' | 'deleted',
  req: NextRequest
): Promise<void> {
  await prisma.apiKeyLog.create({
    data: {
      userId,
      keyType,
      action,
      ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '',
      userAgent: req.headers.get('user-agent') ?? '',
    },
  });
}
