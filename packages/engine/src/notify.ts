import { prisma } from '@greed-advisor/db';
import { log } from './config';

export type NotificationType = 'signal' | 'order' | 'sl_tp' | 'daily_loss' | 'error' | 'system';

export async function notify(
  userId: number,
  telegramChatId: string | null,
  type: NotificationType,
  title: string,
  body?: string,
  payload?: unknown
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        payload: payload !== undefined ? (payload as object) : undefined
      }
    });
  } catch (error) {
    log('error', 'Failed to persist notification', { error: String(error) });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (telegramChatId && token) {
    try {
      await sendTelegram(token, telegramChatId, `${title}${body ? `\n\n${body}` : ''}`);
    } catch (error) {
      log('error', 'Failed to send Telegram notification', { error: String(error) });
    }
  }

  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          body,
          payload: payload ?? null,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(5000)
      });
    } catch (error) {
      log('error', 'Failed to deliver notification webhook', { error: String(error) });
    }
  }
}

async function sendTelegram(token: string, chatId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4096) })
  });
}
