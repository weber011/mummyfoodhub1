// Shared types across the app
export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  role: 'customer' | 'admin';
  hasPlacedOrder?: boolean; // tracks first-order eligibility
};

export type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  extras?: { name: string; price: number }[];
};

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  status: OrderStatus;
  sector: string;
  address: string;
  deliveryType: string;
  deliveryTime: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  totalMeals?: number;
  usedMeals?: number;
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
