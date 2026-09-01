import { NextRequest, NextResponse } from 'next/server';
import { logDelivery, getDeliveryLog } from '@/lib/subscriptions';
import { sendDeliveryNotificationEmail } from '@/lib/email';
import { getUserById } from '@/lib/auth';
import { redisGet } from '@/lib/redis';
import type { UserSubscription } from '@/lib/types';

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

// POST: Admin logs a delivery entry for a subscription
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { subscriptionId, userId, date, status, notes, notifyCustomer, mealType } = body;

    if (!subscriptionId || !userId || !date || !status) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const entry = await logDelivery({ subscriptionId, userId, date, status, notes, notifyCustomer, mealType });

    // Optionally email the customer
    if (notifyCustomer) {
      const sub = await redisGet<UserSubscription>(`subscription:${subscriptionId}`);
      if (sub && sub.customerEmail) {
        const user = await getUserById(userId);
        sendDeliveryNotificationEmail(
          sub.customerEmail,
          sub.customerName || user?.name || 'Customer',
          sub.planName,
          date,
          status,
          notes || '',
        ).catch(e => console.error('[delivery notify email]', e));
      }
    }

    return NextResponse.json({ success: true, delivery: entry });
  } catch (e: any) {
    console.error('[admin/subscriptions/delivery POST]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// GET: Admin fetches delivery log for a specific subscription
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subscriptionId = searchParams.get('subscriptionId');
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });

  const log = await getDeliveryLog(subscriptionId);
  return NextResponse.json({ deliveries: log });
}
