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
  // Separate per-meal delivery addresses
  separateAddresses?: boolean;
  breakfastDelivery?: MealDeliveryAddress;
  lunchDelivery?: MealDeliveryAddress;
  dinnerDelivery?: MealDeliveryAddress;
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

// ── Admin Settings ─────────────────────────────────────────────────

export type AdminSettings = {
  // Meal times (HH:MM 24h IST)
  lunchTime: string;           // default "13:00"
  lunchSkipCutoff: string;     // strictly "04:00" (4:00 AM IST)
  dinnerTime: string;          // default "20:00"
  dinnerSkipCutoff: string;    // strictly "15:00" (3:00 PM IST)
  // General
  skipCutoffHours: number;     // hours before meal time
  deliveryRadius: string;      // default "5-7 km"
  mealReminderMinutesBefore: number; // default 120 (2 hours before meal)
  // Cron notification timing
  reminderEmailHour: number;   // IST hour to send morning reminders (default 8)
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  lunchTime: '13:00',
  lunchSkipCutoff: '04:00', // 4:00 AM IST
  dinnerTime: '20:00',
  dinnerSkipCutoff: '15:00', // 3:00 PM IST
  skipCutoffHours: 4,
  deliveryRadius: '5-7 km',
  mealReminderMinutesBefore: 120,
  reminderEmailHour: 8,
};

export type BasePlanType = 'lunch' | 'dinner' | 'lunch_and_dinner' | 'complete' | 'full';
export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MealDeliveryAddress = {
  address: string;
  sector: string;
  landmark?: string;
  deliveryType?: string; // 'Doorstep' | 'Office Gate' | 'Main Gate of House'
  deliveryTime?: string;
  notes?: string;
};

export type UserSubscription = {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planPrice?: number;
  basePlan?: BasePlanType;
  hasBreakfastAddon?: boolean;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'paused' | 'expired' | 'cancelled';
  discountPercentage: number; // default 10
  validityDays?: number; // 56 for lunch/breakfast, 60 for dinner/complete
  // Global / Legacy Totals
  totalMeals?: number;
  usedMeals?: number;
  skippedMeals?: number;
  expiredMeals?: number;
  transferredMeals?: number;
  // Per-category Breakdown
  breakfastTotalMeals?: number;
  breakfastUsedMeals?: number;
  breakfastSkippedMeals?: number;
  breakfastTransferredMeals?: number;
  lunchTotalMeals?: number;
  lunchUsedMeals?: number;
  lunchSkippedMeals?: number;
  lunchTransferredMeals?: number;
  dinnerTotalMeals?: number;
  dinnerUsedMeals?: number;
  dinnerSkippedMeals?: number;
  dinnerTransferredMeals?: number;
  // Meal type & delivery
  mealType?: 'lunch' | 'dinner' | 'both';
  deliveryPreference?: 'doorstep' | 'gate';
  deliveryInstructions?: string;
  houseNumber?: string;
  building?: string;
  // Reminder idempotency
  reminderSentAt?: string;
  reminderSent7dAt?: string;
  reminderSent1dAt?: string;
  createdAt: string;
  // Customer details
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
  isOffline?: boolean;
  paymentStatus?: 'paid' | 'pending' | 'failed';
  paymentMethod?: string;
  // Separate per-meal delivery addresses
  separateAddresses?: boolean;
  breakfastDelivery?: MealDeliveryAddress;
  lunchDelivery?: MealDeliveryAddress;
  dinnerDelivery?: MealDeliveryAddress;
};

// ── Meal Schedule & Shifting ───────────────────────────────────────

export type MealStatus =
  | 'upcoming'    // 🔵 scheduled for future
  | 'scheduled'   // 🔵 scheduled for today
  | 'available'   // 🔵 available entitlement
  | 'delivered'   // 🟢 confirmed delivered
  | 'consumed'    // 🟢 marked as consumed
  | 'skipped'     // 🟡 customer skipped before cutoff
  | 'transferred' // 🟣 transferred to lunch/dinner
  | 'missed'      // 🔴 not delivered, not skipped
  | 'expired'     // ⚪ subscription expired
  | 'cancelled';  // ⚪ cancelled

export const MEAL_STATUS_EMOJI: Record<MealStatus, string> = {
  upcoming: '🔵',
  scheduled: '🔵',
  available: '🔵',
  delivered: '🟢',
  consumed: '🟢',
  skipped: '🟡',
  transferred: '🟣',
  missed: '🔴',
  expired: '⚪',
  cancelled: '⚪',
};

export const MEAL_STATUS_LABELS: Record<MealStatus, string> = {
  upcoming: 'Upcoming',
  scheduled: 'Scheduled',
  available: 'Available',
  delivered: 'Delivered',
  consumed: 'Consumed',
  skipped: 'Skipped',
  transferred: 'Transferred',
  missed: 'Missed',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export type MealSchedule = {
  id: string;
  subscriptionId: string;
  userId: string;
  mealType: MealType;
  scheduledDate: string;      // YYYY-MM-DD
  menu?: string;              // e.g. "Dal + Rice + Roti"
  status: MealStatus;
  skipRequestedAt?: string;   // ISO timestamp
  skipReason?: string;
  transferredFrom?: 'lunch' | 'dinner' | 'breakfast';
  transferredTo?: 'lunch' | 'dinner' | 'breakfast';
  transferredAt?: string;
  sourceMealId?: string;
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
  mealType: MealType;
  date: string;               // YYYY-MM-DD
  skippedAt: string;          // ISO timestamp
  reason?: string;
  cutoffTime: string;         // e.g. "04:00" or "15:00"
};

export type MealTransfer = {
  id: string;
  customerId: string;
  subscriptionId: string;
  sourceMealType: 'lunch' | 'dinner';
  sourceDate: string;
  targetMealType: 'lunch' | 'dinner';
  targetDate: string;
  createdAt: string;
  status: 'completed' | 'reversed';
  sourceMealId?: string;
  targetMealId?: string;
};

// ── Loyalty System ─────────────────────────────────────────────────

export type LoyaltyRecord = {
  customerId: string;
  email: string;              // Normalized lowercase
  qualifyingMealCount: number;// 0 to 4
  rewardAvailable: boolean;   // true when count reaches 4
  rewardRedeemed: boolean;
  rewardCycle: number;        // Cycle 1, 2, 3...
  lastQualifiedOrder?: string;// ISO timestamp / orderNumber
  totalRewardsRedeemed: number;
  updatedAt: string;
};

// ── Category Meal Summary ──────────────────────────────────────────

export type CategoryMealSummary = {
  total: number;
  consumed: number;
  skipped: number;
  transferred: number;
  remaining: number;
};

// ── Subscription Balance ────────────────────────────────────────────

export type SubscriptionBalance = {
  totalMeals: number;
  usedMeals: number;
  skippedMeals: number;
  transferredMeals: number;
  remainingMeals: number;
  expiredMeals: number;
  daysRemaining: number;
  isValid: boolean;
  validityStartDate: string;
  validityEndDate: string;
  breakfast?: CategoryMealSummary;
  lunch?: CategoryMealSummary;
  dinner?: CategoryMealSummary;
};

// ── Monthly Report ─────────────────────────────────────────────────

export type MonthlyMealReport = {
  year: number;
  month: number;            // 1-12
  subscriptionId: string;
  planName: string;
  subscriptionPeriod: {
    startDate: string;
    endDate: string;
  };
  breakfast?: CategoryMealSummary & { scheduled: number };
  lunch?: CategoryMealSummary & { scheduled: number };
  dinner?: CategoryMealSummary & { scheduled: number };
  totalEligibleMeals: number;
  utilizationPercentage: number;
  days: MealDayReport[];
};

export type MealDayReport = {
  date: string;             // YYYY-MM-DD
  mealType: MealType;
  status: MealStatus;
  menu?: string;
  note?: string;
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
  | 'meal_reminder'
  | 'meal_skip_confirmed'
  | 'meal_skip_deadline'
  | 'meal_transfer_confirmed'
  | 'meal_delivered'
  | 'meal_missed'
  | 'food_prep_report'
  | 'admin_skip_alert'
  | 'admin_transfer_alert'
  | 'loyalty_reward_unlocked';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  subscriptionId?: string;
  mealId?: string;
  read: boolean;
  createdAt: string;
};
