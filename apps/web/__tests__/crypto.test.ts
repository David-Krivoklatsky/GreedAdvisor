import { describe, expect, it, beforeAll } from '@jest/globals';
import { decryptSecret, encryptSecret, isEncrypted } from '@greed-advisor/crypto';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
});

describe('@greed-advisor/crypto', () => {
  it('round-trips a secret', () => {
    const secret = 'sk-live-abcdef123456';
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toBe(secret);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it('produces different ciphertext for the same input (random IV)', () => {
    const a = encryptSecret('same-value');
    const b = encryptSecret('same-value');
    expect(a).not.toBe(b);
  });

  it('passes legacy plaintext through unchanged', () => {
    const legacy = 'legacy-plaintext-key';
    expect(isEncrypted(legacy)).toBe(false);
    expect(decryptSecret(legacy)).toBe(legacy);
  });

  it('handles empty values', () => {
    expect(encryptSecret('')).toBe('');
    expect(decryptSecret('')).toBe('');
  });

  it('tampered ciphertext throws', () => {
    const encrypted = encryptSecret('sensitive');
    const tampered = encrypted.slice(0, -4) + 'AAAA';
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
