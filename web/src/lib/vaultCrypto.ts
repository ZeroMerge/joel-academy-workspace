import crypto from 'node:crypto';

// Secret key derivation from env or fallback for local dev
const ENCRYPTION_KEY_RAW = process.env.VAULT_ENCRYPTION_KEY || 'joel-academy-secure-vault-key-32b!';
// Ensure 32 bytes for aes-256-gcm
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  tag: string;
  version: number;
}

export function encryptSecret(plainText: string, version = 1): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    cipherText: encrypted,
    iv: iv.toString('hex'),
    tag,
    version
  };
}

export function decryptSecret(payload: EncryptedPayload): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  
  let decrypted = decipher.update(payload.cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
