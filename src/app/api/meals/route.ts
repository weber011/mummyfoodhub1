import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getMealsByUser, getMealsBySubscription } from '@/lib/meals';
import { getUserSubscriptions } from '@/lib/subscriptions';
import type { MealStatus } from '@/lib/types';

/**
 * GET /api/meals
 * Query parameters:
 * - subscriptionId (optional)
 * - status (optional, e.g. 'all', 'delivered', 'skipped', 'missed', 'upcoming')
 * - month (optional, format 'YYYY-MM')
 * - limit (optional, default 100)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const statusFilter = searchParams.get('status');
    const monthFilter = searchParams.get('month'); // YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let meals = [];
    if (subscriptionId) {
      meals = await getMealsBySubscription(subscriptionId, limit);
    } else {
      meals = await getMealsByUser(session.userId, limit);
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      meals = meals.filter((m) => {
        if (statusFilter === 'delivered') return m.status === 'delivered' || m.status === 'consumed';
        if (statusFilter === 'upcoming') return m.status === 'upcoming' || m.status === 'scheduled';
        return m.status === statusFilter;
      });
    }

    // Filter by month (YYYY-MM)
    if (monthFilter) {
      meals = meals.filter((m) => m.scheduledDate.startsWith(monthFilter));
    }

    return NextResponse.json({
      success: true,
      meals,
      count: meals.length,
    });
  } catch (error: any) {
    console.error('[api/meals GET]', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}
