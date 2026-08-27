import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisLPush, redisLRange, redisSAdd, redisSMembers } from './redis';
import { sendOrderStatusEmail } from './email';
import type { Order, OrderStatus } from './types';

const ORDER_PREFIX = 'order:';

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const full: Order = { ...order, id, createdAt: now, updatedAt: now };
  await redisSet(`${ORDER_PREFIX}${id}`, full);
  await redisLPush(`orders:user:${order.userId}`, id);
  await redisLPush('orders:all', id);
  return full;
}

export async function getOrderById(id: string): Promise<Order | null> {
  return redisGet<Order>(`${ORDER_PREFIX}${id}`);
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const ids = await redisLRange<string>(`orders:user:${userId}`, 0, 99);
  const orders = await Promise.all(ids.map((id) => getOrderById(id)));
  return orders.filter(Boolean) as Order[];
}

export async function getAllOrders(): Promise<Order[]> {
  const ids = await redisLRange<string>('orders:all', 0, 199);
  const orders = await Promise.all(ids.map((id) => getOrderById(id)));
  return orders.filter(Boolean) as Order[];
}

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
  };
  await redisSet(`${ORDER_PREFIX}${orderId}`, updated);

  if (shouldNotify) {
    await redisSet(lastNotifiedKey, status);
    // Notify customer by email (fire-and-forget — failure must not block admin UI)
    if (updated.customerEmail) {
      sendOrderStatusEmail(updated.customerEmail, updated, status).catch((err) =>
        console.error('[updateOrderStatus] email send failed:', err?.message)
      );
    }
  }

  return updated;
}
