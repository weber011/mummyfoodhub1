import { redisGet, redisSet } from './redis';
import type { Coupon } from './types';

const DEFAULT_WELCOME_COUPON: Coupon = {
  code: 'WELCOME100',
  type: 'welcome',
  discount: 100,
  minOrderValue: 499,
  enabled: true,
  description: '₹100 OFF on your first order above ₹499',
};

const COUPON_SETTINGS_KEY = 'coupon:WELCOME100';

export async function getWelcomeCoupon(): Promise<Coupon> {
  const stored = await redisGet<Coupon>(COUPON_SETTINGS_KEY);
  return stored ?? DEFAULT_WELCOME_COUPON;
}

export async function updateWelcomeCoupon(updates: Partial<Coupon>): Promise<Coupon> {
  const existing = await getWelcomeCoupon();
  const updated: Coupon = { ...existing, ...updates, code: 'WELCOME100', type: 'welcome' };
  await redisSet(COUPON_SETTINGS_KEY, updated);
  return updated;
}

export type CouponValidateResult =
  | { valid: true; discount: number; message: string }
  | { valid: false; reason: string };

export async function validateCoupon(
  code: string,
  userId: string,
  subtotal: number,
  hasPlacedOrder: boolean
): Promise<CouponValidateResult> {
  const normalized = code.trim().toUpperCase();

  if (normalized === 'WELCOME100') {
    const coupon = await getWelcomeCoupon();

    if (!coupon.enabled) {
      return { valid: false, reason: 'This offer is currently unavailable.' };
    }
    if (hasPlacedOrder) {
      return { valid: false, reason: 'WELCOME100 is only valid on your first order.' };
    }
    if (subtotal < coupon.minOrderValue) {
      return { valid: false, reason: `Minimum order of ₹${coupon.minOrderValue} required for this offer.` };
    }
    return { valid: true, discount: coupon.discount, message: `₹${coupon.discount} welcome discount applied!` };
  }

  return { valid: false, reason: 'Invalid coupon code.' };
}
