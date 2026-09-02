import { computeIndicators, MarketDataService } from '@greed-advisor/market-data';

export interface CandidateScore {
  symbol: string;
  score: number;
  rsi: number | null;
  ema9: number | null;
  ema21: number | null;
  macdHist: number | null;
}

// Cheap technical pre-screen used to rank the candidate universe before
// spending LLM + market-data credits on a full report. Higher score = more
// interesting (momentum + volume attention).
export async function preScreenSymbol(
  service: MarketDataService,
  symbol: string,
  dataSymbol = symbol
): Promise<CandidateScore | null> {
  try {
    const candles = await service.getCandles(dataSymbol, '1h', 50);
    if (candles.length < 26) return null;

    const { snapshot } = computeIndicators(candles);
    let score = 0;

    if (snapshot.ema9 != null && snapshot.ema21 != null) {
      score += snapshot.ema9 > snapshot.ema21 ? 1 : -1;
    }
    if (snapshot.rsi != null) {
      if (snapshot.rsi > 72) {
        score -= 1; // overbought — chase risk for new entries
      } else if (snapshot.rsi >= 50 && snapshot.rsi <= 70) {
        score += 1;
      }
    }
    if (snapshot.macdHistogram != null) {
      score += snapshot.macdHistogram > 0 ? 1 : -1;
    }

    const recent = candles.slice(-10);
    const avgVolume =
      recent.slice(0, 5).reduce((sum, c) => sum + c.volume, 0) /
      Math.max(1, recent.slice(0, 5).length);
    const lastVolume = recent[recent.length - 1]?.volume ?? 0;
    if (avgVolume > 0 && lastVolume > avgVolume * 1.5) {
      score += 1; // volume spike
    }

    return {
      symbol,
      score,
      rsi: snapshot.rsi,
      ema9: snapshot.ema9,
      ema21: snapshot.ema21,
      macdHist: snapshot.macdHistogram
    };
  } catch {
    return null;
  }
}

export function rankCandidates(
  scores: CandidateScore[],
  fallback: string[],
  max: number
): string[] {
  const ranked = scores.sort((a, b) => b.score - a.score).map(s => s.symbol);
  const symbols = ranked.length > 0 ? ranked : fallback;
  return symbols.slice(0, max);
}
