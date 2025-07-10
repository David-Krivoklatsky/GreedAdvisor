import { prisma } from '@greed-advisor/db';

/**
 * Update the last used timestamp for an AI API key
 */
export async function updateAiKeyLastUsed(keyId: number) {
  try {
    await prisma.aiApiKey.update({
      where: { id: keyId },
      data: { lastUsed: new Date() },
    });
  } catch (error) {
    console.error('Failed to update AI key last used:', error);
  }
}

/**
 * Update the last used timestamp for a Trading API key
 */
export async function updateTradingKeyLastUsed(keyId: number) {
  try {
    await prisma.t212ApiKey.update({
      where: { id: keyId },
      data: { lastUsed: new Date() },
    });
  } catch (error) {
    console.error('Failed to update Trading key last used:', error);
  }
}

/**
 * Get active AI API keys for a user
 */
export async function getActiveAiKeys(userId: number) {
  return await prisma.aiApiKey.findMany({
    where: {
      userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      provider: true,
      apiKey: true,
      lastUsed: true,
    },
  });
}

/**
 * Get active Trading API keys for a user
 */
export async function getActiveTradingKeys(userId: number) {
  return await prisma.t212ApiKey.findMany({
    where: {
      userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      accessType: true,
      apiKey: true,
      lastUsed: true,
    },
  });
}

/**
 * Mask an API key for display purposes
 * Shows first 4 and last 4 characters, masks the middle
 */
export function maskApiKey(apiKey: string, showCount: number = 4): string {
  if (!apiKey || apiKey.length <= showCount * 2) {
    return '••••••••••••••••••••••••••••••••';
  }

  const start = apiKey.substring(0, showCount);
  const end = apiKey.substring(apiKey.length - showCount);
  const maskedMiddle = '•'.repeat(Math.max(8, apiKey.length - showCount * 2));

  return `${start}${maskedMiddle}${end}`;
}

/**
 * Get a partial display version of API keys for user interface
 */
export async function getApiKeysForDisplay(userId: number) {
  const [aiKeys, tradingKeys] = await Promise.all([
    prisma.aiApiKey.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        provider: true,
        apiKey: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.t212ApiKey.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        accessType: true,
        apiKey: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    aiKeys: aiKeys.map((key) => ({
      ...key,
      maskedApiKey: maskApiKey(key.apiKey),
    })),
    tradingKeys: tradingKeys.map((key) => ({
      ...key,
      maskedApiKey: maskApiKey(key.apiKey),
    })),
  };
}
