import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisLPush, redisLRange } from './redis';
import type { UserSubscription } from './types';

const SUB_PREFIX = 'subscription:';

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
  return Math.max(0, sub.totalMeals - (sub.usedMeals ?? 0));
}
