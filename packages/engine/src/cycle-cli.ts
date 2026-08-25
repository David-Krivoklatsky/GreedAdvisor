import { loadEngineEnv } from './env';

loadEngineEnv();

async function main(): Promise<void> {
  const configId = Number(process.argv[2]);
  if (!Number.isInteger(configId) || configId <= 0) {
    console.error('Usage: tsx src/cycle-cli.ts <configId>');
    process.exit(1);
  }
  const { runCycle } = await import('./cycle');
  const result = await runCycle(configId);
  console.log(JSON.stringify(result));
  process.exit(result.status === 'success' ? 0 : 1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
