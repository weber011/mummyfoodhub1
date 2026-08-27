import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, updateOrderStatus } from '@/lib/orders';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';

// Basic admin auth check for API routes
function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic' || !credentials) return false;
  const [username, password] = Buffer.from(credentials, 'base64').toString('utf-8').split(':');
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const orders = await getAllOrders();
  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, status } = body;
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const order = await updateOrderStatus(orderId, status);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (e: any) {
    console.error('[admin/orders PATCH]', e);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
