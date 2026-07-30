import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';

export async function POST(req: NextRequest) {
  // Verify auth via query params
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const password = searchParams.get('password');

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  try {
    const blob = await put(`menu-images/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Upload failed: ' + e.message }, { status: 500 });
  }
}
