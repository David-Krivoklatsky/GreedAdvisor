import { loadEngineEnv } from './env';

loadEngineEnv();

async function main(): Promise<void> {
  const { runScheduler } = await import('./scheduler');
  await runScheduler();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
