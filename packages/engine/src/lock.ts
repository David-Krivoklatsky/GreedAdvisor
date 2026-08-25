import { prisma } from '@greed-advisor/db';

const LOCK_BASE = BigInt(1_000_000_000);

// Postgres advisory lock keyed per automation config. Ensures only one process
// executes a given config's cycle at a time (single-instance safety backstop).
export function lockKeyForConfig(configId: number): bigint {
  return LOCK_BASE + BigInt(configId);
}

export async function tryAcquireAdvisoryLock(key: bigint): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ locked: boolean }[]>`
    SELECT pg_try_advisory_lock(${key}) AS locked
  `;
  return rows[0]?.locked ?? false;
}

export async function releaseAdvisoryLock(key: bigint): Promise<void> {
  await prisma.$queryRaw`SELECT pg_advisory_unlock(${key})`;
}
