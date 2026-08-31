import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisLPush, redisLRange } from './redis';
import type { UserSubscription, SubscriptionDelivery, SubscriptionBalance } from './types';

const SUB_PREFIX = 'subscription:';
const DELIVERY_PREFIX = 'sub_delivery:';

export async function getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
  const ids = await redisLRange<string>(`subscriptions:user:${userId}`, 0, 49);
  const subs = await Promise.all(ids.map((id) => redisGet<UserSubscription>(`${SUB_PREFIX}${id}`)));
  return subs.filter(Boolean) as UserSubscription[];
}

export async function getActiveSubscription(userId: string): Promise<UserSubscription | null> {
  const subs = await getUserSubscriptions(userId);
  const now = new Date().toISOString();
  return subs.find((s) => s.status === 'active' && s.endDate >= now) ?? null;
}

export async function createSubscription(data: Omit<UserSubscription, 'id' | 'createdAt'>): Promise<UserSubscription> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const sub: UserSubscription = { ...data, id, createdAt: now };
  await redisSet(`${SUB_PREFIX}${id}`, sub);
  await redisLPush(`subscriptions:user:${data.userId}`, id);
  await redisLPush('subscriptions:all', id);
  return sub;
}

export async function updateSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription | null> {
  const existing = await redisGet<UserSubscription>(`${SUB_PREFIX}${id}`);
  if (!existing) return null;
  const updated: UserSubscription = { ...existing, ...updates };
  await redisSet(`${SUB_PREFIX}${id}`, updated);
  return updated;
}

export async function getAllSubscriptions(): Promise<UserSubscription[]> {
  const ids = await redisLRange<string>('subscriptions:all', 0, 499);
  const subs = await Promise.all(ids.map((id) => redisGet<UserSubscription>(`${SUB_PREFIX}${id}`)));
  return subs.filter(Boolean) as UserSubscription[];
}

export function getRemainingDays(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getRemainingMeals(sub: UserSubscription): number | null {
  if (!sub.totalMeals) return null;
  // Key rule: remainingMeals = totalMeals - usedMeals (skips do NOT count as used)
  return Math.max(0, sub.totalMeals - (sub.usedMeals ?? 0));
}

/**
 * Full subscription balance for dashboard display.
 * remainingMeals = totalMeals - usedMeals (skipped meals are NOT deducted)
 */
export function getSubscriptionBalance(sub: UserSubscription): SubscriptionBalance {
  const totalMeals = sub.totalMeals ?? 0;
  const usedMeals = sub.usedMeals ?? 0;
  const skippedMeals = sub.skippedMeals ?? 0;
  const expiredMeals = sub.expiredMeals ?? 0;
  const remainingMeals = Math.max(0, totalMeals - usedMeals);

  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const ist = new Date(istString);
  const endDate = new Date(sub.endDate);
  const diffMs = endDate.getTime() - ist.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const istDateStr = ist.toLocaleDateString('en-CA');
  const isValid = sub.status === 'active' && istDateStr <= sub.endDate;

  return {
    totalMeals, usedMeals, skippedMeals, remainingMeals, expiredMeals,
    daysRemaining, isValid,
    validityStartDate: sub.startDate,
    validityEndDate: sub.endDate,
  };
}

// ── Admin Subscription Management ─────────────────────────────────

export async function pauseSubscription(id: string): Promise<UserSubscription | null> {
  return updateSubscription(id, { status: 'paused' });
}

export async function cancelSubscription(id: string): Promise<UserSubscription | null> {
  return updateSubscription(id, { status: 'cancelled' });
}

export async function extendSubscription(id: string, days: number): Promise<UserSubscription | null> {
  const sub = await redisGet<UserSubscription>(`subscription:${id}`);
  if (!sub) return null;
  const currentEnd = new Date(sub.endDate);
  currentEnd.setDate(currentEnd.getDate() + days);
  const newEndDate = currentEnd.toISOString().split('T')[0];
  return updateSubscription(id, { endDate: newEndDate, status: 'active' });
}

export async function reactivateSubscription(id: string): Promise<UserSubscription | null> {
  return updateSubscription(id, { status: 'active' });
}

export async function addMealsToSubscription(id: string, meals: number): Promise<UserSubscription | null> {
  const sub = await redisGet<UserSubscription>(`subscription:${id}`);
  if (!sub) return null;
  return updateSubscription(id, { totalMeals: (sub.totalMeals ?? 0) + meals });
}

// ── Delivery Log ──────────────────────────────────────────────────

export async function logDelivery(entry: Omit<SubscriptionDelivery, 'id' | 'loggedAt'>): Promise<SubscriptionDelivery> {
  const id = randomUUID();
  const delivery: SubscriptionDelivery = { ...entry, id, loggedAt: new Date().toISOString() };
  await redisSet(`${DELIVERY_PREFIX}${id}`, delivery);
  await redisLPush(`sub_deliveries:sub:${entry.subscriptionId}`, id);
  await redisLPush(`sub_deliveries:user:${entry.userId}`, id);
  // Increment usedMeals on the subscription when status is 'delivered'
  if (entry.status === 'delivered') {
    const sub = await redisGet<UserSubscription>(`${SUB_PREFIX}${entry.subscriptionId}`);
    if (sub) {
      await redisSet(`${SUB_PREFIX}${entry.subscriptionId}`, { ...sub, usedMeals: (sub.usedMeals ?? 0) + 1 });
    }
  }
  return delivery;
}

export async function getDeliveryLog(subscriptionId: string): Promise<SubscriptionDelivery[]> {
  const ids = await redisLRange<string>(`sub_deliveries:sub:${subscriptionId}`, 0, 999);
  const entries = await Promise.all(ids.map(id => redisGet<SubscriptionDelivery>(`${DELIVERY_PREFIX}${id}`)));
  return (entries.filter(Boolean) as SubscriptionDelivery[]).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getUserDeliveryLog(userId: string): Promise<SubscriptionDelivery[]> {
  const ids = await redisLRange<string>(`sub_deliveries:user:${userId}`, 0, 999);
  const entries = await Promise.all(ids.map(id => redisGet<SubscriptionDelivery>(`${DELIVERY_PREFIX}${id}`)));
  return (entries.filter(Boolean) as SubscriptionDelivery[]).sort((a, b) => b.date.localeCompare(a.date));
}
