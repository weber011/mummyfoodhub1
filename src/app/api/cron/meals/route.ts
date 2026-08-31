import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscriptions, updateSubscription } from '@/lib/subscriptions';
import { generateDailyMeals, markPastMealsAsMissed, getMealForToday } from '@/lib/meals';
import { getIstDateString, getAdminSettings, formatCutoffTime } from '@/lib/settings';
import { getUserById } from '@/lib/auth';
import {
  sendMealReminderEmail,
  sendSubscriptionExpiry7dEmail,
  sendSubscriptionExpiringEmail,
  sendSubscriptionExpiry1dEmail,
  sendSubscriptionExpiredEmail,
} from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { redisGet } from '@/lib/redis';

export async function GET(req: NextRequest) {
  // Optional cron authorization
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  try {
    const today = getIstDateString();
    const settings = await getAdminSettings();

    // 1. Get site data for daily menu
    const siteData = await redisGet<any>('siteData');
    const dailyMenu = siteData?.dailyMenu?.description || siteData?.dailyMenu?.title || 'Dal + Seasonal Sabji + 4 Butter Roti + Rice + Salad';

    // 2. Fetch all active subscriptions
    const allSubs = await getAllSubscriptions();
    const activeSubs = allSubs.filter((s) => s.status === 'active');

    // 3. Generate daily meal records
    const mealGenResult = await generateDailyMeals(today, activeSubs, dailyMenu);

    // 4. Mark yesterday's unclosed meals as missed
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
    const missedCount = await markPastMealsAsMissed(yesterdayStr);

    // 5. Send morning reminders & expiry checks
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const ist = new Date(istString);

    let remindersSent = 0;
    let expiryAlertsSent = 0;

    for (const sub of activeSubs) {
      const user = await getUserById(sub.userId);
      if (!user) continue;

      // Expiry calculation
      const end = new Date(sub.endDate);
      const diffDays = Math.ceil((end.getTime() - ist.getTime()) / (1000 * 60 * 60 * 24));

      // Expire overdue subscriptions
      if (diffDays < 0) {
        await updateSubscription(sub.id, { status: 'expired' });
        sendSubscriptionExpiredEmail(user.email, user.name, sub).catch(console.error);
        createNotification(user.id, 'subscription_expired', 'Subscription Expired', `Your ${sub.planName} validity has ended.`).catch(console.error);
        continue;
      }

      // 7-day reminder
      if (diffDays === 7 && !sub.reminderSent7dAt) {
        await updateSubscription(sub.id, { reminderSent7dAt: now.toISOString() });
        sendSubscriptionExpiry7dEmail(user.email, user.name, sub).catch(console.error);
        createNotification(user.id, 'subscription_expiring', 'Subscription Expiring in 7 Days', `Your ${sub.planName} expires in 7 days.`).catch(console.error);
        expiryAlertsSent++;
      }

      // 3-day reminder
      if (diffDays === 3 && !sub.reminderSentAt) {
        await updateSubscription(sub.id, { reminderSentAt: now.toISOString() });
        sendSubscriptionExpiringEmail(user.email, user.name, sub, 3).catch(console.error);
        createNotification(user.id, 'subscription_expiring', 'Subscription Expiring in 3 Days', `Your ${sub.planName} expires in 3 days.`).catch(console.error);
        expiryAlertsSent++;
      }

      // 1-day reminder
      if (diffDays === 1 && !sub.reminderSent1dAt) {
        await updateSubscription(sub.id, { reminderSent1dAt: now.toISOString() });
        sendSubscriptionExpiry1dEmail(user.email, user.name, sub).catch(console.error);
        createNotification(user.id, 'subscription_expiring', 'Subscription Expires Tomorrow', `Your ${sub.planName} expires tomorrow!`).catch(console.error);
        expiryAlertsSent++;
      }

      // Send daily meal reminder if customer has remaining meals
      const remaining = (sub.totalMeals ?? 0) - (sub.usedMeals ?? 0);
      if (remaining > 0 && diffDays >= 0) {
        const mealType = sub.mealType === 'dinner' ? 'dinner' : 'lunch';
        const cutoffTime = mealType === 'dinner' ? settings.dinnerSkipCutoff : settings.lunchSkipCutoff;
        const expectedTime = mealType === 'dinner' ? formatCutoffTime(settings.dinnerTime) : formatCutoffTime(settings.lunchTime);

        sendMealReminderEmail(user.email, user.name, {
          mealType,
          menu: dailyMenu,
          deliveryPreference: sub.deliveryPreference || 'gate',
          expectedTime,
          cutoffTime,
          cutoffDisplay: formatCutoffTime(cutoffTime),
        }).catch(console.error);

        createNotification(
          user.id,
          'meal_reminder',
          `Today's ${mealType === 'dinner' ? 'Dinner' : 'Lunch'} is Scheduled 🍱`,
          `Menu: ${dailyMenu}. Skip cutoff is ${formatCutoffTime(cutoffTime)}.`
        ).catch(console.error);

        remindersSent++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily meal cron completed successfully',
      date: today,
      mealsGenerated: mealGenResult.created,
      missedClosed: missedCount,
      remindersSent,
      expiryAlertsSent,
    });
  } catch (error: any) {
    console.error('[cron/meals error]', error);
    return NextResponse.json({ error: 'Failed to run daily meals cron' }, { status: 500 });
  }
}
