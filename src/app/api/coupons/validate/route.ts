import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { validateCoupon } from '@/lib/coupons';
import { getUserById } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Please log in to apply a coupon.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const code: string = (body.code ?? '').trim();
    const subtotal: number = Number(body.subtotal ?? 0);

    if (!code) {
      return NextResponse.json({ valid: false, reason: 'Please enter a coupon code.' });
    }
    if (subtotal <= 0) {
      return NextResponse.json({ valid: false, reason: 'Invalid order amount.' });
    }

    const user = await getUserById(session.userId);
    const hasPlacedOrder = user?.hasPlacedOrder ?? false;

    const result = await validateCoupon(code, session.userId, subtotal, hasPlacedOrder);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[coupon validate]', e);
    return NextResponse.json({ valid: false, reason: 'Server error. Please try again.' });
  }
}
