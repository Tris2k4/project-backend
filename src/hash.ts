import crypto from 'crypto';
export function getHashOf(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

export function randomNumber(): number {
  return Math.floor(Math.random() * 1e16);
}
