import { prisma } from '@/lib/prisma';
import { getMarketDataService } from '@/lib/providers';
import { withApiMiddleware, withAuth, withValidation } from '@greed-advisor/middleware';
import { marketDataKeyTestSchema } from '@greed-advisor/validations';
import type { MarketDataKeyTestInput } from '@greed-advisor/validations';
import { NextResponse } from 'next/server';

export const POST = withApiMiddleware(
  withValidation(marketDataKeyTestSchema)(
    withAuth(async (_req, ctx) => {
      const { keyId } = ctx.data as MarketDataKeyTestInput;

      const key = await prisma.marketDataKey.findFirst({
        where: { id: keyId, userId: ctx.userId, deletedAt: null },
      });

      if (!key) {
        return NextResponse.json(
          { success: false, message: 'API key not found', error: 'API key not found' },
          { status: 404 }
        );
      }

      const provider = await getMarketDataService(ctx.userId, keyId);
      if (!provider) {
        return NextResponse.json(
          { success: false, message: 'No active market data key found', error: 'No active key' },
          { status: 400 }
        );
      }

      const quote = await provider.service.getQuote('AAPL');

      await prisma.marketDataKey.update({
        where: { id: keyId },
        data: { lastUsed: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: 'Market data API key is valid',
        quote,
      });
    })
  )
);
