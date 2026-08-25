import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

// Loads the monorepo root `.env` (and `packages/db/.env` for Prisma) before any
// module that reads `process.env.DATABASE_URL` is imported. No-ops when running
// inside Next.js, which injects environment variables itself.
export function loadEngineEnv(): void {
  if (process.env.NEXT_RUNTIME) {
    return;
  }

  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    dir = resolve(dir, i === 0 ? '.' : '..');
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'node_modules'))) {
      loadEnv({ path: join(dir, '.env'), quiet: true });
      loadEnv({ path: join(dir, 'packages', 'db', '.env'), quiet: true });
      return;
    }
  }

  // Fallback: load whatever `.env` exists in the current working directory.
  loadEnv({ quiet: true });
}
