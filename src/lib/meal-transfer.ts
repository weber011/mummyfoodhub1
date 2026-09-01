import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisLPush, redisLRange } from './redis';
import type { MealSchedule, MealTransfer, UserSubscription } from './types';
import { getMealById, updateMeal, createMealSchedule, getMealsBySubscription } from './meals';
import { getIstDateString } from './settings';

const TRANSFER_PREFIX = 'meal_transfer:';

export type TransferResult =
  | { success: true; transfer: MealTransfer; targetMeal: MealSchedule }
  | { success: false; reason: string };

/**
 * Validate and execute shifting a skipped meal to the opposite service:
 * - Skipped Lunch -> Dinner
 * - Skipped Dinner -> Lunch
 */
export async function executeMealTransfer(params: {
  userId: string;
  subscriptionId: string;
  sourceMealId: string;
  targetMealType: 'lunch' | 'dinner';
  targetDate?: string;
}): Promise<TransferResult> {
  const { userId, subscriptionId, sourceMealId, targetMealType } = params;
  const targetDate = params.targetDate || getIstDateString();

  // 1. Fetch and validate source meal
  const sourceMeal = await getMealById(sourceMealId);
  if (!sourceMeal) {
    return { success: false, reason: 'Source meal record not found.' };
  }

  if (sourceMeal.userId !== userId) {
    return { success: false, reason: 'Unauthorized: meal does not belong to user.' };
  }

  if (sourceMeal.status !== 'skipped') {
    if (sourceMeal.status === 'transferred') {
      return { success: false, reason: 'This meal has already been transferred.' };
    }
    return { success: false, reason: 'Only skipped meals can be transferred.' };
  }

  // Ensure source and target are opposite types
  if (sourceMeal.mealType === targetMealType) {
    return { success: false, reason: `Cannot transfer ${sourceMeal.mealType} to ${targetMealType}.` };
  }

  // 2. Fetch subscription
  const sub = await redisGet<UserSubscription>(`subscription:${subscriptionId}`);
  if (!sub) {
    return { success: false, reason: 'Subscription not found.' };
  }
  if (sub.status !== 'active') {
    return { success: false, reason: 'Subscription is not active.' };
  }

  // 3. Idempotency & duplicate check
  const existingTransfer = await redisGet<MealTransfer>(`${TRANSFER_PREFIX}source:${sourceMeal.id}`);
  if (existingTransfer) {
    return { success: false, reason: 'This meal has already been transferred.' };
  }

  const now = new Date().toISOString();
  const transferId = randomUUID();

  // 4. Update source meal to TRANSFERRED
  const updatedSourceMeal = await updateMeal(sourceMeal.id, {
    status: 'transferred',
    transferredTo: targetMealType,
    transferredAt: now,
  });

  if (!updatedSourceMeal) {
    return { success: false, reason: 'Failed to update source meal.' };
  }

  // 5. Create / Update target meal schedule
  const existingTargetMeals = await getMealsBySubscription(subscriptionId, 20);
  const existingTargetMeal = existingTargetMeals.find(
    m => m.scheduledDate === targetDate && m.mealType === targetMealType
  );

  let targetMeal: MealSchedule;
  if (existingTargetMeal) {
    const updated = await updateMeal(existingTargetMeal.id, {
      status: 'scheduled',
      transferredFrom: sourceMeal.mealType,
      transferredAt: now,
      sourceMealId: sourceMeal.id,
      menu: existingTargetMeal.menu || (targetMealType === 'dinner' ? 'Standard Dinner Thali' : 'Standard Lunch Thali'),
    });
    targetMeal = updated || existingTargetMeal;
  } else {
    targetMeal = await createMealSchedule({
      subscriptionId,
      userId,
      mealType: targetMealType,
      scheduledDate: targetDate,
      menu: targetMealType === 'dinner' ? 'Dinner Thali (Transferred from Lunch)' : 'Lunch Thali (Transferred from Dinner)',
      status: 'scheduled',
      transferredFrom: sourceMeal.mealType,
      transferredAt: now,
      sourceMealId: sourceMeal.id,
      deliveryPreference: sub.deliveryPreference || 'gate',
      deliveryAddress: sub.address,
      deliveryInstructions: sub.deliveryInstructions,
    });
  }

  // 6. Record MealTransfer audit entity
  const transfer: MealTransfer = {
    id: transferId,
    customerId: userId,
    subscriptionId,
    sourceMealType: sourceMeal.mealType as 'lunch' | 'dinner',
    sourceDate: sourceMeal.scheduledDate,
    targetMealType,
    targetDate,
    createdAt: now,
    status: 'completed',
    sourceMealId: sourceMeal.id,
    targetMealId: targetMeal.id,
  };

  await redisSet(`${TRANSFER_PREFIX}${transferId}`, transfer);
  await redisSet(`${TRANSFER_PREFIX}source:${sourceMeal.id}`, transfer);
  await redisLPush(`transfers:sub:${subscriptionId}`, transferId);
  await redisLPush(`transfers:user:${userId}`, transferId);
  await redisLPush('transfers:all', transferId);

  // 7. Update subscription transfer metrics
  const updatedSub: UserSubscription = {
    ...sub,
    transferredMeals: (sub.transferredMeals ?? 0) + 1,
    ...(sourceMeal.mealType === 'lunch'
      ? { lunchTransferredMeals: (sub.lunchTransferredMeals ?? 0) + 1 }
      : { dinnerTransferredMeals: (sub.dinnerTransferredMeals ?? 0) + 1 }),
  };
  await redisSet(`subscription:${sub.id}`, updatedSub);

  return {
    success: true,
    transfer,
    targetMeal,
  };
}

export async function getTransfersBySubscription(subscriptionId: string): Promise<MealTransfer[]> {
  const ids = await redisLRange<string>(`transfers:sub:${subscriptionId}`, 0, 99);
  const transfers = await Promise.all(ids.map(id => redisGet<MealTransfer>(`${TRANSFER_PREFIX}${id}`)));
  return (transfers.filter(Boolean) as MealTransfer[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTransfersByUser(userId: string): Promise<MealTransfer[]> {
  const ids = await redisLRange<string>(`transfers:user:${userId}`, 0, 99);
  const transfers = await Promise.all(ids.map(id => redisGet<MealTransfer>(`${TRANSFER_PREFIX}${id}`)));
  return (transfers.filter(Boolean) as MealTransfer[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllTransfers(): Promise<MealTransfer[]> {
  const ids = await redisLRange<string>('transfers:all', 0, 499);
  const transfers = await Promise.all(ids.map(id => redisGet<MealTransfer>(`${TRANSFER_PREFIX}${id}`)));
  return (transfers.filter(Boolean) as MealTransfer[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
