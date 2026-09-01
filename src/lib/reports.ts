import type { UserSubscription, SubscriptionBalance, MonthlyMealReport, MealDayReport, MealSchedule } from './types';
import { getMealsBySubscription, getMealsByDate, getMealsByDateAndType, getSkippedCountForDate } from './meals';
import { getAllSubscriptions, getSubscriptionBalance } from './subscriptions';

export { getSubscriptionBalance };

// ── Monthly Report ─────────────────────────────────────────────────

/**
 * Generate a monthly meal report for a subscription.
 * year: full year (e.g. 2026), month: 1-12
 * Rule: Subscriptions DO NOT reset on the 1st of every month.
 * Only display dates that fall within the subscription validity (>= sub.startDate && <= sub.endDate).
 */
export async function getMonthlyReport(
  sub: UserSubscription,
  year: number,
  month: number
): Promise<MonthlyMealReport> {
  const allMeals = await getMealsBySubscription(sub.id, 500);

  // Month prefix YYYY-MM
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
  
  // Filter meals strictly within the requested month AND within subscription validity
  const monthMeals = allMeals.filter(
    m => m.scheduledDate.startsWith(monthStr) &&
         m.scheduledDate >= sub.startDate &&
         m.scheduledDate <= sub.endDate
  );

  const days: MealDayReport[] = monthMeals.map(m => ({
    date: m.scheduledDate,
    mealType: m.mealType,
    status: m.status,
    menu: m.menu,
    note: m.transferredTo ? `Transferred to ${m.transferredTo}` : m.transferredFrom ? `Transferred from ${m.transferredFrom}` : undefined,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const balance = getSubscriptionBalance(sub);

  const isDinner = sub.mealType === 'dinner' || sub.basePlan === 'dinner';
  const isLunch = sub.mealType === 'lunch' || sub.basePlan === 'lunch';
  const isComplete = sub.mealType === 'both' || sub.basePlan === 'complete' || (!isDinner && !isLunch);
  const hasBreakfast = sub.hasBreakfastAddon || sub.planName?.toLowerCase().includes('breakfast') || false;

  const bMeals = monthMeals.filter(m => m.mealType === 'breakfast');
  const lMeals = monthMeals.filter(m => m.mealType === 'lunch');
  const dMeals = monthMeals.filter(m => m.mealType === 'dinner');

  const report: MonthlyMealReport = {
    year,
    month,
    subscriptionId: sub.id,
    planName: sub.planName,
    subscriptionPeriod: {
      startDate: sub.startDate,
      endDate: sub.endDate,
    },
    totalEligibleMeals: sub.totalMeals ?? balance.totalMeals,
    utilizationPercentage: balance.totalMeals > 0 ? Math.round((balance.usedMeals / balance.totalMeals) * 100) : 0,
    days,
  };

  if (hasBreakfast) {
    report.breakfast = {
      scheduled: bMeals.length,
      total: sub.breakfastTotalMeals ?? 26,
      consumed: bMeals.filter(m => m.status === 'delivered' || m.status === 'consumed').length,
      skipped: bMeals.filter(m => m.status === 'skipped').length,
      transferred: bMeals.filter(m => m.status === 'transferred').length,
      remaining: balance.breakfast?.remaining ?? 26,
    };
  }

  if (isLunch || isComplete) {
    report.lunch = {
      scheduled: lMeals.length,
      total: sub.lunchTotalMeals ?? 26,
      consumed: lMeals.filter(m => m.status === 'delivered' || m.status === 'consumed').length,
      skipped: lMeals.filter(m => m.status === 'skipped').length,
      transferred: lMeals.filter(m => m.status === 'transferred').length,
      remaining: balance.lunch?.remaining ?? 26,
    };
  }

  if (isDinner || isComplete) {
    report.dinner = {
      scheduled: dMeals.length,
      total: sub.dinnerTotalMeals ?? 30,
      consumed: dMeals.filter(m => m.status === 'delivered' || m.status === 'consumed').length,
      skipped: dMeals.filter(m => m.status === 'skipped').length,
      transferred: dMeals.filter(m => m.status === 'transferred').length,
      remaining: balance.dinner?.remaining ?? 30,
    };
  }

  return report;
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
