import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserById } from '@/lib/auth';
import { getUserSubscriptions, getSubscriptionBalance } from '@/lib/subscriptions';
import { getTodaysMealsForUser } from '@/lib/meals';
import { getAdminSettings, isSkipAllowed, getIstDateString, formatCutoffTime } from '@/lib/settings';
import { getUserNotifications } from '@/lib/notifications';

/**
 * GET /api/dashboard
 * Returns all customer dashboard data in a single call.
 * - Active subscriptions with balance
 * - Today's meals with status
 * - Skip eligibility + cutoff countdown (server-side IST time)
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

    const activeSubs = allSubs.filter(s => s.status === 'active' && s.endDate >= todayStr);

    // Build subscription summaries with balance
    const subscriptionSummaries = activeSubs.map(sub => ({
      ...sub,
      balance: getSubscriptionBalance(sub),
    }));

    // Get today's meals for this user
    const todaysMeals = await getTodaysMealsForUser(session.userId);

    // Build skip eligibility for each meal type
    const lunchSkip = await isSkipAllowed('lunch');
    const dinnerSkip = await isSkipAllowed('dinner');

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

    // Loyalty Record
    const { getLoyaltyRecord } = await import('@/lib/loyalty');
    const loyalty = await getLoyaltyRecord(user.email, user.id);

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
      currentIstTime,
      subscriptions: subscriptionSummaries,
      todaysMeals,
      skipEligibility: {
        lunch: {
          ...lunchSkip,
          cutoffDisplay: formatCutoffTime(settings.lunchSkipCutoff),
          mealTimeDisplay: formatCutoffTime(settings.lunchTime),
        },
        dinner: {
          ...dinnerSkip,
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
      },
      notifications,
    });
  } catch (e: any) {
    console.error('[dashboard GET]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
