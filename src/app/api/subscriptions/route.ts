import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserById } from '@/lib/auth';
import { redisSet, redisGet, redisLPush } from '@/lib/redis';
import { sendSubscriptionRequestEmail } from '@/lib/email';
import { getActiveSubscription, getUserSubscriptions, getSubscriptionBalance } from '@/lib/subscriptions';
import { randomUUID } from 'crypto';

// POST: Customer requests a subscription (full details)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to request a subscription.' }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const body = await req.json();
    const {
      planId, planName, planPrice,
      phone, address, sector, landmark,
      deliveryType, deliveryTime, notes, utr,
      mealType, deliveryPreference, deliveryInstructions,
      houseNumber, building, totalMeals, validityDays,
    } = body;

    if (!planId || !planName || !planPrice) {
      return NextResponse.json({ error: 'Plan details required.' }, { status: 400 });
    }
    if (!address || !sector) {
      return NextResponse.json({ error: 'Address and sector are required.' }, { status: 400 });
    }

    // Check if already has pending request
    const existingReq = await redisGet<any>(`sub_request:${session.userId}`);
    if (existingReq && existingReq.status === 'pending') {
      return NextResponse.json({ error: 'You already have a pending subscription request. Please wait for admin approval.' }, { status: 409 });
    }

    const mType = mealType || (planName.toLowerCase().includes('dinner') ? 'dinner' : 'lunch');
    const pref = deliveryPreference || (deliveryType && deliveryType.toLowerCase().includes('door') ? 'doorstep' : 'gate');

    const requestId = randomUUID();
    const subRequest = {
      id: requestId,
      userId: session.userId,
      name: user.name,
      email: user.email,
      phone: phone || user.phone || '',
      planId,
      planName,
      planPrice,
      address,
      sector,
      landmark: landmark || '',
      deliveryType: deliveryType || (pref === 'doorstep' ? 'Doorstep Delivery' : 'Gate Delivery'),
      deliveryTime: deliveryTime || (mType === 'dinner' ? 'Dinner (8:00 PM - 9:30 PM)' : 'Lunch (12:30 PM - 2:00 PM)'),
      deliveryPreference: pref,
      deliveryInstructions: deliveryInstructions || '',
      houseNumber: houseNumber || '',
      building: building || '',
      mealType: mType,
      totalMeals: totalMeals || 26,
      validityDays: validityDays || 56,
      notes: notes || '',
      utr: utr || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await redisSet(`sub_request:${requestId}`, subRequest);
    await redisSet(`sub_request:${session.userId}`, subRequest); // user lookup key
    await redisLPush('sub_requests:all', requestId);

    // Notify owner by email with full details
    sendSubscriptionRequestEmail({
      userId: session.userId,
      name: user.name,
      email: user.email,
      phone: subRequest.phone,
      planName,
      planId,
      planPrice,
      address,
      sector,
      landmark: subRequest.landmark,
      deliveryType: subRequest.deliveryType,
      deliveryTime: subRequest.deliveryTime,
      notes: subRequest.notes,
      utr: subRequest.utr,
    }).catch(e => console.error('[sub request email]', e));

    return NextResponse.json({
      success: true,
      message: 'Your subscription request has been sent! We will contact you soon and activate your plan after payment verification.',
    });
  } catch (e: any) {
    console.error('[subscriptions POST]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// GET: Get user's current active subscription, balance, history or pending request
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allSubs = await getUserSubscriptions(session.userId);
    const activeSub = await getActiveSubscription(session.userId);
    const pendingReq = await redisGet<any>(`sub_request:${session.userId}`);

    const activeWithBalance = activeSub
      ? {
          ...activeSub,
          balance: getSubscriptionBalance(activeSub),
        }
      : null;

    const historyWithBalance = allSubs.map((s) => ({
      ...s,
      balance: getSubscriptionBalance(s),
    }));

    return NextResponse.json({
      active: activeWithBalance,
      history: historyWithBalance,
      pendingRequest: pendingReq ?? null,
    });
  } catch (e: any) {
    console.error('[subscriptions GET]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

