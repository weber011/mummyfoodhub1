import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/subscriptions';
import { sendOfflineSubscriberWelcomeEmail } from '@/lib/email';

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

// POST: Admin manually adds an offline (cash-paying) subscriber
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      customerName, customerEmail, customerPhone,
      planId, planName, planPrice,
      startDate, endDate, totalMeals,
      address, sector, landmark,
      deliveryType, deliveryTime, notes,
    } = body;

    if (!customerName || !customerPhone || !planId || !planName || !startDate || !endDate || !address || !sector) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Create an offline user ID (no real auth account needed)
    const offlineUserId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const sub = await createSubscription({
      userId: offlineUserId,
      planId,
      planName,
      planPrice: planPrice ? Number(planPrice) : undefined,
      startDate,
      endDate,
      status: 'active',
      totalMeals: totalMeals ? Number(totalMeals) : undefined,
      usedMeals: 0,
      discountPercentage: 10,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone,
      address,
      sector,
      landmark: landmark || '',
      deliveryType: deliveryType || 'Main Gate of House',
      deliveryTime: deliveryTime || 'Lunch (12:30 - 2 PM)',
      notes: notes || '',
      isOffline: true,
    });

    // Send welcome email if email provided
    if (customerEmail) {
      sendOfflineSubscriberWelcomeEmail(customerEmail, customerName, sub).catch(e =>
        console.error('[offline subscriber email]', e)
      );
    }

    return NextResponse.json({ success: true, subscription: sub });
  } catch (e: any) {
    console.error('[admin/subscriptions/offline POST]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
