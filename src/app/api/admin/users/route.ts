import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/auth';

const ADMIN_USER = 'mummyfoodhubnoida';
const ADMIN_PASS = 'webbybuilderranchi';

function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic' || !credentials) return false;
  const [username, password] = Buffer.from(credentials, 'base64').toString('utf-8').split(':');
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const users = await getAllUsers();
  return NextResponse.json({ users });
}
