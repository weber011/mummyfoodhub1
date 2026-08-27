import { NextRequest, NextResponse } from 'next/server';
import { getOrderByNumber } from '@/lib/orders';

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, phone } = await req.json();
    if (!orderNumber || !phone) {
       return NextResponse.json({ error: 'Order number and phone are required.' }, { status: 400 });
    }

    const order = await getOrderByNumber(orderNumber);
    
    if (!order) {
       return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.customerPhone !== phone && order.customerPhone.replace(/\D/g,'') !== phone.replace(/\D/g,'')) {
       return NextResponse.json({ error: 'Phone number does not match this order.' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to track order.' }, { status: 500 });
  }
}
