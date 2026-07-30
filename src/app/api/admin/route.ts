import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';
const DATA_PATH = path.join(process.cwd(), 'public', 'data', 'site.json');

// Try to import KV — if not available, we fall back to file-based storage
async function kvSet(key: string, value: any): Promise<boolean> {
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value);
    return true;
  } catch {
    return false;
  }
}

async function kvGet(key: string): Promise<any> {
  try {
    const { kv } = await import('@vercel/kv');
    return await kv.get(key);
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

    // Try KV first, fall back to local file
    const savedToKV = await kvSet('siteData', data);

    try {
      // Always save to local file as backup
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ignore file write errors in serverless environment
    }

    return NextResponse.json({ 
      success: true, 
      storage: savedToKV ? 'kv' : 'file',
      message: savedToKV ? 'Saved to cloud database.' : 'Saved locally (KV not connected — add Vercel KV in dashboard for cloud sync).'
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET() {
  try {
    // 1. Try KV first
    const kvData = await kvGet('siteData');
    if (kvData) {
      return NextResponse.json(kvData);
    }

    // 2. Fall back to local JSON file
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load site data: ' + e.message }, { status: 500 });
  }
}
