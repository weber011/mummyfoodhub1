import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserById } from '@/lib/auth';
import { redisGet } from '@/lib/redis';
import type { UserSubscription, MealSchedule } from '@/lib/types';
import { getMealById, getMealForToday } from '@/lib/meals';
import { validateSkipEligibility, recordMealSkip } from '@/lib/meal-skip';
import { sendSkipConfirmationEmail, sendAdminSkipNotificationEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { getSubscriptionBalance } from '@/lib/subscriptions';
import { formatCutoffTime } from '@/lib/settings';

/**
 * POST /api/meals/skip
 * Body: { mealId?: string, subscriptionId?: string, mealType?: 'lunch' | 'dinner', reason?: string }
 *
 * Validates cutoff independently server-side against Asia/Kolkata timezone.
 * Atomically records the skip and marks the meal as SKIPPED.
 * Does NOT decrement remaining meals.
 * Dispatches confirmation emails & notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to skip a meal.' }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { mealId, subscriptionId, mealType, reason } = body;

    let targetMeal: MealSchedule | null = null;
    let targetSub: UserSubscription | null = null;

    if (mealId) {
      targetMeal = await getMealById(mealId);
      if (!targetMeal) {
        return NextResponse.json({ error: 'Meal record not found.' }, { status: 404 });
      }
      if (targetMeal.userId !== session.userId && session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized to modify this meal.' }, { status: 403 });
      }
      targetSub = await redisGet<UserSubscription>(`subscription:${targetMeal.subscriptionId}`);
    } else if (subscriptionId && mealType) {
      targetSub = await redisGet<UserSubscription>(`subscription:${subscriptionId}`);
      if (!targetSub) {
        return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
      }
      if (targetSub.userId !== session.userId && session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized access to subscription.' }, { status: 403 });
      }
      targetMeal = await getMealForToday(subscriptionId, mealType);
    } else {
      return NextResponse.json(
        { error: 'Provide mealId or (subscriptionId and mealType).' },
        { status: 400 }
      );
    }

    if (!targetSub) {
      return NextResponse.json({ error: 'Active subscription not found for this meal.' }, { status: 404 });
    }

    const mType = (targetMeal?.mealType || mealType || 'lunch') as 'lunch' | 'dinner';

    // Strict Server-Side Validation: Never trust client clocks
    const eligibility = await validateSkipEligibility(targetSub, mType, targetMeal);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.reason,
          cutoffTime: eligibility.cutoffTime,
          cutoffDisplay: eligibility.cutoffTime ? formatCutoffTime(eligibility.cutoffTime) : undefined,
        },
        { status: 403 }
      );
    }

    // Record skip atomically
    const skipResult = await recordMealSkip(
      targetMeal!,
      targetSub,
      eligibility.cutoffTime,
      reason
    );

    if (!skipResult.success) {
      return NextResponse.json({ error: skipResult.reason }, { status: 400 });
    }

    // Fresh balance calculation
    const updatedSub = await redisGet<UserSubscription>(`subscription:${targetSub.id}`) || targetSub;
    const balance = getSubscriptionBalance(updatedSub);

    // Send notifications & emails asynchronously without blocking response
    Promise.allSettled([
      sendSkipConfirmationEmail(user.email, user.name, {
        mealType: mType,
        date: targetMeal!.scheduledDate,
        menu: targetMeal!.menu,
        totalMeals: balance.totalMeals,
        usedMeals: balance.usedMeals,
        skippedMeals: balance.skippedMeals,
        remainingMeals: balance.remainingMeals,
      }),
      sendAdminSkipNotificationEmail({
        customerName: user.name,
        customerPhone: user.phone || updatedSub.customerPhone,
        mealType: mType,
        date: targetMeal!.scheduledDate,
        subscriptionId: updatedSub.id,
        planName: updatedSub.planName,
        remainingMeals: balance.remainingMeals,
        deliveryPreference: updatedSub.deliveryPreference,
      }),
      createNotification(
        session.userId,
        'meal_skip_confirmed',
        'Meal Skipped Successfully ❤️',
        `Your ${mType === 'dinner' ? 'Dinner' : 'Lunch'} for ${targetMeal!.scheduledDate} was skipped. Your remaining balance remains ${balance.remainingMeals} meals.`,
        undefined
      ),
      createNotification(
        'admin',
        'admin_skip_alert',
        'Customer Skipped Meal',
        `${user.name} skipped ${mType} for ${targetMeal!.scheduledDate}. Plan: ${updatedSub.planName}.`,
        undefined
      ),
    ]).catch((err) => console.error('[skip meal notifications error]', err));

    return NextResponse.json({
      success: true,
      message: `Today's ${mType} has been successfully skipped. Your meal has NOT been deducted from your subscription balance.`,
      meal: skipResult.meal,
      skip: skipResult.skip,
      balance,
    });
  } catch (error: any) {
    console.error('[meals/skip POST]', error);
    return NextResponse.json({ error: 'Failed to process meal skip request.' }, { status: 500 });
  }
}
