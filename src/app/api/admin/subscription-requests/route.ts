import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisLRange, redisSet } from '@/lib/redis';
import { createSubscription } from '@/lib/subscriptions';
import { getUserById } from '@/lib/auth';
import { sendSubscriptionActivatedFullEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { generateDailyMeals } from '@/lib/meals';
import { getIstDateString, getAdminSettings } from '@/lib/settings';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';

function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic' || !credentials) return false;
  const [username, password] = Buffer.from(credentials, 'base64').toString('utf-8').split(':');
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ids = await redisLRange<string>('sub_requests:all', 0, 199);
  const requests = await Promise.all(ids.map(id => redisGet<any>(`sub_request:${id}`)));
  const valid = requests.filter(Boolean).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ requests: valid });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { requestId, action, startDate, endDate, totalMeals, mealType, deliveryPreference } = body;

  if (!requestId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const subReq = await redisGet<any>(`sub_request:${requestId}`);
  if (!subReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  if (action === 'approve') {
    const start = startDate || new Date().toISOString().split('T')[0];
    // 56-day default validity for standard subscriptions
    const validityDays = subReq.validityDays || 56;
    const end = endDate || new Date(new Date(start).getTime() + validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const mealsCount = totalMeals !== undefined ? Number(totalMeals) : (subReq.totalMeals || 26);
    const mType = mealType || subReq.mealType || (subReq.planName?.toLowerCase().includes('dinner') ? 'dinner' : 'lunch');
    const pref = deliveryPreference || subReq.deliveryPreference || 'gate';

    const user = await getUserById(subReq.userId);

    // Create subscription with all delivery details stored
    const sub = await createSubscription({
      userId: subReq.userId,
      planId: subReq.planId,
      planName: subReq.planName,
      planPrice: subReq.planPrice,
      startDate: start,
      endDate: end,
      status: 'active',
      totalMeals: mealsCount,
      usedMeals: 0,
      skippedMeals: 0,
      expiredMeals: 0,
      mealType: mType,
      deliveryPreference: pref,
      deliveryInstructions: subReq.deliveryInstructions || '',
      houseNumber: subReq.houseNumber || '',
      building: subReq.building || '',
      discountPercentage: 10,
      basePlan: subReq.basePlan,
      hasBreakfastAddon: subReq.hasBreakfastAddon,
      separateAddresses: subReq.separateAddresses,
      breakfastDelivery: subReq.breakfastDelivery,
      lunchDelivery: subReq.lunchDelivery,
      dinnerDelivery: subReq.dinnerDelivery,
      // Store customer delivery details
      customerName: subReq.name,
      customerEmail: subReq.email,
      customerPhone: subReq.phone,
      address: subReq.address,
      sector: subReq.sector,
      landmark: subReq.landmark,
      deliveryType: subReq.deliveryType,
      deliveryTime: subReq.deliveryTime,
      notes: subReq.notes,
      utr: subReq.utr,
      isOffline: false,
    });

    // Mark request as approved
    await redisSet(`sub_request:${requestId}`, { ...subReq, status: 'approved', approvedAt: new Date().toISOString(), subscriptionId: sub.id });
    await redisSet(`sub_request:${subReq.userId}`, { ...subReq, status: 'approved', subscriptionId: sub.id });

    // Generate initial meal record for today if within date range
    const today = getIstDateString();
    const siteData = await redisGet<any>('siteData');
    const menuDesc = siteData?.dailyMenu?.description || siteData?.dailyMenu?.title || 'Dal + Seasonal Sabji + 4 Butter Roti + Rice';
    await generateDailyMeals(today, [sub], menuDesc).catch(console.error);

    const settings = await getAdminSettings();

    if (user) {
      sendSubscriptionActivatedFullEmail(user.email, user.name, {
        planName: sub.planName,
        planPrice: sub.planPrice || 2099,
        totalMeals: mealsCount,
        mealType: mType,
        startDate: start,
        endDate: end,
        validityDays,
        lunchSkipCutoff: settings.lunchSkipCutoff,
        dinnerSkipCutoff: settings.dinnerSkipCutoff,
      }).catch(e => console.error('[sub activated email error]', e));

      createNotification(
        subReq.userId,
        'subscription_activated',
        'Subscription Activated! ❤️',
        `Your ${subReq.planName} (${mealsCount} meals, ${validityDays} days validity) is now active.`
      ).catch(e => console.error(e));
    }

    return NextResponse.json({ success: true, subscription: sub });
  }

  if (action === 'reject') {
    await redisSet(`sub_request:${requestId}`, { ...subReq, status: 'rejected', rejectedAt: new Date().toISOString() });
    await redisSet(`sub_request:${subReq.userId}`, { ...subReq, status: 'rejected' });
    createNotification(subReq.userId, 'subscription_rejected', 'Subscription Request', 'Your subscription request could not be processed. Please contact us.').catch(e => console.error(e));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

