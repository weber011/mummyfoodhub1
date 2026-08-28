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
};

export type UserSubscription = {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  discountPercentage: number; // default 10
  totalMeals?: number;
  usedMeals?: number;
  reminderSentAt?: string;   // idempotency: only send 3-day reminder once
  createdAt: string;
};

export type Coupon = {
  code: string;
  type: 'welcome' | 'flat';
  discount: number;
  minOrderValue: number;
  enabled: boolean;
  description: string;
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
  | 'new_customer';

export type Notification = {
  id: string;
  userId: string;   // 'admin' for admin-only notifications
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
};
