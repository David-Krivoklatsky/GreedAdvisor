const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl:
    'postgresql://neondb_owner:npg_I2HKMZebdC8T@ep-icy-feather-a21z9dvk.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const configs = await prisma.automationConfig.findMany();
  console.log('Automation configs:', JSON.stringify(configs, null, 2));
  const users = await prisma.user.findMany();
  console.log('Users:', JSON.stringify(users, null, 2));
  const keys = await prisma.t212ApiKey.findMany();
  console.log('Trading keys:', JSON.stringify(keys, null, 2));
  const aiKeys = await prisma.aiApiKey.findMany();
  console.log('AI keys:', JSON.stringify(aiKeys, null, 2));
  const mdKeys = await prisma.marketDataKey.findMany();
  console.log('Market data keys:', JSON.stringify(mdKeys, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
