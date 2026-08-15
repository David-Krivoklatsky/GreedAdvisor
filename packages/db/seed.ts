import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@greedadvisor.com' },
    update: {},
    create: {
      email: 'demo@greedadvisor.com',
      password: passwordHash,
      name: 'Demo User',
      firstName: 'Demo',
      lastName: 'User',
      isActive: true,
    },
  });

  await prisma.aiApiKey.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'OpenAI Sandbox',
        provider: 'openai',
        apiKey: 'sk-demo-placeholder',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.t212ApiKey.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'Trading212 Demo',
        apiKey: 'demo-placeholder',
        apiSecret: 'demo-secret-placeholder',
        environment: 'demo',
        accessType: 'read-only',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeded demo user: demo@greedadvisor.com / Password123!');
}

main()
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
