import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserById } from '@/lib/auth';
import { redisSet, redisGet, redisLPush } from '@/lib/redis';
import { sendSubscriptionRequestEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

// POST: Customer requests a subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to request a subscription.' }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const body = await req.json();
    const { planId, planName, planPrice, phone } = body;
    if (!planId || !planName || !planPrice) {
      return NextResponse.json({ error: 'Plan details required.' }, { status: 400 });
    }

    // Check if already has pending request
    const existingReq = await redisGet<any>(`sub_request:${session.userId}`);
    if (existingReq && existingReq.status === 'pending') {
      return NextResponse.json({ error: 'You already have a pending subscription request. Please wait for admin approval.' }, { status: 409 });
    }

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
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await redisSet(`sub_request:${requestId}`, subRequest);
    await redisSet(`sub_request:${session.userId}`, subRequest); // user lookup key
    await redisLPush('sub_requests:all', requestId);

    // Notify owner by email
    sendSubscriptionRequestEmail({
      userId: session.userId,
      name: user.name,
      email: user.email,
      phone: subRequest.phone,
      planName,
      planId,
      planPrice,
    }).catch(e => console.error('[sub request email]', e));

    return NextResponse.json({ success: true, message: 'Your subscription request has been sent! We will activate it after verifying your payment.' });
  } catch (e: any) {
    console.error('[subscriptions POST]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// GET: Get user's current subscription or pending request
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pendingReq = await redisGet<any>(`sub_request:${session.userId}`);
    return NextResponse.json({ pendingRequest: pendingReq ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
