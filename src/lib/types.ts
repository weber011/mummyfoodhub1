// Shared types across the app
export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  role: 'customer' | 'admin';
  hasPlacedOrder?: boolean; // tracks first-order eligibility
  welcomeEmailSent?: boolean; // ensures welcome email sent only once
  // Delivery profile
  houseNumber?: string;
  building?: string;
  deliveryInstructions?: string;
  deliveryPreference?: 'doorstep' | 'gate';
};

export type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  extras?: { name: string; price: number }[];
};

export type OrderStatus =
  | 'pending'      // customer placed, awaiting admin approval
  | 'confirmed'    // admin approved
  | 'preparing'    // food being prepared
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

// Legacy alias so existing code using 'placed' still compiles
export type LegacyOrderStatus = OrderStatus | 'placed';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending Approval',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export type Order = {
  id: string;
  orderNumber: string;     // e.g. MFH-20260828-001
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  subscriptionDiscount: number; // 10% subscription benefit applied server-side
  couponCode?: string;
  totalAmount: number;
  status: OrderStatus;
  sector: string;
  address: string;
  landmark?: string;
  deliveryType: string;
  deliveryTime: string;
  paymentMethod: string;
  notes?: string;
  customFields?: Record<string, any>;
  utr?: string;
  idempotencyKey?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  duration: string; // e.g. "Monthly", "6 Meals"
  features: string[];
  recommended?: boolean;
  savings?: string;
  totalMeals?: number;
  isMealBased?: boolean;
  mealType?: 'lunch' | 'dinner' | 'both';
  validityDays?: number; // e.g. 56
};

export type UserSubscription = {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planPrice?: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'paused' | 'expired' | 'cancelled';
  discountPercentage: number; // default 10
  // Meal balance
  totalMeals?: number;
  usedMeals?: number;
  skippedMeals?: number;    // tracks skipped (NOT counted as used)
  expiredMeals?: number;    // meals expired at end of validity
  // Meal type & delivery
  mealType?: 'lunch' | 'dinner' | 'both';
  deliveryPreference?: 'doorstep' | 'gate';
  deliveryInstructions?: string;
  houseNumber?: string;
  building?: string;
  // Reminder idempotency
  reminderSentAt?: string;   // legacy: 3-day reminder
  reminderSent7dAt?: string; // 7-day reminder
  reminderSent1dAt?: string; // 1-day reminder
  createdAt: string;
  // Delivery details (stored at subscription time)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  sector?: string;
  landmark?: string;
  deliveryType?: string;
  deliveryTime?: string;
  notes?: string;
  utr?: string;
  isOffline?: boolean; // true if admin manually added (cash customer)
};

export type SubscriptionRequest = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  planId: string;
  planName: string;
  planPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  // Delivery details
  address: string;
  sector: string;
  landmark?: string;
  deliveryType: string;
  deliveryTime: string;
  notes?: string;
  utr?: string;
  mealType?: 'lunch' | 'dinner' | 'both';
  deliveryPreference?: 'doorstep' | 'gate';
  deliveryInstructions?: string;
  houseNumber?: string;
  building?: string;
};

export type DeliveryStatus = 'delivered' | 'skipped' | 'issue' | 'pending';

export type SubscriptionDelivery = {
  id: string;
  subscriptionId: string;
  userId: string;
  date: string;            // YYYY-MM-DD
  status: DeliveryStatus;
  notes?: string;
  notifyCustomer?: boolean;
  loggedAt: string;        // ISO timestamp when admin logged it
};

export type Coupon = {
  code: string;
  type: 'welcome' | 'flat';
  discount: number;
  minOrderValue: number;
  enabled: boolean;
  description: string;
};

// ── Meal Schedule System ───────────────────────────────────────────

export type MealStatus =
  | 'upcoming'    // 🔵 scheduled for future
  | 'scheduled'   // 🔵 scheduled for today
  | 'delivered'   // 🟢 confirmed delivered
  | 'consumed'    // 🟢 marked as consumed
  | 'skipped'     // 🟡 customer skipped before cutoff
  | 'missed'      // 🔴 not delivered, not skipped (after cutoff passed)
  | 'expired';    // ⚪ subscription expired before delivery

export const MEAL_STATUS_EMOJI: Record<MealStatus, string> = {
  upcoming: '🔵',
  scheduled: '🔵',
  delivered: '🟢',
  consumed: '🟢',
  skipped: '🟡',
  missed: '🔴',
  expired: '⚪',
};

export const MEAL_STATUS_LABELS: Record<MealStatus, string> = {
  upcoming: 'Upcoming',
  scheduled: 'Scheduled',
  delivered: 'Delivered',
  consumed: 'Consumed',
  skipped: 'Skipped',
  missed: 'Missed',
  expired: 'Expired',
};

export type MealSchedule = {
  id: string;
  subscriptionId: string;
  userId: string;
  mealType: 'lunch' | 'dinner';
  scheduledDate: string;      // YYYY-MM-DD
  menu?: string;              // e.g. "Dal + Rice + Roti"
  status: MealStatus;
  skipRequestedAt?: string;   // ISO timestamp when customer skipped
  skipReason?: string;
  deliveryStatus?: 'pending' | 'out_for_delivery' | 'delivered' | 'not_prepared';
  deliveryPreference?: 'doorstep' | 'gate';
  deliveryAddress?: string;
  deliveryInstructions?: string;
  createdAt: string;
  updatedAt: string;
};

export type MealSkip = {
  id: string;
  mealId: string;
  subscriptionId: string;
  userId: string;
  mealType: 'lunch' | 'dinner';
  date: string;               // YYYY-MM-DD
  skippedAt: string;          // ISO timestamp
  reason?: string;
  cutoffTime: string;         // e.g. "09:00" — what the cutoff was at time of skip
};

// ── Admin Settings ─────────────────────────────────────────────────

export type AdminSettings = {
  // Meal times (HH:MM 24h IST)
  lunchTime: string;           // default "13:00"
  lunchSkipCutoff: string;     // default "09:00"
  dinnerTime: string;          // default "20:00"
  dinnerSkipCutoff: string;    // default "16:00"
  // General
  skipCutoffHours: number;     // hours before meal time (default 4)
  deliveryRadius: string;      // default "5-7 km"
  mealReminderMinutesBefore: number; // default 120 (2 hours before meal)
  // Cron notification timing
  reminderEmailHour: number;   // IST hour to send morning reminders (default 8)
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  lunchTime: '13:00',
  lunchSkipCutoff: '09:00',
  dinnerTime: '20:00',
  dinnerSkipCutoff: '16:00',
  skipCutoffHours: 4,
  deliveryRadius: '5-7 km',
  mealReminderMinutesBefore: 120,
  reminderEmailHour: 8,
};

// ── Subscription Balance ────────────────────────────────────────────

export type SubscriptionBalance = {
  totalMeals: number;
  usedMeals: number;
  skippedMeals: number;
  remainingMeals: number;
  expiredMeals: number;
  daysRemaining: number;
  isValid: boolean;
  validityStartDate: string;
  validityEndDate: string;
};

// ── Monthly Report ─────────────────────────────────────────────────

export type MonthlyMealReport = {
  year: number;
  month: number;            // 1-12
  subscriptionId: string;
  planName: string;
  mealType: 'lunch' | 'dinner' | 'both';
  totalScheduled: number;
  delivered: number;
  consumed: number;
  skipped: number;
  missed: number;
  upcoming: number;
  remainingBalance: number; // meals remaining in subscription
  days: MealDayReport[];
};

export type MealDayReport = {
  date: string;             // YYYY-MM-DD
  mealType: 'lunch' | 'dinner';
  status: MealStatus;
  menu?: string;
};

// ── Notifications ─────────────────────────────────────────────────
export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_preparing'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'subscription_activated'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'subscription_rejected'
  | 'new_customer'
  // Meal-related notifications
  | 'meal_reminder'
  | 'meal_skip_confirmed'
  | 'meal_skip_deadline'
  | 'meal_delivered'
  | 'meal_missed'
  | 'food_prep_report'
  | 'admin_skip_alert';

export type Notification = {
  id: string;
  userId: string;   // 'admin' for admin-only notifications
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  subscriptionId?: string;
  mealId?: string;
  read: boolean;
  createdAt: string;
};
