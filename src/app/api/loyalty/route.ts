import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getLoyaltyRecord, validateAndApplyLoyaltyReward } from '@/lib/loyalty';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const record = await getLoyaltyRecord(session.email, session.userId);
    return NextResponse.json({
      success: true,
      loyalty: {
        qualifyingMealCount: record.qualifyingMealCount || 0,
        rewardAvailable: record.rewardAvailable || false,
        rewardRedeemed: record.rewardRedeemed || false,
        rewardCycle: record.rewardCycle || 1,
        totalRewardsRedeemed: record.totalRewardsRedeemed || 0,
        discountPercentage: 15,
        freeDelivery: true,
      },
    });
  } catch (err: any) {
    console.error('[API /api/loyalty GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subtotal, deliveryCharge = 15 } = body;

    const result = await validateAndApplyLoyaltyReward({
      email: session.email,
      subtotal: Number(subtotal) || 0,
      standardDelivery: Number(deliveryCharge) || 0,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /api/loyalty POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
