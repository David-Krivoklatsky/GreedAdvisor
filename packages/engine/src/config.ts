export function envBool(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export function envInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function isEnginePaused(): boolean {
  return envBool('ENGINE_PAUSED') || envBool('ENGINE_ENABLED', true) === false;
}

export function log(level: 'info' | 'warn' | 'error', message: string, meta?: unknown): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console.log(line, JSON.stringify(meta));
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}
