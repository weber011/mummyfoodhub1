import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { createOrder, getOrdersByUser } from '@/lib/orders';
import { updateUser, getUserById } from '@/lib/auth';
import { sendOrderPlacedEmail } from '@/lib/email';
import type { OrderItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const orders = await getOrdersByUser(session.userId);
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, subtotal, deliveryCharge, discount, couponCode, totalAmount,
      customerName, customerPhone, sector, address, deliveryType, deliveryTime,
      paymentMethod, notes } = body;

    // Server-side validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in order.' }, { status: 400 });
    }
    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json({ error: 'Invalid subtotal.' }, { status: 400 });
    }
    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      return NextResponse.json({ error: 'Invalid total.' }, { status: 400 });
    }

    const user = await getUserById(session.userId);

    const order = await createOrder({
      userId: session.userId,
      customerName: String(customerName || user?.name || '').trim(),
      customerEmail: session.email,
      customerPhone: String(customerPhone || user?.phone || '').trim(),
      items: items as OrderItem[],
      subtotal: Number(subtotal),
      deliveryCharge: Number(deliveryCharge ?? 0),
      discount: Number(discount ?? 0),
      couponCode: couponCode ?? undefined,
      totalAmount: Number(totalAmount),
      status: 'placed',
      sector: String(sector || ''),
      address: String(address || ''),
      deliveryType: String(deliveryType || ''),
      deliveryTime: String(deliveryTime || ''),
      paymentMethod: String(paymentMethod || ''),
      notes: String(notes || ''),
    });

    // Mark user as having placed an order (for first-order coupon tracking)
    if (!user?.hasPlacedOrder) {
      await updateUser(session.userId, { hasPlacedOrder: true });
    }

    // Send order confirmation email (fire-and-forget — failure must not block the response)
    sendOrderPlacedEmail(session.email, order).catch((err) =>
      console.error('[orders POST] email send failed:', err?.message)
    );

    return NextResponse.json({ success: true, order });
  } catch (e: any) {
    console.error('[orders POST]', e);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}
