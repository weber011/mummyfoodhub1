import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscriptions, updateSubscription } from '@/lib/subscriptions';
import { sendSubscriptionExpiringEmail, sendSubscriptionExpiredEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { getUserById } from '@/lib/auth';

async function checkAndExpireSubscriptions() {
  const subs = await getAllSubscriptions();
  const activeSubs = subs.filter(s => s.status === 'active');
  const now = new Date();
  
  for (const sub of activeSubs) {
    const end = new Date(sub.endDate);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const user = await getUserById(sub.userId);
    if (!user) continue;

    // Expiry check
    if (diffDays <= 0) {
      await updateSubscription(sub.id, { status: 'expired' });
      sendSubscriptionExpiredEmail(user.email, user.name, sub).catch(e => console.error(e));
      createNotification(sub.userId, 'subscription_expired', 'Subscription Expired', `Your ${sub.planName} subscription has expired.`).catch(e => console.error(e));
      continue;
    }
    
    // 3-day reminder
    if (diffDays <= 3 && !sub.reminderSentAt) {
      await updateSubscription(sub.id, { reminderSentAt: now.toISOString() });
      sendSubscriptionExpiringEmail(user.email, user.name, sub, diffDays).catch(e => console.error(e));
      createNotification(sub.userId, 'subscription_expiring', 'Subscription Expiring Soon', `Your ${sub.planName} subscription expires in ${diffDays} day(s).`).catch(e => console.error(e));
    }
  }
}

export async function GET(req: NextRequest) {
  // Validate Vercel Cron Secret to ensure this is only called by Vercel
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await checkAndExpireSubscriptions();
    return NextResponse.json({ success: true, message: 'Subscription cron ran successfully' });
  } catch (error: any) {
    console.error('[cron/subscriptions]', error);
    return NextResponse.json({ error: 'Failed to run subscription cron' }, { status: 500 });
  }
}
