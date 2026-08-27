import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisLPush, redisLRange } from './redis';
import type { Notification, NotificationType } from './types';

const NOTIF_PREFIX = 'notification:';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  orderId?: string
): Promise<Notification> {
  const id = randomUUID();
  const notif: Notification = {
    id, userId, type, title, message, orderId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await redisSet(`${NOTIF_PREFIX}${id}`, notif);
  await redisLPush(`notifications:user:${userId}`, id);
  return notif;
}

export async function getUserNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const ids = await redisLRange<string>(`notifications:user:${userId}`, 0, limit - 1);
  const notifs = await Promise.all(
    ids.map((id) => redisGet<Notification>(`${NOTIF_PREFIX}${id}`))
  );
  return (notifs.filter(Boolean) as Notification[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  const notif = await redisGet<Notification>(`${NOTIF_PREFIX}${id}`);
  if (notif) {
    await redisSet(`${NOTIF_PREFIX}${id}`, { ...notif, read: true });
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const notifs = await getUserNotifications(userId, 100);
  await Promise.all(
    notifs.filter(n => !n.read).map(n =>
      redisSet(`${NOTIF_PREFIX}${n.id}`, { ...n, read: true })
    )
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  const notifs = await getUserNotifications(userId, 50);
  return notifs.filter(n => !n.read).length;
}
