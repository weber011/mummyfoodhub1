import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { executeMealTransfer } from '@/lib/meal-transfer';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: please login' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, sourceMealId, targetMealType } = body;

    if (!subscriptionId || !sourceMealId || !targetMealType) {
      return NextResponse.json(
        { error: 'Missing required parameters: subscriptionId, sourceMealId, targetMealType' },
        { status: 400 }
      );
    }

    if (targetMealType !== 'lunch' && targetMealType !== 'dinner') {
      return NextResponse.json(
        { error: 'Invalid targetMealType: must be lunch or dinner' },
        { status: 400 }
      );
    }

    const result = await executeMealTransfer({
      userId: session.userId,
      subscriptionId,
      sourceMealId,
      targetMealType,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    // Customer In-App Notification
    await createNotification(
      session.userId,
      'meal_transfer_confirmed',
      'Meal Successfully Transferred 🟣',
      `Your skipped ${result.transfer.sourceMealType} has been transferred to ${result.transfer.targetMealType}.`
    );

    // Admin Notification
    await createNotification(
      'admin',
      'admin_transfer_alert',
      `Meal Transferred — ${session.name}`,
      `Customer ${session.name} transferred skipped ${result.transfer.sourceMealType} to ${result.transfer.targetMealType} on ${result.transfer.targetDate}.`
    );

    return NextResponse.json({
      success: true,
      message: 'Meal successfully transferred.',
      transfer: result.transfer,
      targetMeal: result.targetMeal,
    });
  } catch (err: any) {
    console.error('[API /api/meals/transfer] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
