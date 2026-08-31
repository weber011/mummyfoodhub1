import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserSubscriptions } from '@/lib/subscriptions';
import { getMonthlyReport } from '@/lib/reports';

/**
 * GET /api/reports?year=2026&month=8&subscriptionId=...
 * Returns complete aggregated report for selected month, with calendar entries and metrics.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString(), 10);
    const subscriptionId = searchParams.get('subscriptionId');

    const userSubs = await getUserSubscriptions(session.userId);
    if (userSubs.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found for user.' }, { status: 404 });
    }

    let targetSub = userSubs.find((s) => s.id === subscriptionId);
    if (!targetSub) {
      // Default to first active or latest subscription
      targetSub = userSubs.find((s) => s.status === 'active') || userSubs[0];
    }

    const report = await getMonthlyReport(targetSub, year, month);

    return NextResponse.json({
      success: true,
      report,
      subscription: targetSub,
    });
  } catch (error: any) {
    console.error('[reports GET]', error);
    return NextResponse.json({ error: 'Failed to generate monthly report' }, { status: 500 });
  }
}
