import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { createOrder, getOrdersByUser, getMinOrderValue } from '@/lib/orders';
import { updateUser, getUserById } from '@/lib/auth';
import { sendOrderPlacedEmail, sendOwnerNewOrderEmail } from '@/lib/email';
import { getActiveSubscription } from '@/lib/subscriptions';
import { createNotification } from '@/lib/notifications';
import { redisGet, redisSet } from '@/lib/redis';
import { validateOrderDeliveryTime } from '@/lib/delivery-timing';
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
      customerName, customerPhone, sector, address, landmark, deliveryType, deliveryTime,
      paymentMethod, notes, customFields, utr, idempotencyKey } = body;

    // Idempotency check
    if (idempotencyKey) {
      const isDuplicate = await redisGet(`idempotency:${idempotencyKey}`);
      if (isDuplicate) {
        return NextResponse.json({ error: 'Order already processing' }, { status: 409 });
      }
      await redisSet(`idempotency:${idempotencyKey}`, 'processing', 60 * 5); // lock for 5 mins
    }

    // Server-side validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in order.' }, { status: 400 });
    }
    if (typeof subtotal !== 'number' || subtotal < getMinOrderValue()) {
      return NextResponse.json({ error: `Minimum order value is ₹${getMinOrderValue()}.` }, { status: 400 });
    }

    // Delivery timing enforcement in IST
    const timingValidation = validateOrderDeliveryTime(deliveryTime);
    if (!timingValidation.valid) {
      return NextResponse.json({ error: timingValidation.reason || 'Ordering is closed for the selected delivery time.' }, { status: 400 });
    }

    const user = await getUserById(session.userId);
    
    // Server-side discount recalculation based on active subscription
    const activeSub = await getActiveSubscription(session.userId);
    let subscriptionDiscount = 0;
    if (activeSub) {
       subscriptionDiscount = Math.floor(subtotal * (activeSub.discountPercentage / 100 || 0.10));
    }

    // Loyalty Reward Integration
    const { useLoyaltyReward } = body;
    let loyaltyDiscount = 0;
    let finalDeliveryCharge = Number(deliveryCharge ?? 0);

    if (useLoyaltyReward) {
      const { validateAndApplyLoyaltyReward, redeemLoyaltyReward } = await import('@/lib/loyalty');
      const loyaltyResult = await validateAndApplyLoyaltyReward({
        email: session.email,
        subtotal: Number(subtotal),
        standardDelivery: finalDeliveryCharge,
      });

      if (loyaltyResult.applicable) {
        loyaltyDiscount = loyaltyResult.discount;
        finalDeliveryCharge = loyaltyResult.deliveryCharge; // ₹0
      }
    }

    const serverDiscount = (Number(discount) || 0) + loyaltyDiscount; 
    const finalTotal = subtotal + finalDeliveryCharge - subscriptionDiscount - serverDiscount;

    const order = await createOrder({
      userId: session.userId,
      customerName: String(customerName || user?.name || '').trim(),
      customerEmail: session.email,
      customerPhone: String(customerPhone || user?.phone || '').trim(),
      items: items as OrderItem[],
      subtotal: Number(subtotal),
      deliveryCharge: finalDeliveryCharge,
      discount: serverDiscount,
      subscriptionDiscount,
      couponCode: couponCode ?? (loyaltyDiscount > 0 ? 'LOYALTY5TH' : undefined),
      totalAmount: Math.max(0, finalTotal),
      status: 'pending',
      sector: String(sector || ''),
      address: String(address || ''),
      landmark: String(landmark || ''),
      deliveryType: String(deliveryType || ''),
      deliveryTime: String(deliveryTime || ''),
      paymentMethod: String(paymentMethod || ''),
      notes: String(notes || ''),
      customFields: customFields || undefined,
      utr: utr ? String(utr) : undefined,
      idempotencyKey: idempotencyKey || undefined,
    });

    // Handle Loyalty Reward Redemption or Qualifying Order Recording
    if (useLoyaltyReward && loyaltyDiscount > 0) {
      const { redeemLoyaltyReward } = await import('@/lib/loyalty');
      await redeemLoyaltyReward(session.email, order.id);
    } else {
      const { recordQualifyingOrder } = await import('@/lib/loyalty');
      await recordQualifyingOrder(session.email, order.id, session.userId);
    }

    // Mark user as having placed an order (for first-order tracking)
    if (!user?.hasPlacedOrder) {
      await updateUser(session.userId, { hasPlacedOrder: true });
    }

    if (idempotencyKey) {
      await redisSet(`idempotency:${idempotencyKey}`, 'completed', 60 * 60 * 24); // 24h
    }

    // Fire-and-forget notifications
    sendOrderPlacedEmail(order).catch(err => console.error(err));
    sendOwnerNewOrderEmail(order).catch(err => console.error(err));
    
    // Create admin notification
    createNotification(
      'admin',
      'order_placed',
      'New Order Received',
      `Order ${order.orderNumber} placed for ₹${order.totalAmount}`,
      order.id
    ).catch(err => console.error(err));

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e: any) {
    console.error('[orders POST]', e);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}
