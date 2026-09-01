import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/subscriptions';
import { sendSubscriptionActivatedFullEmail } from '@/lib/email';
import { generateDailyMeals } from '@/lib/meals';
import { getIstDateString, getAdminSettings } from '@/lib/settings';
import { getUserByEmail, createUser } from '@/lib/auth';
import type { BasePlanType } from '@/lib/types';

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

// POST: Admin manually adds an offline customer subscription
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      basePlan, // 'lunch' | 'dinner' | 'complete'
      hasBreakfastAddon, // boolean
      startDate,
      paymentStatus = 'paid',
      paymentMethod = 'Cash',
      utr,
      address,
      sector = '106',
      landmark,
      deliveryType,
      deliveryTime,
      deliveryPreference = 'gate',
      notes,
    } = body;

    // Strict validation: Reject Breakfast Only
    if (basePlan === 'breakfast_only' || (!basePlan && hasBreakfastAddon)) {
      return NextResponse.json(
        { error: 'Breakfast is an add-on only and cannot be created independently. Please select a Base Plan (Lunch, Dinner, or Complete).' },
        { status: 400 }
      );
    }

    if (!customerName || !customerPhone || !basePlan || !startDate || !address) {
      return NextResponse.json({ error: 'Missing required fields: Name, Phone, Base Plan, Start Date, Address are required.' }, { status: 400 });
    }

    const bPlan: BasePlanType = basePlan === 'dinner' ? 'dinner' : basePlan === 'complete' ? 'complete' : 'lunch';
    const isDinner = bPlan === 'dinner';
    const isComplete = bPlan === 'complete';
    const isLunch = bPlan === 'lunch';
    const breakfast = Boolean(hasBreakfastAddon);

    // Calculate entitlements & validity
    let lunchMeals = isLunch || isComplete ? 26 : 0;
    let dinnerMeals = isDinner || isComplete ? 30 : 0;
    let breakfastMeals = breakfast ? 26 : 0;
    let totalMeals = lunchMeals + dinnerMeals + breakfastMeals;

    // Validity: Lunch 56 days, Dinner 60 days, Complete 60 days
    const validityDays = isDinner || isComplete ? 60 : 56;
    const start = new Date(startDate);
    const end = new Date(start.getTime() + validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Canonical Plan Name & Pricing
    let planName = isComplete
      ? (breakfast ? 'Complete Plan + Breakfast' : 'Complete Plan')
      : isDinner
        ? (breakfast ? 'Dinner + Breakfast' : 'Dinner Plan')
        : (breakfast ? 'Lunch + Breakfast' : 'Lunch Plan');

    let planPrice = isComplete
      ? (breakfast ? 6000 : 4400)
      : isDinner
        ? (breakfast ? 4120 : 2500)
        : (breakfast ? 3719 : 2099);

    // 1. Link or Create customer account if email provided
    let userId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (customerEmail) {
      const existingUser = await getUserByEmail(customerEmail);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await createUser({
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
        });
        userId = newUser.id;
      }
    }

    // 2. Create subscription record
    const sub = await createSubscription({
      userId,
      planId: `plan-${bPlan}${breakfast ? '-breakfast' : ''}`,
      planName,
      planPrice,
      basePlan: bPlan,
      hasBreakfastAddon: breakfast,
      startDate,
      endDate: end,
      validityDays,
      status: 'active',
      totalMeals,
      usedMeals: 0,
      skippedMeals: 0,
      expiredMeals: 0,
      transferredMeals: 0,
      lunchTotalMeals: lunchMeals,
      lunchUsedMeals: 0,
      lunchSkippedMeals: 0,
      lunchTransferredMeals: 0,
      dinnerTotalMeals: dinnerMeals,
      dinnerUsedMeals: 0,
      dinnerSkippedMeals: 0,
      dinnerTransferredMeals: 0,
      breakfastTotalMeals: breakfastMeals,
      breakfastUsedMeals: 0,
      breakfastSkippedMeals: 0,
      breakfastTransferredMeals: 0,
      mealType: isComplete ? 'both' : isDinner ? 'dinner' : 'lunch',
      deliveryPreference: deliveryPreference as 'doorstep' | 'gate',
      discountPercentage: 10,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone,
      address,
      sector,
      landmark: landmark || '',
      deliveryType: deliveryType || (deliveryPreference === 'doorstep' ? 'Doorstep Delivery' : 'Gate Delivery'),
      deliveryTime: deliveryTime || (isDinner ? 'Dinner (8:00 PM - 9:30 PM)' : 'Lunch (12:30 PM - 2:00 PM)'),
      notes: notes || '',
      utr: utr || '',
      isOffline: true,
      paymentStatus: paymentStatus as 'paid' | 'pending',
      paymentMethod,
    });

    // 3. Generate initial meal record for today if within date range
    const today = getIstDateString();
    if (today >= startDate && today <= end) {
      await generateDailyMeals(today, [sub], 'Fresh Homemade Thali').catch(console.error);
    }

    // 4. Send activation email if customer email provided
    if (customerEmail) {
      const settings = await getAdminSettings();
      sendSubscriptionActivatedFullEmail(customerEmail, customerName, {
        planName,
        planPrice,
        totalMeals,
        mealType: isComplete ? 'both' : isDinner ? 'dinner' : 'lunch',
        startDate,
        endDate: end,
        validityDays,
        lunchSkipCutoff: settings.lunchSkipCutoff,
        dinnerSkipCutoff: settings.dinnerSkipCutoff,
      }).catch(e => console.error('[offline subscriber email]', e));
    }

    return NextResponse.json({ success: true, subscription: sub });
  } catch (e: any) {
    console.error('[admin/subscriptions/offline POST]', e);
    return NextResponse.json({ error: 'Server error: ' + e.message }, { status: 500 });
  }
}
