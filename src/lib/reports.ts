import type { UserSubscription, SubscriptionBalance, MonthlyMealReport, MealDayReport, MealSchedule } from './types';
import { getMealsBySubscription, getMealsByDate, getMealsByDateAndType, getSkippedCountForDate } from './meals';
import { getAllSubscriptions } from './subscriptions';

// ── Subscription Balance ────────────────────────────────────────────

/**
 * Compute the subscription balance.
 * Key rule: remainingMeals = totalMeals - usedMeals (skipped meals do NOT reduce remaining)
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
    totalMeals,
    usedMeals,
    skippedMeals,
    remainingMeals,
    expiredMeals,
    daysRemaining,
    isValid,
    validityStartDate: sub.startDate,
    validityEndDate: sub.endDate,
  };
}

// ── Monthly Report ─────────────────────────────────────────────────

/**
 * Generate a monthly meal report for a subscription.
 * year: full year (e.g. 2026), month: 1-12
 */
export async function getMonthlyReport(
  sub: UserSubscription,
  year: number,
  month: number
): Promise<MonthlyMealReport> {
  // Get all meals for this subscription
  const allMeals = await getMealsBySubscription(sub.id, 500);

  // Filter to the requested month
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
  const monthMeals = allMeals.filter(m => m.scheduledDate.startsWith(monthStr));

  // Build day-by-day report
  const days: MealDayReport[] = monthMeals.map(m => ({
    date: m.scheduledDate,
    mealType: m.mealType,
    status: m.status,
    menu: m.menu,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const balance = getSubscriptionBalance(sub);

  return {
    year,
    month,
    subscriptionId: sub.id,
    planName: sub.planName,
    mealType: sub.mealType ?? 'lunch',
    totalScheduled: monthMeals.length,
    delivered: monthMeals.filter(m => m.status === 'delivered' || m.status === 'consumed').length,
    consumed: monthMeals.filter(m => m.status === 'consumed').length,
    skipped: monthMeals.filter(m => m.status === 'skipped').length,
    missed: monthMeals.filter(m => m.status === 'missed').length,
    upcoming: monthMeals.filter(m => m.status === 'upcoming' || m.status === 'scheduled').length,
    remainingBalance: balance.remainingMeals,
    days,
  };
}

// ── Food Preparation Report ────────────────────────────────────────

export type FoodPrepReport = {
  date: string;
  lunch: {
    totalActive: number;
    skipped: number;
    mealsToPrep: number;
    meals: MealSchedule[];
  };
  dinner: {
    totalActive: number;
    skipped: number;
    mealsToPrep: number;
    meals: MealSchedule[];
  };
  generatedAt: string;
};

/**
 * Generate the daily food preparation report.
 * Shows how many meals need to be prepared after accounting for skips.
 */
export async function getFoodPrepReport(date: string): Promise<FoodPrepReport> {
  const lunchMeals = await getMealsByDateAndType(date, 'lunch');
  const dinnerMeals = await getMealsByDateAndType(date, 'dinner');

  const lunchSkipped = lunchMeals.filter(m => m.status === 'skipped').length;
  const dinnerSkipped = dinnerMeals.filter(m => m.status === 'skipped').length;

  const lunchActive = lunchMeals.filter(m => m.status !== 'expired' && m.status !== 'missed').length;
  const dinnerActive = dinnerMeals.filter(m => m.status !== 'expired' && m.status !== 'missed').length;

  return {
    date,
    lunch: {
      totalActive: lunchActive,
      skipped: lunchSkipped,
      mealsToPrep: Math.max(0, lunchActive - lunchSkipped),
      meals: lunchMeals,
    },
    dinner: {
      totalActive: dinnerActive,
      skipped: dinnerSkipped,
      mealsToPrep: Math.max(0, dinnerActive - dinnerSkipped),
      meals: dinnerMeals,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ── Subscription Analytics ─────────────────────────────────────────

export type AdminAnalytics = {
  totalCustomers: number;
  activeSubscriptions: number;
  todayLunches: number;
  todayDinners: number;
  todaySkipped: number;
  expiringIn7d: number;
  expired: number;
};

export async function getAdminAnalytics(date: string): Promise<AdminAnalytics> {
  const allSubs = await getAllSubscriptions();

  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const ist = new Date(istString);
  const istDate = ist.toLocaleDateString('en-CA');

  const active = allSubs.filter(s => s.status === 'active' && s.endDate >= istDate);
  const expired = allSubs.filter(s => s.status === 'expired' || (s.status === 'active' && s.endDate < istDate));

  const expiringIn7d = active.filter(s => {
    const daysLeft = Math.ceil((new Date(s.endDate).getTime() - ist.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  }).length;

  const lunchMeals = await getMealsByDateAndType(date, 'lunch');
  const dinnerMeals = await getMealsByDateAndType(date, 'dinner');
  const todaySkipped = [...lunchMeals, ...dinnerMeals].filter(m => m.status === 'skipped').length;

  // Unique customers from all subs
  const uniqueCustomers = new Set(allSubs.map(s => s.userId)).size;

  return {
    totalCustomers: uniqueCustomers,
    activeSubscriptions: active.length,
    todayLunches: lunchMeals.filter(m => m.status !== 'expired').length,
    todayDinners: dinnerMeals.filter(m => m.status !== 'expired').length,
    todaySkipped,
    expiringIn7d,
    expired: expired.length,
  };
}
