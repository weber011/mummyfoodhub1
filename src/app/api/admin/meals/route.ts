import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getMealsByDate, updateMeal, getMealById } from '@/lib/meals';
import { getIstDateString } from '@/lib/settings';
import { redisGet, redisSet } from '@/lib/redis';
import type { UserSubscription, MealStatus } from '@/lib/types';
import { sendDeliveryNotificationEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { getUserById } from '@/lib/auth';

/**
 * GET /api/admin/meals?date=YYYY-MM-DD&mealType=lunch|dinner&status=...
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || getIstDateString();
    const mealType = searchParams.get('mealType');
    const status = searchParams.get('status');
    const preference = searchParams.get('preference'); // doorstep | gate

    let meals = await getMealsByDate(date);

    if (mealType && (mealType === 'lunch' || mealType === 'dinner')) {
      meals = meals.filter((m) => m.mealType === mealType);
    }
    if (status && status !== 'all') {
      meals = meals.filter((m) => m.status === status);
    }
    if (preference && preference !== 'all') {
      meals = meals.filter((m) => m.deliveryPreference === preference);
    }

    // Attach customer names & contacts for admin overview
    const enrichedMeals = await Promise.all(
      meals.map(async (m) => {
        const sub = await redisGet<UserSubscription>(`subscription:${m.subscriptionId}`);
        const user = await getUserById(m.userId);
        return {
          ...m,
          customerName: sub?.customerName || user?.name || 'Customer',
          customerPhone: sub?.customerPhone || user?.phone || '',
          customerEmail: sub?.customerEmail || user?.email || '',
          planName: sub?.planName || '',
          address: m.deliveryAddress || sub?.address || '',
          sector: sub?.sector || '',
          landmark: sub?.landmark || '',
          deliveryPreference: m.deliveryPreference || sub?.deliveryPreference || 'gate',
        };
      })
    );

    return NextResponse.json({
      success: true,
      date,
      meals: enrichedMeals,
      count: enrichedMeals.length,
    });
  } catch (error: any) {
    console.error('[admin/meals GET]', error);
    return NextResponse.json({ error: 'Failed to fetch meals.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/meals
 * Body: { mealId: string, status: MealStatus, deliveryStatus?: string, notifyCustomer?: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 403 });
    }

    const body = await req.json();
    const { mealId, status, deliveryStatus, notifyCustomer } = body;

    if (!mealId || !status) {
      return NextResponse.json({ error: 'mealId and status are required.' }, { status: 400 });
    }

    const existingMeal = await getMealById(mealId);
    if (!existingMeal) {
      return NextResponse.json({ error: 'Meal not found.' }, { status: 404 });
    }

    const prevStatus = existingMeal.status;
    const updated = await updateMeal(mealId, {
      status,
      deliveryStatus: deliveryStatus || (status === 'delivered' ? 'delivered' : existingMeal.deliveryStatus),
    });

    // If marked delivered and previously wasn't, increment usedMeals on subscription
    if ((status === 'delivered' || status === 'consumed') && prevStatus !== 'delivered' && prevStatus !== 'consumed') {
      const sub = await redisGet<UserSubscription>(`subscription:${existingMeal.subscriptionId}`);
      if (sub) {
        await redisSet(`subscription:${sub.id}`, {
          ...sub,
          usedMeals: (sub.usedMeals ?? 0) + 1,
        });
      }
    }

    // Optional notification to customer
    if (notifyCustomer) {
      const user = await getUserById(existingMeal.userId);
      const sub = await redisGet<UserSubscription>(`subscription:${existingMeal.subscriptionId}`);
      if (user && sub) {
        sendDeliveryNotificationEmail(
          user.email,
          user.name,
          sub.planName,
          existingMeal.scheduledDate,
          status,
          `Your ${existingMeal.mealType} status has been updated to ${status}.`
        ).catch((e) => console.error(e));

        createNotification(
          user.id,
          status === 'delivered' ? 'meal_delivered' : 'order_delivered',
          `Meal Status: ${status.toUpperCase()}`,
          `Your ${existingMeal.mealType} for ${existingMeal.scheduledDate} is marked as ${status}.`
        ).catch((e) => console.error(e));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Meal updated to ${status}.`,
      meal: updated,
    });
  } catch (error: any) {
    console.error('[admin/meals PATCH]', error);
    return NextResponse.json({ error: 'Failed to update meal.' }, { status: 500 });
  }
}
