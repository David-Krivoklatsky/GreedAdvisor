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

    // For now, return mock data since positions table doesn't exist yet
    // In a real implementation, you would fetch from a positions table
    const positions = [
      {
        id: 1,
        symbol: 'EUR/USD',
        type: 'BUY',
        size: 0.1,
        openPrice: 1.085,
        currentPrice: 1.0875,
        pnl: 25.0,
        status: 'OPEN',
        openTime: '2025-07-12T10:30:00Z',
      },
      {
        id: 2,
        symbol: 'GBP/USD',
        type: 'SELL',
        size: 0.05,
        openPrice: 1.275,
        currentPrice: 1.274,
        pnl: 5.0,
        status: 'OPEN',
        openTime: '2025-07-12T09:15:00Z',
      },
      {
        id: 3,
        symbol: 'USD/JPY',
        type: 'BUY',
        size: 0.2,
        openPrice: 149.5,
        currentPrice: 149.45,
        pnl: -10.0,
        status: 'WAITING',
        openTime: '2025-07-12T11:00:00Z',
      },
    ];

    return NextResponse.json({ positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
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

    const body = await request.json();
    const { symbol, type, size, price } = body;

    // Validate input
    if (!symbol || !type || !size || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['BUY', 'SELL'].includes(type)) {
      return NextResponse.json({ error: 'Invalid position type' }, { status: 400 });
    }

    // For now, return a mock response
    // In a real implementation, you would create a position in the database
    const newPosition = {
      id: Date.now(),
      symbol,
      type,
      size,
      openPrice: price,
      currentPrice: price,
      pnl: 0,
      status: 'OPEN',
      openTime: new Date().toISOString(),
      userId: decoded.userId,
    };

    return NextResponse.json({ position: newPosition }, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
