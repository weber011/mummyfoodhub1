import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserDeliveryLog } from '@/lib/subscriptions';

// GET: Logged-in customer fetches their own delivery log
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const log = await getUserDeliveryLog(session.userId);
    return NextResponse.json({ deliveries: log });
  } catch (e: any) {
    console.error('[account/subscription/delivery-log GET]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
