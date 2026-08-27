import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserSubscriptions, getActiveSubscription } from '@/lib/subscriptions';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [active, history] = await Promise.all([
    getActiveSubscription(session.userId),
    getUserSubscriptions(session.userId),
  ]);

  return NextResponse.json({ active, history });
}
