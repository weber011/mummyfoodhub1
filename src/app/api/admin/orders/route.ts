import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, updateOrderStatus, approveOrder } from '@/lib/orders';
import { sendOrderConfirmedEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

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
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.toLowerCase();

  let orders = await getAllOrders();

  if (status && status !== 'all') {
    orders = orders.filter(o => o.status === status);
  }

  if (search) {
    orders = orders.filter(o => 
      o.orderNumber?.toLowerCase().includes(search) ||
      o.customerName?.toLowerCase().includes(search) ||
      o.customerPhone?.includes(search)
    );
  }

  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, action, status } = body;
    
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    let order;

    if (action === 'approve') {
      order = await approveOrder(orderId);
      if (!order) {
         return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      // Send confirmation email
      sendOrderConfirmedEmail(order.customerEmail, order).catch(e => console.error(e));
      createNotification(order.userId, 'order_confirmed', 'Order Confirmed', `Your order ${order.orderNumber} has been confirmed.`, order.id).catch(e => console.error(e));

    } else if (status) {
      order = await updateOrderStatus(orderId, status);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      createNotification(order.userId, `order_${status}` as any, `Order ${status}`, `Your order ${order.orderNumber} is now ${status}.`, order.id).catch(e => console.error(e));

    } else {
      return NextResponse.json({ error: 'Missing action or status' }, { status: 400 });
    }

    return NextResponse.json({ success: true, order });
  } catch (e: any) {
    console.error('[admin/orders PATCH]', e);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
