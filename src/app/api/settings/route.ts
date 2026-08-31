import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getAdminSettings, updateAdminSettings } from '@/lib/settings';

/**
 * GET /api/settings
 * Public/Customer accessible - returns current operational settings (cutoffs, times)
 */
export async function GET() {
  try {
    const settings = await getAdminSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[settings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * POST /api/settings
 * Admin only - updates operational parameters
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const updates = await req.json();
    const updated = await updateAdminSettings(updates);

    return NextResponse.json({
      success: true,
      message: 'Operational settings updated successfully.',
      settings: updated,
    });
  } catch (error: any) {
    console.error('[settings POST]', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
