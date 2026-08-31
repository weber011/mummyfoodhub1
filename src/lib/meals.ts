import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisLPush, redisLRange, redisSAdd, redisSMembers } from './redis';
import type { MealSchedule, MealStatus, UserSubscription } from './types';
import { getIstDateString } from './settings';

const MEAL_PREFIX = 'meal:';

// ── CRUD ───────────────────────────────────────────────────────────

export async function createMealSchedule(
  data: Omit<MealSchedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MealSchedule> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const meal: MealSchedule = { ...data, id, createdAt: now, updatedAt: now };
  await redisSet(`${MEAL_PREFIX}${id}`, meal);
  await redisLPush(`meals:sub:${data.subscriptionId}`, id);
  await redisLPush(`meals:user:${data.userId}`, id);
  await redisLPush(`meals:date:${data.scheduledDate}`, id);
  if (data.mealType === 'lunch') {
    await redisLPush(`meals:date:${data.scheduledDate}:lunch`, id);
  } else {
    await redisLPush(`meals:date:${data.scheduledDate}:dinner`, id);
  }
  return meal;
}

export async function getMealById(id: string): Promise<MealSchedule | null> {
  return redisGet<MealSchedule>(`${MEAL_PREFIX}${id}`);
}

export async function updateMeal(id: string, updates: Partial<MealSchedule>): Promise<MealSchedule | null> {
  const existing = await getMealById(id);
  if (!existing) return null;
  const updated: MealSchedule = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await redisSet(`${MEAL_PREFIX}${id}`, updated);
  return updated;
}

export async function getMealsBySubscription(subscriptionId: string, limit = 200): Promise<MealSchedule[]> {
  const ids = await redisLRange<string>(`meals:sub:${subscriptionId}`, 0, limit - 1);
  const meals = await Promise.all(ids.map(id => getMealById(id)));
  return (meals.filter(Boolean) as MealSchedule[]).sort((a, b) =>
    b.scheduledDate.localeCompare(a.scheduledDate)
  );
}

export async function getMealsByUser(userId: string, limit = 200): Promise<MealSchedule[]> {
  const ids = await redisLRange<string>(`meals:user:${userId}`, 0, limit - 1);
  const meals = await Promise.all(ids.map(id => getMealById(id)));
  // Deduplicate by id (may appear in multiple lists)
  const seen = new Set<string>();
  return (meals.filter(Boolean) as MealSchedule[])
    .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
}

export async function getMealsByDate(date: string): Promise<MealSchedule[]> {
  const ids = await redisLRange<string>(`meals:date:${date}`, 0, 499);
  const meals = await Promise.all(ids.map(id => getMealById(id)));
  return meals.filter(Boolean) as MealSchedule[];
}

export async function getMealsByDateAndType(date: string, mealType: 'lunch' | 'dinner'): Promise<MealSchedule[]> {
  const ids = await redisLRange<string>(`meals:date:${date}:${mealType}`, 0, 499);
  const meals = await Promise.all(ids.map(id => getMealById(id)));
  return meals.filter(Boolean) as MealSchedule[];
}

/**
 * Get today's meal for a specific subscription and meal type.
 * Returns null if no meal record exists yet for today.
 */
export async function getMealForToday(
  subscriptionId: string,
  mealType: 'lunch' | 'dinner'
): Promise<MealSchedule | null> {
  const today = getIstDateString();
  const meals = await getMealsBySubscription(subscriptionId, 50);
  return meals.find(m => m.scheduledDate === today && m.mealType === mealType) ?? null;
}

/**
 * Find today's meal for a user across all their subscriptions.
 */
export async function getTodaysMealsForUser(userId: string): Promise<MealSchedule[]> {
  const today = getIstDateString();
  const meals = await getMealsByUser(userId, 60);
  return meals.filter(m => m.scheduledDate === today);
}

// ── Daily Meal Generation ──────────────────────────────────────────

/**
 * Generate meal records for all active subscriptions for a given date.
 * Called by cron job. Idempotent — won't create duplicates.
 * Returns count of meals created.
 */
export async function generateDailyMeals(
  date: string,
  activeSubs: UserSubscription[],
  dailyMenu?: string
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const sub of activeSubs) {
    if (sub.status !== 'active') { skipped++; continue; }

    // Check sub is valid for this date
    if (date < sub.startDate || date > sub.endDate) { skipped++; continue; }

    // Check remaining meals
    const remaining = (sub.totalMeals ?? 0) - (sub.usedMeals ?? 0);
    if (remaining <= 0) { skipped++; continue; }

    const mealTypes: Array<'lunch' | 'dinner'> =
      sub.mealType === 'both' ? ['lunch', 'dinner'] :
      sub.mealType === 'dinner' ? ['dinner'] : ['lunch'];

    for (const mealType of mealTypes) {
      // Idempotency: check if meal already exists for this date+sub+type
      const existingMeals = await getMealsBySubscription(sub.id, 10);
      const alreadyExists = existingMeals.some(
        m => m.scheduledDate === date && m.mealType === mealType
      );
      if (alreadyExists) { skipped++; continue; }

      const isToday = date === getIstDateString();
      const status: MealStatus = isToday ? 'scheduled' : date > getIstDateString() ? 'upcoming' : 'scheduled';

      await createMealSchedule({
        subscriptionId: sub.id,
        userId: sub.userId,
        mealType,
        scheduledDate: date,
        menu: dailyMenu ?? '',
        status,
        deliveryPreference: sub.deliveryPreference ?? 'gate',
        deliveryAddress: sub.address,
        deliveryInstructions: sub.deliveryInstructions,
      });
      created++;
    }
  }

  return { created, skipped };
}

/**
 * Mark all 'scheduled' meals from a past date as 'missed' (for yesterday's cleanup).
 */
export async function markPastMealsAsMissed(date: string): Promise<number> {
  const meals = await getMealsByDate(date);
  let count = 0;
  for (const meal of meals) {
    if (meal.status === 'scheduled' || meal.status === 'upcoming') {
      await updateMeal(meal.id, { status: 'missed' });
      count++;
    }
  }
  return count;
}

/**
 * Mark a meal as skipped in the skipped set for the date.
 */
export async function addToSkippedSet(date: string, mealId: string): Promise<void> {
  await redisSAdd(`meals:date:${date}:skipped`, mealId);
}

/**
 * Get count of skipped meals for a date and meal type.
 */
export async function getSkippedCountForDate(date: string, mealType: 'lunch' | 'dinner'): Promise<number> {
  const allMeals = await getMealsByDateAndType(date, mealType);
  return allMeals.filter(m => m.status === 'skipped').length;
}
