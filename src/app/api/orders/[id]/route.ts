import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getOrderById } from '@/lib/orders';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  // Customers can only see their own orders; admins can see all
  if (session.role !== 'admin' && order.userId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  return NextResponse.json({ order });
}
