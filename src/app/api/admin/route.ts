import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';

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
    
    try {
      // Save directly to Vercel KV
      await kv.set('siteData', data);
      return NextResponse.json({ success: true });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: 'Failed to save to KV: ' + e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET() {
  try {
    // 1. Try to fetch from KV Database
    let data = null;
    try {
      data = await kv.get('siteData');
    } catch (e) {
      console.warn("KV store not available yet or error fetching.");
    }
    
    // 2. If KV is empty or not connected, fall back to local file
    if (!data) {
      const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'site.json'), 'utf-8');
      data = JSON.parse(raw);
    }
    
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load site data' }, { status: 500 });
  }
}
