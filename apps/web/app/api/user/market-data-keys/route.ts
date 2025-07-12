import { prisma } from '@/lib/prisma';
import { verifyToken } from '@greed-advisor/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const marketDataKeys = await prisma.marketDataApiKey.findMany({
      where: {
        userId: decoded.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        provider: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ marketDataKeys });
  } catch (error) {
    console.error('Error fetching market data keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { title, provider, apiKey } = await request.json();

    if (!title || !provider || !apiKey) {
      return NextResponse.json(
        { error: 'Title, provider, and API key are required' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = [
      'alphavantage',
      'finnhub',
      'iexcloud',
      'polygon',
      'tradingview',
      'other',
    ];
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const marketDataKey = await prisma.marketDataApiKey.create({
      data: {
        userId: decoded.userId,
        title,
        provider: provider.toLowerCase(),
        apiKey,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        provider: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ marketDataKey }, { status: 201 });
  } catch (error) {
    console.error('Error creating market data key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id, title, provider, apiKey, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // Verify the key belongs to the user
    const existingKey = await prisma.marketDataApiKey.findFirst({
      where: {
        id: parseInt(id),
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (provider !== undefined) updateData.provider = provider.toLowerCase();
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedKey = await prisma.marketDataApiKey.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        title: true,
        provider: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ marketDataKey: updatedKey });
  } catch (error) {
    console.error('Error updating market data key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // Verify the key belongs to the user
    const existingKey = await prisma.marketDataApiKey.findFirst({
      where: {
        id: parseInt(id),
        userId: decoded.userId,
        deletedAt: null,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.marketDataApiKey.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ message: 'Market data key deleted successfully' });
  } catch (error) {
    console.error('Error deleting market data key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
