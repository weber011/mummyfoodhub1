import { randomUUID } from 'crypto';
import { redisGet, redisSet, redisSAdd, redisSMembers } from './redis';
import type { User } from './types';

const USER_PREFIX = 'user:';
const EMAIL_INDEX = 'email_to_id';

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.toLowerCase().trim();
  const userId = await redisGet<string>(`${EMAIL_INDEX}:${normalized}`);
  if (!userId) return null;
  return getUserById(userId);
}

export async function getUserById(id: string): Promise<User | null> {
  return redisGet<User>(`${USER_PREFIX}${id}`);
}

export async function createUser(data: { email: string; name: string; phone?: string }): Promise<User> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const user: User = {
    id,
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    phone: data.phone,
    createdAt: now,
    role: 'customer',
    hasPlacedOrder: false,
  };
  await redisSet(`${USER_PREFIX}${id}`, user);
  await redisSet(`${EMAIL_INDEX}:${user.email}`, id);
  await redisSAdd('users:all', id);
  return user;
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) return null;
  const updated: User = { ...existing, ...updates };
  await redisSet(`${USER_PREFIX}${id}`, updated);
  return updated;
}

export async function getAllUsers(): Promise<User[]> {
  const ids = await redisSMembers('users:all');
  const users = await Promise.all(ids.map((id) => getUserById(id)));
  return users.filter(Boolean) as User[];
}
