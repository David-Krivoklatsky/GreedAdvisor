import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '@greed-advisor/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const existing = await prisma.watchlistItem.findFirst({
      where: { id, userId: decoded.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Watchlist item not found' }, { status: 404 });
    }

    // Soft delete (set inactive) so re-adding keeps history
    await prisma.watchlistItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Watchlist item removed' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove watchlist item', details: message },
      { status: 500 }
    );
  }
}
