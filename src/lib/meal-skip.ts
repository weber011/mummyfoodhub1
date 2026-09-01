import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisSIsMember } from './redis';
import type { MealSchedule, MealSkip, UserSubscription } from './types';
import { isSkipAllowedForDate, getIstDateString } from './settings';
import { getMealById, updateMeal, addToSkippedSet } from './meals';

const SKIP_PREFIX = 'meal_skip:';

export type SkipEligibilityResult =
  | { eligible: true; minutesRemaining: number; cutoffTime: string }
  | { eligible: false; reason: string; cutoffTime: string };

/**
 * Validate whether a customer can skip a meal on a specific date.
 * ALWAYS uses server-side IST time — never trusts client.
 */
export async function validateSkipEligibility(
  sub: UserSubscription,
  mealType: 'lunch' | 'dinner',
  meal: MealSchedule | null,
  targetDate?: string
): Promise<SkipEligibilityResult> {
  // 1. Subscription must be active
  if (sub.status !== 'active') {
    return { eligible: false, reason: 'Your subscription is not active.', cutoffTime: '' };
  }

  // 2. Subscription must not be expired
  const istDateStr = getIstDateString();
  const mealDate = meal?.scheduledDate || targetDate || istDateStr;

  if (mealDate > sub.endDate || istDateStr > sub.endDate) {
    return { eligible: false, reason: 'This meal date is outside your subscription validity.', cutoffTime: '' };
  }

  if (mealDate < sub.startDate) {
    return { eligible: false, reason: 'This meal date is before your subscription start date.', cutoffTime: '' };
  }

  // 3. Check remaining meals
  const remaining = (sub.totalMeals ?? 0) - (sub.usedMeals ?? 0);
  if (remaining <= 0) {
    return { eligible: false, reason: 'No remaining meals in your subscription.', cutoffTime: '' };
  }

  // 4. Meal status check (if record exists)
  if (meal) {
    if (meal.status === 'skipped') {
      return { eligible: false, reason: "You've already skipped this meal.", cutoffTime: '' };
    }
    if (meal.status === 'delivered' || meal.status === 'consumed') {
      return { eligible: false, reason: "This meal has already been delivered / consumed.", cutoffTime: '' };
    }
    if (meal.status === 'transferred') {
      return { eligible: false, reason: "This meal has already been transferred.", cutoffTime: '' };
    }
    if (meal.status === 'missed' || meal.status === 'expired' || meal.status === 'cancelled') {
      return { eligible: false, reason: "This meal can no longer be skipped.", cutoffTime: '' };
    }
  }

  // 5. Server-side cutoff check for this exact mealDate (Asia/Kolkata IST)
  const { allowed, minutesRemaining, cutoffTime } = await isSkipAllowedForDate(mealType, mealDate);
  if (!allowed) {
    const isToday = mealDate === istDateStr;
    const cutoffMsg = isToday
      ? `Today's ${mealType} can no longer be skipped because the cutoff time has passed.`
      : `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} skip cutoff time has passed for this date (${mealDate}).`;
    return {
      eligible: false,
      reason: cutoffMsg,
      cutoffTime,
    };
  }

  return { eligible: true, minutesRemaining, cutoffTime };
}

// ── Idempotency ────────────────────────────────────────────────────

export async function isDuplicateSkip(mealId: string): Promise<boolean> {
  const existing = await redisGet<MealSkip>(`${SKIP_PREFIX}meal:${mealId}`);
  return existing !== null;
}

// ── Skip Recording ─────────────────────────────────────────────────

export type SkipResult =
  | { success: true; skip: MealSkip; meal: MealSchedule }
  | { success: false; reason: string };

/**
 * Atomically record a meal skip.
 * 
 * IMPORTANT LOGIC:
 * - Updates meal status to 'skipped'
 * - Increments sub.skippedMeals (NOT usedMeals)
 * - remainingMeals = totalMeals - usedMeals (skips don't reduce this)
 * - Creates MealSkip audit record
 * - Adds to date skipped set
 */
export async function recordMealSkip(
  meal: MealSchedule,
  sub: UserSubscription,
  cutoffTime: string,
  reason?: string
): Promise<SkipResult> {
  // Re-check idempotency
  if (await isDuplicateSkip(meal.id)) {
    return { success: false, reason: "You've already skipped this meal." };
  }

  const now = new Date().toISOString();
  const skipId = randomUUID();

  // 1. Update meal status to SKIPPED
  const updatedMeal = await updateMeal(meal.id, {
    status: 'skipped',
    skipRequestedAt: now,
    skipReason: reason,
  });

  if (!updatedMeal) {
    return { success: false, reason: 'Meal record not found.' };
  }

  // 2. Create MealSkip audit record
  const skip: MealSkip = {
    id: skipId,
    mealId: meal.id,
    subscriptionId: sub.id,
    userId: sub.userId,
    mealType: meal.mealType,
    date: meal.scheduledDate,
    skippedAt: now,
    reason,
    cutoffTime,
  };
  await redisSet(`${SKIP_PREFIX}${skipId}`, skip);
  // Index by meal for idempotency lookup
  await redisSet(`${SKIP_PREFIX}meal:${meal.id}`, skip);

  // 3. Increment skippedMeals on subscription (NOT usedMeals)
  const updatedSub: UserSubscription = {
    ...sub,
    skippedMeals: (sub.skippedMeals ?? 0) + 1,
    // usedMeals is NOT changed
  };
  await redisSet(`subscription:${sub.id}`, updatedSub);

  // 4. Add to date skipped set for food prep report
  await addToSkippedSet(meal.scheduledDate, meal.id);

  return { success: true, skip, meal: updatedMeal };
}

export async function getMealSkipByMealId(mealId: string): Promise<MealSkip | null> {
  return redisGet<MealSkip>(`${SKIP_PREFIX}meal:${mealId}`);
}
