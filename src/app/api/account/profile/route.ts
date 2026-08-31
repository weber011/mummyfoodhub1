import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getUserById, updateUser } from '@/lib/auth';
import { getUserSubscriptions, updateSubscription } from '@/lib/subscriptions';
import { redisGet, redisSet } from '@/lib/redis';

/**
 * GET /api/account/profile
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await getUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const subs = await getUserSubscriptions(session.userId);
    const activeSub = subs.find((s) => s.status === 'active');

    return NextResponse.json({
      success: true,
      user,
      activeSubscription: activeSub || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/account/profile
 * Updates customer contact info, delivery preference, instructions.
 * Note: Never allows client to modify meal balances or validity directly.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, phone, deliveryPreference, deliveryInstructions, houseNumber, building } = body;

    const updates: any = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (deliveryPreference === 'doorstep' || deliveryPreference === 'gate') {
      updates.deliveryPreference = deliveryPreference;
    }
    if (typeof deliveryInstructions === 'string') updates.deliveryInstructions = deliveryInstructions.trim();
    if (typeof houseNumber === 'string') updates.houseNumber = houseNumber.trim();
    if (typeof building === 'string') updates.building = building.trim();

    const updatedUser = await updateUser(session.userId, updates);

    // Also update active subscriptions delivery preference and instructions for future meals
    const subs = await getUserSubscriptions(session.userId);
    for (const sub of subs) {
      if (sub.status === 'active') {
        await updateSubscription(sub.id, {
          ...(updates.deliveryPreference ? { deliveryPreference: updates.deliveryPreference } : {}),
          ...(updates.deliveryInstructions !== undefined ? { deliveryInstructions: updates.deliveryInstructions } : {}),
          ...(updates.houseNumber !== undefined ? { houseNumber: updates.houseNumber } : {}),
          ...(updates.building !== undefined ? { building: updates.building } : {}),
          ...(updates.phone ? { customerPhone: updates.phone } : {}),
          ...(updates.name ? { customerName: updates.name } : {}),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile and delivery preferences updated successfully.',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('[account/profile PATCH]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
