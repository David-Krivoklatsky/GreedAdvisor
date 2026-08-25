import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const VERSION = 'enc:v1:';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('ENCRYPTION_KEY is required (min 16 chars) to encrypt/decrypt secrets');
  }
  return createHash('sha256').update(secret).digest();
}

// Encrypt a secret at rest. Format: enc:v1:<base64(iv + tag + ciphertext)>.
// Empty values are returned unchanged.
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${VERSION}${Buffer.concat([iv, tag, encrypted]).toString('base64')}`;
}

// Decrypt a secret. Values that are not `enc:v1:`-prefixed are treated as
// legacy plaintext and returned unchanged (supports key migration).
export function decryptSecret(value: string): string {
  if (!value || !value.startsWith(VERSION)) return value;

  const raw = Buffer.from(value.slice(VERSION.length), 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = raw.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(VERSION);
}
