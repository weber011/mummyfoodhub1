import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    // Support both Upstash direct vars and Vercel KV vars (same @upstash/redis client)
    const url =
      process.env.UPSTASH_REDIS_REST_URL ??
      process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ??
      process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error(
        'Redis not configured. Please set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN ' +
        '(or KV_REST_API_URL + KV_REST_API_TOKEN for Vercel KV).'
      );
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

export async function redisGet<T = unknown>(key: string): Promise<T | null> {
  const r = getRedis();
  const val = await r.get<T>(key);
  return val ?? null;
}

export async function redisSet(key: string, value: unknown, exSeconds?: number): Promise<void> {
  const r = getRedis();
  if (exSeconds) {
    await r.set(key, JSON.stringify(value), { ex: exSeconds });
  } else {
    await r.set(key, JSON.stringify(value));
  }
}

export async function redisDel(key: string): Promise<void> {
  const r = getRedis();
  await r.del(key);
}

export async function redisLPush(key: string, value: unknown): Promise<void> {
  const r = getRedis();
  await r.lpush(key, JSON.stringify(value));
}

export async function redisLRange<T = unknown>(key: string, start: number, stop: number): Promise<T[]> {
  const r = getRedis();
  const items = await r.lrange(key, start, stop);
  return items.map((item) => {
    if (typeof item === 'string') {
      try { return JSON.parse(item) as T; } catch { return item as unknown as T; }
    }
    return item as unknown as T;
  });
}

export async function redisIncr(key: string): Promise<number> {
  const r = getRedis();
  return r.incr(key);
}

export async function redisExpire(key: string, seconds: number): Promise<void> {
  const r = getRedis();
  await r.expire(key, seconds);
}

export async function redisGetRaw(key: string): Promise<string | null> {
  const r = getRedis();
  const val = await r.get<string>(key);
  return val ?? null;
}

export async function redisSAdd(key: string, member: string): Promise<void> {
  const r = getRedis();
  await r.sadd(key, member);
}

export async function redisSMembers(key: string): Promise<string[]> {
  const r = getRedis();
  return r.smembers(key);
}

export async function redisSIsMember(key: string, member: string): Promise<boolean> {
  const r = getRedis();
  const result = await r.sismember(key, member);
  return result === 1;
}

export async function redisTTL(key: string): Promise<number> {
  const r = getRedis();
  return r.ttl(key);
}
