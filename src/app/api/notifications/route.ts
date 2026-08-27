import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserNotifications, markAllNotificationsRead } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const notifications = await getUserNotifications(session.userId);
  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await markAllNotificationsRead(session.userId);
  return NextResponse.json({ success: true });
}
