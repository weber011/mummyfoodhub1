import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';
const DATA_PATH = path.join(process.cwd(), 'public', 'data', 'site.json');

// Try Upstash Redis, fall back to file
async function dbSet(key: string, value: any): Promise<{ ok: boolean; storage: string }> {
  // Try Upstash Redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.set(key, JSON.stringify(value));
      return { ok: true, storage: 'upstash' };
    } catch (e: any) {
      console.error('Upstash error:', e.message);
    }
  }

  // Try legacy Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(key, value);
      return { ok: true, storage: 'vercel-kv' };
    } catch (e: any) {
      console.error('KV error:', e.message);
    }
  }

  // Fallback: local file (works in dev, read-only on Vercel)
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(value, null, 2), 'utf-8');
    return { ok: true, storage: 'file' };
  } catch {
    return { ok: false, storage: 'none' };
  }
}

async function dbGet(key: string): Promise<any> {
  // Try Upstash Redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const raw = await redis.get(key);
      if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e: any) {
      console.error('Upstash get error:', e.message);
    }
  }

  // Try legacy Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get(key);
      if (data) return data;
    } catch {}
  }

  // Fallback: local file
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'login') {
    const { username, password } = body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }

  if (action === 'save') {
    const { data, username, password } = body;
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await dbSet('siteData', data);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: 'Failed to save. Check database connection in Vercel Storage.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, storage: result.storage });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET() {
  try {
    const data = await dbGet('siteData');
    if (!data) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load: ' + e.message }, { status: 500 });
  }
}
