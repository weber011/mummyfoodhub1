import { createHash, randomInt } from 'crypto';
import { redisGet, redisSet, redisDel, redisIncr, redisExpire } from './redis';

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_SECONDS ?? '900', 10); // 15 minutes
const RATE_LIMIT_WINDOW = 900; // 15 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 30; // 30 seconds between resends

function hashOtp(otp: string, email: string): string {
  return createHash('sha256').update(`${email}:${otp}`).digest('hex');
}

export function generateOtp(): string {
  // 6-digit OTP
  return String(randomInt(100000, 999999));
}

export async function storeOtp(email: string, otp: string): Promise<void> {
  const key = `otp:${email}`;
  const resendKey = `otp_resend:${email}`;

  // Check resend cooldown
  const resendTtl = await redisGet<number>(resendKey);
  if (resendTtl !== null) {
    throw new Error('RESEND_TOO_SOON');
  }

  // Store hashed OTP (never store plaintext)
  await redisSet(key, { hash: hashOtp(otp, email), attempts: 0 }, OTP_EXPIRY);
  // Set resend cooldown
  await redisSet(resendKey, 1, RESEND_COOLDOWN);
}

export type OtpVerifyResult =
  | { success: true }
  | { success: false; reason: 'INVALID' | 'EXPIRED' | 'MAX_ATTEMPTS' };

export async function verifyOtp(email: string, code: string): Promise<OtpVerifyResult> {
  const key = `otp:${email}`;
  const attemptsKey = `otp_attempts:${email}`;

  // Rate limit: count attempts
  const attempts = await redisIncr(attemptsKey);
  if (attempts === 1) {
    await redisExpire(attemptsKey, RATE_LIMIT_WINDOW);
  }
  if (attempts > MAX_ATTEMPTS) {
    return { success: false, reason: 'MAX_ATTEMPTS' };
  }

  const stored = await redisGet<{ hash: string; attempts: number }>(key);
  if (!stored) {
    return { success: false, reason: 'EXPIRED' };
  }

  const expectedHash = hashOtp(code, email);
  if (stored.hash !== expectedHash) {
    return { success: false, reason: 'INVALID' };
  }

  // Single-use: delete the OTP
  await redisDel(key);
  await redisDel(attemptsKey);
  return { success: true };
}

export async function canResendOtp(email: string): Promise<boolean> {
  const resendKey = `otp_resend:${email}`;
  const val = await redisGet<number>(resendKey);
  return val === null;
}
