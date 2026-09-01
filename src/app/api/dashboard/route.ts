import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserById } from '@/lib/auth';
import { getUserSubscriptions, getSubscriptionBalance } from '@/lib/subscriptions';
import { getTodaysMealsForUser, getMealsForUserByDate } from '@/lib/meals';
import { getAdminSettings, isSkipAllowedForDate, getIstDateString, formatCutoffTime } from '@/lib/settings';
import { getUserNotifications } from '@/lib/notifications';
import { getLoyaltyRecord, getLoyaltyStageInfo } from '@/lib/loyalty';

/**
 * GET /api/dashboard
 * Returns all customer dashboard data in a single call.
 * - Active subscriptions with balance
 * - Today's and Tomorrow's meals with status
 * - Skip eligibility + cutoff countdown (server-side IST time)
 * - Loyalty status with 4-stage progression
 * - Recent notifications
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to view your dashboard.' }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // Get admin settings for cutoff times
    const settings = await getAdminSettings();

    // Get all user subscriptions and filter to active
    const allSubs = await getUserSubscriptions(session.userId);
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const ist = new Date(istString);
    const todayStr = getIstDateString();

    const tomorrow = new Date(ist.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const activeSubs = allSubs.filter(s => s.status === 'active' && s.endDate >= todayStr);

    // Build subscription summaries with balance
    const subscriptionSummaries = activeSubs.map(sub => ({
      ...sub,
      balance: getSubscriptionBalance(sub),
    }));

    // Get today's and tomorrow's meals for this user
    const todaysMeals = await getTodaysMealsForUser(session.userId);
    const tomorrowsMeals = await getMealsForUserByDate(session.userId, tomorrowStr);

    // Build skip eligibility for today and tomorrow separately
    const todayLunchSkip = await isSkipAllowedForDate('lunch', todayStr);
    const todayDinnerSkip = await isSkipAllowedForDate('dinner', todayStr);
    const tomorrowLunchSkip = await isSkipAllowedForDate('lunch', tomorrowStr);
    const tomorrowDinnerSkip = await isSkipAllowedForDate('dinner', tomorrowStr);

    // IST time info for frontend countdown
    const istHours = ist.getHours();
    const istMinutes = ist.getMinutes();
    const currentIstTime = `${istHours.toString().padStart(2, '0')}:${istMinutes.toString().padStart(2, '0')}`;

    // Recent notifications (5)
    const notifications = await getUserNotifications(session.userId, 5);

    // Greeting based on IST hour
    let greetingPart = 'Good Morning';
    if (istHours >= 12 && istHours < 17) greetingPart = 'Good Afternoon';
    else if (istHours >= 17) greetingPart = 'Good Evening';

    // Loyalty Record with Stage Progression
    const loyalty = await getLoyaltyRecord(user.email, user.id);
    const stageInfo = getLoyaltyStageInfo(loyalty);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        deliveryPreference: user.deliveryPreference,
      },
      greeting: `${greetingPart}, ${user.name} ❤️`,
      todayDate: todayStr,
      tomorrowDate: tomorrowStr,
      currentIstTime,
      subscriptions: subscriptionSummaries,
      todaysMeals,
      tomorrowsMeals,
      skipEligibility: {
        today: {
          lunch: {
            ...todayLunchSkip,
            cutoffDisplay: formatCutoffTime(settings.lunchSkipCutoff),
            mealTimeDisplay: formatCutoffTime(settings.lunchTime),
          },
          dinner: {
            ...todayDinnerSkip,
            cutoffDisplay: formatCutoffTime(settings.dinnerSkipCutoff),
            mealTimeDisplay: formatCutoffTime(settings.dinnerTime),
          },
        },
        tomorrow: {
          lunch: {
            ...tomorrowLunchSkip,
            cutoffDisplay: formatCutoffTime(settings.lunchSkipCutoff),
            mealTimeDisplay: formatCutoffTime(settings.lunchTime),
          },
          dinner: {
            ...tomorrowDinnerSkip,
            cutoffDisplay: formatCutoffTime(settings.dinnerSkipCutoff),
            mealTimeDisplay: formatCutoffTime(settings.dinnerTime),
          },
        },
        // Top-level for backward compatibility
        lunch: {
          ...todayLunchSkip,
          cutoffDisplay: formatCutoffTime(settings.lunchSkipCutoff),
          mealTimeDisplay: formatCutoffTime(settings.lunchTime),
        },
        dinner: {
          ...todayDinnerSkip,
          cutoffDisplay: formatCutoffTime(settings.dinnerSkipCutoff),
          mealTimeDisplay: formatCutoffTime(settings.dinnerTime),
        },
      },
      settings: {
        lunchTime: settings.lunchTime,
        lunchSkipCutoff: settings.lunchSkipCutoff,
        dinnerTime: settings.dinnerTime,
        dinnerSkipCutoff: settings.dinnerSkipCutoff,
      },
      loyalty: {
        qualifyingMealCount: loyalty.qualifyingMealCount || 0,
        rewardAvailable: loyalty.rewardAvailable || false,
        rewardRedeemed: loyalty.rewardRedeemed || false,
        rewardCycle: loyalty.rewardCycle || 1,
        totalRewardsRedeemed: loyalty.totalRewardsRedeemed || 0,
        stageInfo,
      },
      notifications,
    });
  } catch (e: any) {
    console.error('[dashboard GET]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
