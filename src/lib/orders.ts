import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisLPush, redisLRange, redisIncr } from './redis';
import { sendOrderStatusEmail } from './email';
import type { Order, OrderStatus } from './types';

const ORDER_PREFIX = 'order:';
const MIN_ORDER_VALUE = 79;

// ── Order Number Generator ────────────────────────────────────────
// Format: MFH-YYYYMMDD-NNN (e.g. MFH-20260828-001)
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  // IST offset = +5:30
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const dateStr = ist.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const counterKey = `order_counter:${dateStr}`;
  const seq = await redisIncr(counterKey);
  const paddedSeq = String(seq).padStart(3, '0');
  return `MFH-${dateStr}-${paddedSeq}`;
}

export const getMinOrderValue = () => MIN_ORDER_VALUE;

// ── CRUD ─────────────────────────────────────────────────────────
export async function createOrder(
  order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const id = randomUUID();
  const orderNumber = await generateOrderNumber();
  const now = new Date().toISOString();
  const full: Order = { ...order, id, orderNumber, createdAt: now, updatedAt: now };
  await redisSet(`${ORDER_PREFIX}${id}`, full);
  await redisLPush(`orders:user:${order.userId}`, id);
  await redisLPush('orders:all', id);
  // Also index by order number for quick lookup
  await redisSet(`order_num:${orderNumber}`, id);
  return full;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const order = await redisGet<Order>(`${ORDER_PREFIX}${id}`);
  if (!order) return null;
  // Normalise legacy 'placed' status to 'pending'
  if ((order.status as string) === 'placed') {
    order.status = 'pending';
  }
  return order;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const id = await redisGet<string>(`order_num:${orderNumber}`);
  if (!id) return null;
  return getOrderById(id);
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const ids = await redisLRange<string>(`orders:user:${userId}`, 0, 99);
  const orders = await Promise.all(ids.map((id) => getOrderById(id)));
  return (orders.filter(Boolean) as Order[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAllOrders(): Promise<Order[]> {
  const ids = await redisLRange<string>('orders:all', 0, 499);
  const orders = await Promise.all(ids.map((id) => getOrderById(id)));
  return (orders.filter(Boolean) as Order[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── Approve Order ─────────────────────────────────────────────────
export async function approveOrder(orderId: string): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;
  const updated: Order = {
    ...order,
    status: 'confirmed',
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await redisSet(`${ORDER_PREFIX}${orderId}`, updated);
  return updated;
}

// ── Update Order Status ───────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  sentNotification?: boolean
): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  // Prevent duplicate notification spam: track last-notified status
  const lastNotifiedKey = `order_notified:${orderId}`;
  const lastNotified = await redisGet<string>(lastNotifiedKey);
  const shouldNotify = !sentNotification && lastNotified !== status;

  const updated: Order = {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
    ...(status === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}),
    ...(status === 'cancelled' ? { cancelledAt: new Date().toISOString() } : {}),
  };
  await redisSet(`${ORDER_PREFIX}${orderId}`, updated);

  if (shouldNotify) {
    await redisSet(lastNotifiedKey, status);
    if (updated.customerEmail) {
      sendOrderStatusEmail(updated.customerEmail, updated, status).catch((err) =>
        console.error('[updateOrderStatus] email send failed:', err?.message)
      );
    }
  }

  return updated;
}
