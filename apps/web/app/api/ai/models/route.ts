import { NextResponse } from 'next/server';
import { withApiMiddleware } from '@greed-advisor/middleware';
import {
  AI_MODEL_OPTIONS,
  listOpenRouterModels,
  type AiProvider,
  type AiModelTier
} from '@greed-advisor/ai';

export const GET = withApiMiddleware(async req => {
  const url = new URL(req.url);
  const provider = (url.searchParams.get('provider') ?? 'openai') as AiProvider;
  const tier = (url.searchParams.get('tier') ?? 'all') as AiModelTier;

  // Live OpenRouter model list (public endpoint). Falls back to the static
  // options if OpenRouter is unreachable or returns no models.
  if (provider === 'openrouter') {
    try {
      const live = await listOpenRouterModels(tier);
      if (live.length > 0) {
        return NextResponse.json({ success: true, models: live });
      }
    } catch {
      // fall through to static options
    }
  }

  const staticOptions = AI_MODEL_OPTIONS[provider] ?? AI_MODEL_OPTIONS.openai;
  return NextResponse.json({ success: true, models: staticOptions });
});
