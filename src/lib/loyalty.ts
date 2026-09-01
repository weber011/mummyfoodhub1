import { redisGet, redisSet, redisSIsMember, redisSAdd } from './redis';
import type { LoyaltyRecord } from './types';

const LOYALTY_PREFIX = 'loyalty:';
const PROCESSED_ORDERS_SET = 'loyalty:processed_orders';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Get or initialize loyalty record for a customer email
 */
export async function getLoyaltyRecord(email: string, customerId?: string): Promise<LoyaltyRecord> {
  const normEmail = normalizeEmail(email);
  const key = `${LOYALTY_PREFIX}${normEmail}`;
  const record = await redisGet<LoyaltyRecord>(key);

  if (record) {
    return record;
  }

  const newRecord: LoyaltyRecord = {
    customerId: customerId || normEmail,
    email: normEmail,
    qualifyingMealCount: 0,
    rewardAvailable: false,
    rewardRedeemed: false,
    rewardCycle: 1,
    totalRewardsRedeemed: 0,
    updatedAt: new Date().toISOString(),
  };

  await redisSet(key, newRecord);
  return newRecord;
}

/**
 * Record a qualifying individual meal order for a customer.
 * Idempotent: will not count the same orderId twice.
 */
export async function recordQualifyingOrder(
  email: string,
  orderId: string,
  customerId?: string
): Promise<{ record: LoyaltyRecord; rewardUnlocked: boolean }> {
  const normEmail = normalizeEmail(email);

  // Idempotency: Check if this order was already processed for loyalty
  const alreadyProcessed = await redisSIsMember(PROCESSED_ORDERS_SET, orderId);
  const current = await getLoyaltyRecord(normEmail, customerId);

  if (alreadyProcessed) {
    return { record: current, rewardUnlocked: false };
  }

  // Mark order as processed for loyalty
  await redisSAdd(PROCESSED_ORDERS_SET, orderId);

  const newCount = (current.qualifyingMealCount || 0) + 1;
  const rewardUnlocked = newCount >= 4;

  const updated: LoyaltyRecord = {
    ...current,
    customerId: customerId || current.customerId,
    qualifyingMealCount: rewardUnlocked ? 4 : newCount,
    rewardAvailable: rewardUnlocked,
    rewardRedeemed: false,
    lastQualifiedOrder: orderId,
    updatedAt: new Date().toISOString(),
  };

  await redisSet(`${LOYALTY_PREFIX}${normEmail}`, updated);
  return { record: updated, rewardUnlocked };
}

/**
 * Validate and calculate the 5th Meal Loyalty Reward (15% discount + ₹0 delivery).
 * Server-side validation — frontend cannot spoof discounts.
 */
export async function validateAndApplyLoyaltyReward(params: {
  email: string;
  subtotal: number;
  standardDelivery: number;
}): Promise<{
  applicable: boolean;
  discount: number;
  deliveryCharge: number;
  reason?: string;
}> {
  const normEmail = normalizeEmail(params.email);
  const record = await getLoyaltyRecord(normEmail);

  if (!record.rewardAvailable || record.rewardRedeemed) {
    return {
      applicable: false,
      discount: 0,
      deliveryCharge: params.standardDelivery,
      reason: 'No active loyalty reward available. Complete 4 qualifying meals to unlock 15% OFF + Free Delivery.',
    };
  }

  // 15% discount on subtotal
  const discount = Math.round(params.subtotal * 0.15);
  // Free delivery (₹0)
  const deliveryCharge = 0;

  return {
    applicable: true,
    discount,
    deliveryCharge,
  };
}

/**
 * Mark the loyalty reward as redeemed when order is finalized, starting next cycle.
 */
export async function redeemLoyaltyReward(
  email: string,
  orderId: string
): Promise<LoyaltyRecord> {
  const normEmail = normalizeEmail(email);
  const current = await getLoyaltyRecord(normEmail);

  const updated: LoyaltyRecord = {
    ...current,
    qualifyingMealCount: 0,
    rewardAvailable: false,
    rewardRedeemed: true,
    rewardCycle: (current.rewardCycle || 1) + 1,
    totalRewardsRedeemed: (current.totalRewardsRedeemed || 0) + 1,
    lastQualifiedOrder: orderId,
    updatedAt: new Date().toISOString(),
  };

  await redisSet(`${LOYALTY_PREFIX}${normEmail}`, updated);
  return updated;
}

/**
 * Stage information for UI display (Customer Dashboard, Cart, Checkout, Notifications)
 */
export function getLoyaltyStageInfo(record: LoyaltyRecord) {
  const count = Math.min(4, Math.max(0, record.qualifyingMealCount || 0));
  const isUnlocked = Boolean(record.rewardAvailable && !record.rewardRedeemed);

  let headline = "🎁 5th Meal Loyalty Reward";
  let subtext = "Complete 4 qualifying orders to unlock 15% OFF + FREE DELIVERY on your 5th meal.";
  let badgeText = `${count} / 4 Orders`;

  if (isUnlocked || count === 4) {
    headline = "🎉 REWARD UNLOCKED!";
    subtext = "Your NEXT qualifying order gets 15% OFF + FREE DELIVERY!";
    badgeText = "4 / 4 Complete";
  } else if (count === 1) {
    headline = "🎉 First order complete!";
    subtext = "Complete 3 more qualifying orders to unlock 15% OFF + FREE DELIVERY on your next order.";
    badgeText = "1 / 4 Orders";
  } else if (count === 2) {
    headline = "🔥 You're halfway there!";
    subtext = "Just 2 more qualifying orders to unlock your reward.";
    badgeText = "2 / 4 Orders";
  } else if (count === 3) {
    headline = "🔥 Almost there!";
    subtext = "Only 1 qualifying order left! Hurry up to unlock 15% OFF + FREE DELIVERY.";
    badgeText = "3 / 4 Orders";
  }

  const dots = [count >= 1, count >= 2, count >= 3, count >= 4];

  return {
    count,
    max: 4,
    dots,
    isUnlocked,
    headline,
    subtext,
    badgeText,
    rewardCycle: record.rewardCycle || 1,
    totalRewardsRedeemed: record.totalRewardsRedeemed || 0,
  };
}
