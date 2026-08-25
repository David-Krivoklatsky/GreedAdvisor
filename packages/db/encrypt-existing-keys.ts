import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// Load repo-root .env (ENCRYPTION_KEY) + packages/db/.env (DATABASE_URL)
loadEnv({ path: join(__dirname, '..', '..', '.env'), quiet: true });
loadEnv({ path: join(__dirname, '.env'), quiet: true });

async function main(): Promise<void> {
  const { prisma } = await import('./index');
  const { encryptSecret, isEncrypted } = await import('@greed-advisor/crypto');

  let encrypted = 0;

  const tradingKeys = await prisma.t212ApiKey.findMany({ where: { deletedAt: null } });
  for (const key of tradingKeys) {
    const apiKey = isEncrypted(key.apiKey) ? key.apiKey : encryptSecret(key.apiKey);
    const apiSecret = isEncrypted(key.apiSecret) ? key.apiSecret : encryptSecret(key.apiSecret);
    if (apiKey !== key.apiKey || apiSecret !== key.apiSecret) {
      await prisma.t212ApiKey.update({ where: { id: key.id }, data: { apiKey, apiSecret } });
      encrypted++;
    }
  }

  const aiKeys = await prisma.aiApiKey.findMany({ where: { deletedAt: null } });
  for (const key of aiKeys) {
    const apiKey = isEncrypted(key.apiKey) ? key.apiKey : encryptSecret(key.apiKey);
    if (apiKey !== key.apiKey) {
      await prisma.aiApiKey.update({ where: { id: key.id }, data: { apiKey } });
      encrypted++;
    }
  }

  const marketDataKeys = await prisma.marketDataKey.findMany({ where: { deletedAt: null } });
  for (const key of marketDataKeys) {
    const apiKey = isEncrypted(key.apiKey) ? key.apiKey : encryptSecret(key.apiKey);
    if (apiKey !== key.apiKey) {
      await prisma.marketDataKey.update({ where: { id: key.id }, data: { apiKey } });
      encrypted++;
    }
  }

  console.log(`Encrypted ${encrypted} API key(s).`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
