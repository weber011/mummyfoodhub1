import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscriptions, createSubscription, updateSubscription } from '@/lib/subscriptions';
import { getUserById } from '@/lib/auth';
import { sendSubscriptionActivatedEmail } from '@/lib/email';

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
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const subscriptions = await getAllSubscriptions();
  return NextResponse.json({ subscriptions });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { userId, planId, planName, startDate, endDate, totalMeals } = body;

    if (!userId || !planId || !planName || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sub = await createSubscription({
      userId,
      planId,
      planName,
      startDate,
      endDate,
      status: 'active',
      totalMeals: totalMeals ? Number(totalMeals) : undefined,
      usedMeals: 0,
    });

    // Notify customer by email (fire-and-forget)
    sendSubscriptionActivatedEmail(user.email, user.name, sub).catch((err) =>
      console.error('[admin/subscriptions POST] email send failed:', err?.message)
    );

    return NextResponse.json({ success: true, subscription: sub });
  } catch (e: any) {
    console.error('[admin/subscriptions POST]', e);
    return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }

    const sub = await updateSubscription(id, updates);
    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, subscription: sub });
  } catch (e: any) {
    console.error('[admin/subscriptions PATCH]', e);
    return NextResponse.json({ error: 'Failed to update subscription.' }, { status: 500 });
  }
}
