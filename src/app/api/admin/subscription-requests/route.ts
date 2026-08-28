import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisLRange, redisSet } from '@/lib/redis';
import { createSubscription } from '@/lib/subscriptions';
import { getUserById } from '@/lib/auth';
import { sendSubscriptionActivatedEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

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
  const { requestId, action, startDate, endDate, totalMeals } = body;

  if (!requestId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const subReq = await redisGet<any>(`sub_request:${requestId}`);
  if (!subReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  if (action === 'approve') {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const sub = await createSubscription({
      userId: subReq.userId,
      planId: subReq.planId,
      planName: subReq.planName,
      startDate: start,
      endDate: end,
      status: 'active',
      totalMeals: totalMeals ? Number(totalMeals) : undefined,
      usedMeals: 0,
      discountPercentage: 10,
    });

    // Mark request as approved
    await redisSet(`sub_request:${requestId}`, { ...subReq, status: 'approved', approvedAt: new Date().toISOString() });
    await redisSet(`sub_request:${subReq.userId}`, { ...subReq, status: 'approved' });

    const user = await getUserById(subReq.userId);
    if (user) {
      sendSubscriptionActivatedEmail(user.email, user.name, sub).catch(e => console.error(e));
      createNotification(subReq.userId, 'subscription_activated', 'Subscription Activated!', `Your ${subReq.planName} subscription is now active.`).catch(e => console.error(e));
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
