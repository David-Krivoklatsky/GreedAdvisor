import { withApiMiddleware } from '@greed-advisor/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/engine/run?configId=<id>       → run one cycle (secret in header/body)
// GET  /api/engine/run?all=true            → run every enabled cycle (Vercel cron)
//
// Auth (any one of):
//   - `x-engine-secret` header   (cron-job.org / GH Actions / curl)
//   - JSON body `secret`         (POST)
//   - `?secret=` query param     (clients that can't set headers)
//   - `x-vercel-cron-schedule` header (Vercel cron only — sent automatically
//     on genuine cron requests, so no secret needs to be committed in vercel.json)
export const POST = withApiMiddleware(handle);
export const GET = withApiMiddleware(handle);

async function handle(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.ENGINE_WEBHOOK_SECRET;

  const headerSecret = req.headers.get('x-engine-secret');
  const querySecret = req.nextUrl.searchParams.get('secret') ?? undefined;
  const bodySecret =
    req.method === 'POST'
      ? await req
          .json()
          .then((body: { secret?: string }) => body?.secret)
          .catch(() => undefined)
      : undefined;

  // Vercel cron requests carry x-vercel-cron-schedule and cannot set the secret
  // header, so a matching scheduled invocation is treated as authorized.
  const isVercelCron = Boolean(req.headers.get('x-vercel-cron-schedule'));

  const authorized =
    isVercelCron ||
    (headerSecret !== null && expected !== undefined && headerSecret === expected) ||
    (querySecret !== undefined && expected !== undefined && querySecret === expected) ||
    (bodySecret !== undefined && expected !== undefined && bodySecret === expected);

  if (!expected && !isVercelCron) {
    return NextResponse.json(
      { success: false, message: 'Engine webhook not configured' },
      { status: 503 }
    );
  }
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
