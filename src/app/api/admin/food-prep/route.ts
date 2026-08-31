import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getFoodPrepReport } from '@/lib/reports';
import { getIstDateString } from '@/lib/settings';

/**
 * GET /api/admin/food-prep?date=YYYY-MM-DD
 * Calculates food preparation requirement for lunch & dinner in real-time.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || getIstDateString();

    const report = await getFoodPrepReport(date);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('[admin/food-prep GET]', error);
    return NextResponse.json({ error: 'Failed to generate food prep report.' }, { status: 500 });
  }
}
