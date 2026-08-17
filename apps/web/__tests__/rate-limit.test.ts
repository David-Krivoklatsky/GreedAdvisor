import { describe, expect, it } from '@jest/globals';

import { rateLimit } from '@greed-advisor/rate-limit';

describe('@greed-advisor/rate-limit', () => {
  it('allows the first request from an IP', () => {
    const result = rateLimit('127.0.0.1');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it('tracks distinct IPs separately', () => {
    expect(rateLimit('203.0.113.1').success).toBe(true);
    expect(rateLimit('203.0.113.2').success).toBe(true);
  });

  it('blocks requests beyond the 100/15min window', () => {
    const ip = '198.51.100.1';
    for (let i = 0; i < 100; i++) {
      expect(rateLimit(ip).success).toBe(true);
    }
    const blocked = rateLimit(ip);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBeUndefined();
  });
});
