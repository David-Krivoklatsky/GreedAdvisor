import { prisma } from '@greed-advisor/db';
import { runCycle } from './cycle';
import { envInt, isEnginePaused, log } from './config';

// Long-running worker scheduler (PM2). Heartbeats every ENGINE_TICK_MS and runs
// every due automation config exactly once thanks to the advisory lock + the
// persisted `nextRunAt`.
export async function runScheduler(): Promise<void> {
  const tickMs = envInt('ENGINE_TICK_MS', 60_000);
  log('info', 'Engine scheduler started', { tickMs });

  while (true) {
    try {
      await tick();
    } catch (error) {
      log('error', 'Scheduler tick failed', { error: String(error) });
    }
    await sleep(tickMs);
  }
}

async function tick(): Promise<void> {
  if (isEnginePaused()) {
    log('info', 'Engine paused — skipping tick');
    return;
  }

  const due = await prisma.automationConfig.findMany({
    where: {
      enabled: true,
      deletedAt: null,
      nextRunAt: { lte: new Date() }
    },
    select: { id: true }
  });

  for (const config of due) {
    try {
      const result = await runCycle(config.id);
      log('info', `Cycle ${config.id} → ${result.status}`, { reason: result.reason });
    } catch (error) {
      log('error', `Cycle ${config.id} threw`, { error: String(error) });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
