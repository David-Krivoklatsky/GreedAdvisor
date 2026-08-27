/* eslint-disable no-console */
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// Rotation: decrypts all stored API keys with the CURRENT ENCRYPTION_KEY and
// re-encrypts them with NEW_ENCRYPTION_KEY. Run it after rotating the key.
//   NEW_ENCRYPTION_KEY="<new key>" npm run db:rotate-keys
loadEnv({ path: join(__dirname, '..', '..', '.env'), quiet: true });
loadEnv({ path: join(__dirname, '.env'), quiet: true });

async function main(): Promise<void> {
  const oldKey = process.env.ENCRYPTION_KEY;
  const newKey = process.env.NEW_ENCRYPTION_KEY;
  if (!oldKey || !newKey) {
    console.error('Set both ENCRYPTION_KEY (old) and NEW_ENCRYPTION_KEY (new).');
    process.exit(1);
  }

  const { prisma } = await import('./index');
  const { decryptSecret, encryptSecret, isEncrypted } = await import('@greed-advisor/crypto');

  // Phase 1: decrypt everything with the old key.
  process.env.ENCRYPTION_KEY = oldKey;
  const decrypt = (value: string) => (isEncrypted(value) ? decryptSecret(value) : value);

  const tradingPlain = (await prisma.t212ApiKey.findMany({ where: { deletedAt: null } })).map(
    r => ({ id: r.id, apiKey: decrypt(r.apiKey), apiSecret: decrypt(r.apiSecret) })
  );
  const aiPlain = (await prisma.aiApiKey.findMany({ where: { deletedAt: null } })).map(r => ({
    id: r.id,
    apiKey: decrypt(r.apiKey)
  }));
  const mdPlain = (await prisma.marketDataKey.findMany({ where: { deletedAt: null } })).map(r => ({
    id: r.id,
    apiKey: decrypt(r.apiKey)
  }));

  // Phase 2: re-encrypt everything with the new key.
  process.env.ENCRYPTION_KEY = newKey;
  let rotated = 0;
  for (const row of tradingPlain) {
    await prisma.t212ApiKey.update({
      where: { id: row.id },
      data: { apiKey: encryptSecret(row.apiKey), apiSecret: encryptSecret(row.apiSecret) }
    });
    rotated++;
  }
  for (const row of aiPlain) {
    await prisma.aiApiKey.update({
      where: { id: row.id },
      data: { apiKey: encryptSecret(row.apiKey) }
    });
    rotated++;
  }
  for (const row of mdPlain) {
    await prisma.marketDataKey.update({
      where: { id: row.id },
      data: { apiKey: encryptSecret(row.apiKey) }
    });
    rotated++;
  }

  console.log(
    `Rotated ${rotated} API key(s) to the new ENCRYPTION_KEY. Update .env / Vercel secret next.`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
