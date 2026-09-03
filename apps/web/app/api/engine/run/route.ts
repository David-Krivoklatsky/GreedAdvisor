import { withApiMiddleware } from '@greed-advisor/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/engine/run?configId=<id>   → run one cycle
// GET  /api/engine/run?all=true  → run every enabled cycle (Vercel cron)
// Requires ENGINE_WEBHOOK_SECRET (header `x-engine-secret` or JSON body `secret`).
// Query param `secret` is no longer supported (security: logs). Lets Vercel cron /
// cron-job.org / GH Actions invoke the engine without a long-running worker.
export const POST = withApiMiddleware(handle);
export const GET = withApiMiddleware(handle);

async function handle(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.ENGINE_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json(
      { success: false, message: 'Engine webhook not configured' },
      { status: 503 }
    );
  }

  const headerSecret = req.headers.get('x-engine-secret');
  const bodySecret =
    req.method === 'POST'
      ? await req
          .json()
          .then((body: { secret?: string }) => body?.secret)
          .catch(() => undefined)
      : undefined;

  const authorized = headerSecret === expected || bodySecret === expected;
  if (!authorized) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized', error: 'Invalid secret' },
      { status: 401 }
    );
  }

  const configId = Number(req.nextUrl.searchParams.get('configId') ?? '');
  const runAll = req.nextUrl.searchParams.get('all') === 'true';

  if (!runAll && !Number.isInteger(configId)) {
    return NextResponse.json(
      {
        success: false,
        message: 'configId query param (or ?all=true) is required',
        error: 'Invalid request'
      },
      { status: 400 }
    );
  }

  const { runCycle } = await import('@greed-advisor/engine');

  if (runAll) {
    const { prisma } = await import('@/lib/prisma');
    const configs = await prisma.automationConfig.findMany({
      where: { enabled: true, deletedAt: null },
      select: { id: true }
    });
    const results: unknown[] = [];
    for (const config of configs) {
      results.push({ configId: config.id, ...(await runCycle(config.id)) });
    }
    return NextResponse.json({ success: true, results });
  }

  const result = await runCycle(configId);
  return NextResponse.json({ success: true, result });
}
