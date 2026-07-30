import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const password = searchParams.get('password');

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Check if Blob token exists
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ 
      success: false, 
      error: 'Blob storage not configured. Please go to Vercel Dashboard → your project → Storage → Blob → Connect → tick the "Add read-write token" checkbox and reconnect.' 
    }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  try {
    const { put } = await import('@vercel/blob');
    const blob = await put(`menu-images/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Upload failed: ' + e.message }, { status: 500 });
  }
}
