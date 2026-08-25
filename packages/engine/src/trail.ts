// Pure stop-trailing logic. Returns the new stop price to set, or null when
// the stop should not move. Only ratchets in the favorable direction.
export function computeTrailStop(params: {
  entry: number;
  price: number;
  atr: number;
  currentStop: number | null;
}): number | null {
  const { entry, price, atr, currentStop } = params;
  if (atr <= 0 || price <= 0 || entry <= 0) return null;

  const favorable = price - entry;
  if (favorable < atr) {
    // Not enough profit yet to justify moving the stop.
    return null;
  }

  // At minimum move to breakeven; otherwise trail one ATR behind price.
  let desired = Math.max(entry, currentStop ?? 0);
  const trailStop = price - atr;
  if (trailStop > desired) desired = trailStop;

  const rounded = Number(desired.toFixed(2));
  return rounded > 0 && (currentStop === null || rounded > currentStop) ? rounded : null;
}
