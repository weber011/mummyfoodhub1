import { Resend } from 'resend';
import type { Order, UserSubscription } from './types';

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL || 'Mummy Food Hub <onboarding@resend.dev>';
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'mummyfoodhub@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mummyfoodhub.online';

// ── Base styles ──────────────────────────────────────────────────
const emailBase = (body: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Mummy Food Hub</title>
</head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:'Poppins',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:24px 0;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e6dfd3;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#B23A3A;padding:24px 32px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">🍱 Mummy Food Hub</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Homemade Food • Less Oil • Less Masala • Noida</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f2efe9;padding:16px 32px;text-align:center;border-top:1px solid #e6dfd3;">
            <p style="margin:0;color:#7a6e65;font-size:11px;">© 2026 Mummy Food Hub • Sector 110, Noida</p>
            <p style="margin:4px 0 0;color:#7a6e65;font-size:11px;">
              <a href="${APP_URL}" style="color:#B23A3A;">mummyfoodhub.online</a> • WhatsApp: +91 70656 65988
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

async function sendEmail(to: string, subject: string, html: string) {
  const client = getResendClient();
  if (!client) {
    console.warn('[email] RESEND_API_KEY not set — email skipped');
    return;
  }
  const { error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) console.error('[email] send failed:', error);
}

// ── Welcome Email ───────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:18px;font-weight:700;margin:0 0 8px;">Welcome to Mummy Food Hub, ${name}! 🎉</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Thank you for creating an account with us. We look forward to serving you fresh, wholesome homemade meals in Noida!</p>
    <a href="${APP_URL}/menu" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">Explore Daily Menu</a>
  `);
  await sendEmail(to, 'Welcome to Mummy Food Hub! 🍱', html);
}

// ── OTP Email ──────────────────────────────────────────────────
export async function sendOtpEmail(to: string, otp: string, name?: string) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:18px;font-weight:700;margin:0 0 8px;">Hello${name ? `, ${name}` : ''}! 👋</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 24px;">Your one-time login code for <strong>Mummy Food Hub</strong> is:</p>
    <div style="background:#FDFBF7;border:2px dashed #B23A3A;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#B23A3A;">${otp}</span>
    </div>
    <p style="color:#7a6e65;font-size:13px;margin:0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  `);
  await sendEmail(to, 'Your OTP — Mummy Food Hub', html);
}

// ── Customer Order Placed ───────────────────────────────────────
export async function sendOrderPlacedEmail(order: Order) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">Order Placed! 🍱</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${order.customerName}, we received your order <strong>${order.orderNumber}</strong>. We're awaiting confirmation from our kitchen!</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:10px;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#B23A3A;">Total Amount: ₹${order.totalAmount}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#4b5563;">Delivery to: ${order.address}, Sector ${order.sector}</p>
    </div>
    <a href="${APP_URL}/account/orders/${order.id}" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">View Order Status</a>
  `);
  await sendEmail(order.customerEmail, `Order Received — ${order.orderNumber}`, html);
}

// ── New Order: Owner Notification ──────────────────────────────
export async function sendNewOrderNotificationEmail(order: Order) {
  const itemsList = Array.isArray(order.items)
    ? order.items
    : typeof order.items === 'string'
      ? (() => { try { return JSON.parse(order.items); } catch { return []; } })()
      : [];

  const itemsHtml = itemsList
    .map((i: any) => {
      const extras = Array.isArray(i.extras) ? i.extras : [];
      const sabjis = extras.filter((e: any) => e.price === 0).map((e: any) => e.name).join(', ');
      const addons = extras.filter((e: any) => e.price > 0).map((e: any) => `+ ${e.name} (₹${e.price})`).join(', ');
      const subDetails = [
        sabjis ? `<div style="font-size:12px;color:#c2410c;margin-top:2px;">🍛 Sabjis: ${sabjis}</div>` : '',
        addons ? `<div style="font-size:12px;color:#15803d;margin-top:2px;">🥗 Add-ons: ${addons}</div>` : ''
      ].filter(Boolean).join('');

      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece5;">
          <strong>${i.quantity}× ${i.title}</strong>
          ${subDetails}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece5;text-align:right;font-weight:700;vertical-align:top;">₹${(i.price || 0) * (i.quantity || 1)}</td>
      </tr>`;
    })
    .join('');

  const customFieldsHtml = order.customFields && Object.keys(order.customFields).length > 0
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px;border-radius:8px;font-size:13px;margin:0 0 20px;">
        <strong style="color:#1e40af;">Custom Order Details:</strong><br/>
        ${Object.entries(order.customFields).map(([k, v]) => `<span>• <strong>${k}:</strong> ${String(v)}</span><br/>`).join('')}
       </div>`
    : '';

  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">🔔 New Order Received!</p>
    <p style="color:#B23A3A;font-size:16px;font-weight:700;margin:0 0 24px;">${order.orderNumber}</p>
    
    <div style="background:#fff8f0;border-left:4px solid #B23A3A;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;"><strong>Customer:</strong> ${order.customerName}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Phone:</strong> ${order.customerPhone}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Address:</strong> ${order.address}, Sector ${order.sector}</p>
      ${order.landmark ? `<p style="margin:0 0 4px;font-size:14px;"><strong>Landmark:</strong> ${order.landmark}</p>` : ''}
      <p style="margin:0 0 4px;font-size:14px;"><strong>Delivery Time:</strong> ${order.deliveryTime}</p>
      <p style="margin:0;font-size:14px;"><strong>Payment:</strong> ${order.paymentMethod}${order.utr ? ` (UTR: ${order.utr})` : ''}</p>
    </div>

    ${customFieldsHtml}
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${itemsHtml}</table>
    <p style="font-size:20px;font-weight:900;color:#B23A3A;text-align:right;margin:0 0 24px;">Total: ₹${order.totalAmount}</p>
    ${order.notes ? `<p style="background:#fff3cd;padding:12px;border-radius:8px;font-size:13px;margin:0 0 20px;">📝 <strong>Note:</strong> ${order.notes}</p>` : ''}
    
    <a href="${APP_URL}/admin" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;">✅ Approve Order in Dashboard</a>
  `);
  await sendEmail(OWNER_EMAIL, `🆕 New Order ${order.orderNumber} — ₹${order.totalAmount}`, html);
}

// ── Order Confirmed: Customer Notification ─────────────────────
export async function sendOrderConfirmedEmail(order: Order) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">✅ Order Confirmed!</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${order.customerName}, your order has been confirmed by the kitchen!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:10px;margin:0 0 20px;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#15803d;">${order.orderNumber}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#166534;">Total: ₹${order.totalAmount} • ${order.paymentMethod}</p>
    </div>
    <p style="font-size:14px;color:#5a534d;">We'll notify you when your food is out for delivery. Estimated time: <strong>${order.deliveryTime}</strong>.</p>
    <a href="${APP_URL}/account/orders/${order.id}" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;margin-top:20px;">Track My Order</a>
  `);
  await sendEmail(order.customerEmail, `Order Confirmed — ${order.orderNumber}`, html);
}

// ── Order Status Update ────────────────────────────────────────
export async function sendOrderStatusUpdateEmail(order: Order, statusLabel: string) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">📦 Order Update</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${order.customerName}, here's an update on your order:</p>
    <div style="background:#fff8f0;border:1px solid #fed7aa;padding:16px;border-radius:10px;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#B23A3A;">${order.orderNumber}</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:900;color:#2d2926;">${statusLabel}</p>
    </div>
    <a href="${APP_URL}/account/orders/${order.id}" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">View Order Details</a>
  `);
  await sendEmail(order.customerEmail, `Order Update: ${statusLabel} — ${order.orderNumber}`, html);
}

// ── Subscription Request: Owner Notification ───────────────────
export async function sendSubscriptionRequestEmail(request: {
  userId: string; name: string; email: string; phone: string;
  planName: string; planId: string; planPrice: number;
  address?: string; sector?: string; landmark?: string;
  deliveryType?: string; deliveryTime?: string; notes?: string; utr?: string;
}) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">🌟 New Subscription Request!</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">A customer wants to subscribe. Please review and activate from the admin dashboard.</p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:0 8px 8px 0;margin:0 0 16px;">
      <p style="margin:0 0 4px;font-size:14px;"><strong>Name:</strong> ${request.name}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Email:</strong> ${request.email}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Phone:</strong> ${request.phone}</p>
      <p style="margin:0;font-size:14px;"><strong>Plan:</strong> ${request.planName} — ₹${request.planPrice}</p>
    </div>
    ${request.address ? `
    <div style="background:#fff8f0;border-left:4px solid #f97316;padding:16px;border-radius:0 8px 8px 0;margin:0 0 16px;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#c2410c;">Delivery Details</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Address:</strong> ${request.address}, Sector ${request.sector}</p>
      ${request.landmark ? `<p style="margin:0 0 4px;font-size:14px;"><strong>Landmark:</strong> ${request.landmark}</p>` : ''}
      <p style="margin:0 0 4px;font-size:14px;"><strong>Delivery Type:</strong> ${request.deliveryType}</p>
      <p style="margin:0;font-size:14px;"><strong>Delivery Time:</strong> ${request.deliveryTime}</p>
    </div>` : ''}
    ${request.utr ? `<div style="background:#f5f3ff;border:1px solid #c4b5fd;padding:12px;border-radius:8px;margin:0 0 16px;font-size:14px;"><strong>💳 UTR / Transaction ID:</strong> <span style="font-family:monospace;font-weight:900;color:#7c3aed;">${request.utr}</span></div>` : ''}
    ${request.notes ? `<p style="background:#fff3cd;padding:12px;border-radius:8px;font-size:13px;margin:0 0 16px;">📝 <strong>Notes:</strong> ${request.notes}</p>` : ''}
    <a href="${APP_URL}/admin" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">Activate in Admin Dashboard</a>
  `);
  await sendEmail(OWNER_EMAIL, `🌟 Subscription Request — ${request.name} (${request.planName})`, html);
}

// ── Subscription Activated: Customer Notification ─────────────
export async function sendSubscriptionActivatedEmail(to: string, name: string, sub: UserSubscription) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">🎉 Subscription Activated!</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${name}, your subscription is now active. Enjoy 10% off on all orders!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:10px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#15803d;">${sub.planName}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#166534;">Start: ${new Date(sub.startDate).toLocaleDateString('en-IN')}</p>
      <p style="margin:0;font-size:13px;color:#166534;">End: ${new Date(sub.endDate).toLocaleDateString('en-IN')}</p>
    </div>
    <a href="${APP_URL}/account/subscription" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">View My Subscription</a>
  `);
  await sendEmail(to, 'Your Subscription is Active — Mummy Food Hub', html);
}

// ── Subscription Expiring Reminder ────────────────────────────
export async function sendSubscriptionExpiringEmail(to: string, name: string, sub: UserSubscription, daysLeft: number) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">⏰ Subscription Expiring Soon</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${name}, your <strong>${sub.planName}</strong> expires in <strong>${daysLeft} day(s)</strong>. Renew to keep enjoying your discount!</p>
    <a href="${APP_URL}/subscription" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">Renew My Subscription</a>
  `);
  await sendEmail(to, `⏰ Your Subscription Expires in ${daysLeft} Day(s) — Mummy Food Hub`, html);
}

// ── Subscription Expired ───────────────────────────────────────
export async function sendSubscriptionExpiredEmail(to: string, name: string, sub: UserSubscription) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">Your Subscription Has Ended</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${name}, your <strong>${sub.planName}</strong> has expired. Subscribe again to continue getting 10% off!</p>
    <a href="${APP_URL}/subscription" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">Renew Now</a>
  `);
  await sendEmail(to, 'Subscription Expired — Mummy Food Hub', html);
}

// ── Daily Delivery Notification: Customer ─────────────────────
export async function sendDeliveryNotificationEmail(
  to: string, name: string, planName: string,
  date: string, status: string, notes: string,
) {
  const statusEmoji = status === 'delivered' ? '✅' : status === 'skipped' ? '⏸️' : '❌';
  const statusText = status === 'delivered' ? 'Delivered' : status === 'skipped' ? 'Skipped for Today' : 'Issue Reported';
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">${statusEmoji} Delivery Update</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${name}, here is today's delivery update for your <strong>${planName}</strong>.</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:10px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">Date: ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="margin:0;font-size:22px;font-weight:900;color:#2d2926;">${statusText}</p>
      ${notes ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;">${notes}</p>` : ''}
    </div>
    <a href="${APP_URL}/account/subscription" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">View My Subscription</a>
  `);
  await sendEmail(to, `${statusEmoji} Delivery Update — ${new Date(date).toLocaleDateString('en-IN')}`, html);
}

// ── Offline Subscriber Welcome ─────────────────────────────────
export async function sendOfflineSubscriberWelcomeEmail(to: string, name: string, sub: UserSubscription) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">Welcome to Mummy Food Hub! 🍱</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Hi ${name}, your monthly meal subscription has been activated. Get ready to enjoy fresh homemade food every day!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:10px;margin:0 0 16px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#15803d;">${sub.planName}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#166534;">Start: ${new Date(sub.startDate).toLocaleDateString('en-IN')}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#166534;">End: ${new Date(sub.endDate).toLocaleDateString('en-IN')}</p>
      ${sub.deliveryTime ? `<p style="margin:4px 0 0;font-size:13px;color:#166534;"><strong>Delivery:</strong> ${sub.deliveryTime} • ${sub.deliveryType}</p>` : ''}
    </div>
    <p style="font-size:13px;color:#5a534d;margin:0 0 20px;">For any queries, reach us on WhatsApp: <strong>+91 70656 65988</strong></p>
    <a href="${APP_URL}/subscription" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">View Subscription Plans</a>
  `);
  await sendEmail(to, 'Welcome! Your Mummy Food Hub Subscription is Active 🎉', html);
}

// ── Aliases ────────────────────────────────────────────────────
export const sendOwnerNewOrderEmail = sendNewOrderNotificationEmail;
export const sendOrderStatusEmail = sendOrderStatusUpdateEmail;

// ══════════════════════════════════════════════════════════════
// NEW SUBSCRIPTION MANAGEMENT EMAILS
// ══════════════════════════════════════════════════════════════

// ── Full Subscription Activation Email (per spec) ─────────────
export async function sendSubscriptionActivatedFullEmail(
  to: string,
  name: string,
  sub: {
    planName: string;
    planPrice: number;
    totalMeals: number;
    mealType: 'lunch' | 'dinner' | 'both';
    startDate: string;
    endDate: string;
    validityDays?: number;
    lunchSkipCutoff?: string;
    dinnerSkipCutoff?: string;
  }
) {
  const mealLabel = sub.mealType === 'dinner' ? 'Dinner' : 'Lunch';
  const mealsLabel = sub.mealType === 'dinner' ? 'Dinners' : 'Lunches';
  const validityDays = sub.validityDays ?? 56;
  const cutoffNote = sub.mealType === 'dinner'
    ? `Dinner time: 8:00 PM | Skip cutoff: ${sub.dinnerSkipCutoff ?? '4:00 PM'}`
    : `Lunch time: 1:00 PM | Skip cutoff: ${sub.lunchSkipCutoff ?? '9:00 AM'}`;

  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">Your ${mealLabel} Subscription is Active ❤️</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 24px;">Dear ${name}, thank you for choosing Mummy Food Hub! We're happy to confirm that your ${mealLabel} Subscription has been successfully activated.</p>
    
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:20px;border-radius:12px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:700;">🍱 SUBSCRIPTION DETAILS</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Plan:</strong> ${sub.planName}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Amount Paid:</strong> ₹${sub.planPrice}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Total Meals:</strong> ${sub.totalMeals} ${mealsLabel}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Subscription Validity:</strong> ${validityDays} Days from purchase date</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Valid From:</strong> ${new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Valid Until:</strong> ${new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <div style="background:#fff8f0;border-left:4px solid #f97316;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#c2410c;font-weight:700;">🔄 UNUSED MEALS CARRY FORWARD</p>
      <p style="margin:0;font-size:13px;color:#5a534d;">If you have unused meals at the end of a month, they carry forward within your ${validityDays}-day validity period. After the validity ends, unused meals expire.</p>
    </div>

    <div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;color:#0369a1;font-weight:700;">✨ PLAN BENEFITS</p>
      <p style="margin:2px 0;font-size:13px;">• Twice a week, extra rotis or raita once a week</p>
      <p style="margin:2px 0;font-size:13px;">• Twice a month, choose any sabji of your preference</p>
      <p style="margin:2px 0;font-size:13px;">• Daily changing menu</p>
      <p style="margin:2px 0;font-size:13px;">• Reliable service for office &amp; home</p>
    </div>

    <div style="background:#fefce8;border-left:4px solid #eab308;padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#854d0e;font-weight:700;">📌 IMPORTANT — SKIP POLICY</p>
      <p style="margin:0 0 4px;font-size:13px;color:#5a534d;">${cutoffNote}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#5a534d;">You must skip from your dashboard <strong>before the cutoff time</strong>. After the cutoff, the meal cannot be skipped for that day. Skipped meals are NOT deducted from your balance.</p>
    </div>

    <a href="${APP_URL}/dashboard" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;">View My Dashboard 🍱</a>
    
    <p style="margin:20px 0 0;font-size:13px;color:#7a6e65;text-align:center;">Har Bite Mein Maa Ka Pyaar ❤️</p>
  `);
  await sendEmail(to, `Your Mummy Food Hub ${mealLabel} Subscription is Active ❤️`, html);
}

// ── Skip Confirmation Email ─────────────────────────────────────
export async function sendSkipConfirmationEmail(
  to: string,
  name: string,
  details: {
    mealType: 'lunch' | 'dinner';
    date: string;
    menu?: string;
    totalMeals: number;
    usedMeals: number;
    skippedMeals: number;
    remainingMeals: number;
  }
) {
  const mealLabel = details.mealType === 'dinner' ? 'Dinner' : 'Lunch';
  const dateFormatted = new Date(details.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">Your Meal Has Been Skipped ❤️</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Dear ${name}, your meal for today has been successfully skipped.</p>
    
    <div style="background:#fefce8;border:1px solid #fde047;padding:16px;border-radius:10px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;"><strong>Meal:</strong> ${mealLabel}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Date:</strong> ${dateFormatted}</p>
      ${details.menu ? `<p style="margin:4px 0;font-size:14px;"><strong>Menu:</strong> ${details.menu}</p>` : ''}
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:10px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#15803d;font-weight:700;">✅ YOUR MEAL HAS NOT BEEN DEDUCTED</p>
      <div style="display:flex;justify-content:space-between;gap:8px;margin:0 0 4px;">
        <div style="flex:1;background:#fff;border-radius:8px;padding:10px;">
          <p style="margin:0;font-size:11px;color:#6b7280;">Total Meals</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#2d2926;">${details.totalMeals}</p>
        </div>
        <div style="flex:1;background:#fff;border-radius:8px;padding:10px;">
          <p style="margin:0;font-size:11px;color:#6b7280;">Meals Used</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#B23A3A;">${details.usedMeals}</p>
        </div>
        <div style="flex:1;background:#fff;border-radius:8px;padding:10px;">
          <p style="margin:0;font-size:11px;color:#6b7280;">Skipped</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#eab308;">${details.skippedMeals}</p>
        </div>
        <div style="flex:1;background:#fff;border-radius:8px;padding:10px;">
          <p style="margin:0;font-size:11px;color:#6b7280;">Remaining</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#15803d;">${details.remainingMeals}</p>
        </div>
      </div>
    </div>

    <p style="font-size:13px;color:#5a534d;margin:0 0 20px;">Thank you for informing us in advance and helping us reduce food waste. Your remaining ${details.remainingMeals} meals are available throughout your subscription validity period.</p>

    <a href="${APP_URL}/dashboard" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">View My Dashboard</a>
    <p style="margin:16px 0 0;font-size:12px;color:#7a6e65;text-align:center;">Warm Regards, Mummy Food Hub ❤️</p>
  `);
  await sendEmail(to, 'Your Meal Has Been Skipped Successfully ❤️', html);
}

// ── Meal Reminder Email ────────────────────────────────────────
export async function sendMealReminderEmail(
  to: string,
  name: string,
  details: {
    mealType: 'lunch' | 'dinner';
    menu?: string;
    deliveryPreference?: string;
    expectedTime: string;
    cutoffTime: string;
    cutoffDisplay: string; // e.g. "9:00 AM"
    dashboardUrl?: string;
  }
) {
  const mealLabel = details.mealType === 'dinner' ? 'Dinner' : 'Lunch';
  const emoji = details.mealType === 'dinner' ? '🍽️' : '🍱';
  const deliveryPref = details.deliveryPreference === 'doorstep' ? 'Doorstep Delivery' : 'Gate Delivery';

  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">${emoji} Your ${mealLabel} is Coming Today!</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Dear ${name}, your ${mealLabel} from Mummy Food Hub is scheduled for today.</p>
    
    <div style="background:#fff8f0;border:1px solid #fed7aa;padding:16px;border-radius:10px;margin:0 0 20px;">
      ${details.menu ? `<p style="margin:0 0 4px;font-size:14px;"><strong>${emoji} Today's Menu:</strong> ${details.menu}</p>` : ''}
      <p style="margin:4px 0;font-size:14px;"><strong>🚚 Delivery:</strong> ${deliveryPref}</p>
      <p style="margin:4px 0 0;font-size:14px;"><strong>⏰ Expected Time:</strong> ${details.expectedTime}</p>
    </div>

    <div style="background:#fefce8;border:1px solid #fde047;padding:14px;border-radius:10px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#854d0e;">⚠️ If you need to <strong>skip today's ${mealLabel}</strong>, please do so from your dashboard before <strong>${details.cutoffDisplay}</strong>. After this time, the meal cannot be skipped.</p>
    </div>
    
    <a href="${details.dashboardUrl ?? APP_URL + '/dashboard'}" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;">Skip or View Dashboard</a>
    <p style="margin:16px 0 0;font-size:12px;color:#7a6e65;text-align:center;">Har Bite Mein Maa Ka Pyaar ❤️ — Mummy Food Hub</p>
  `);
  await sendEmail(to, `Your Mummy Food Hub ${mealLabel} is Coming Today ${emoji}`, html);
}

// ── Skip Deadline Reminder Email ────────────────────────────────
export async function sendSkipDeadlineEmail(
  to: string,
  name: string,
  details: { mealType: 'lunch' | 'dinner'; cutoffDisplay: string; minutesLeft: number }
) {
  const mealLabel = details.mealType === 'dinner' ? 'Dinner' : 'Lunch';
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">⏰ Skip Deadline Approaching</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Dear ${name}, the skip window for today's <strong>${mealLabel}</strong> is closing soon.</p>
    
    <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:10px;margin:0 0 20px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:900;color:#B23A3A;">⏰ ${details.cutoffDisplay}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#7a6e65;">Skip deadline for today's ${mealLabel}</p>
    </div>

    <p style="font-size:13px;color:#5a534d;margin:0 0 20px;">If you do not want today's ${mealLabel}, please skip it from your dashboard before the deadline. After this time, the meal cannot be skipped.</p>
    
    <a href="${APP_URL}/dashboard" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;">Skip Today's ${mealLabel}</a>
    <p style="margin:16px 0 0;font-size:12px;color:#7a6e65;text-align:center;">Warm Regards, Mummy Food Hub ❤️</p>
  `);
  await sendEmail(to, `⏰ Skip Deadline: ${details.cutoffDisplay} for Today's ${mealLabel}`, html);
}

// ── 7-Day Expiry Reminder ───────────────────────────────────────
export async function sendSubscriptionExpiry7dEmail(
  to: string, name: string,
  sub: { planName: string; endDate: string; totalMeals?: number; usedMeals?: number; skippedMeals?: number }
) {
  const remaining = Math.max(0, (sub.totalMeals ?? 0) - (sub.usedMeals ?? 0));
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">⏰ Subscription Expiring in 7 Days</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Dear ${name}, your <strong>${sub.planName}</strong> expires in <strong>7 days</strong>. Please use your remaining meals before they expire.</p>
    
    <div style="background:#fff8f0;border:1px solid #fed7aa;padding:16px;border-radius:10px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;"><strong>Expiry Date:</strong> ${new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      ${sub.totalMeals ? `<p style="margin:4px 0;font-size:14px;"><strong>Total Meals:</strong> ${sub.totalMeals}</p>` : ''}
      ${sub.usedMeals !== undefined ? `<p style="margin:4px 0;font-size:14px;"><strong>Meals Used:</strong> ${sub.usedMeals}</p>` : ''}
      <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:#B23A3A;"><strong>Meals Remaining:</strong> ${remaining}</p>
    </div>
    
    <a href="${APP_URL}/subscription" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">Renew My Subscription</a>
  `);
  await sendEmail(to, '⏰ Your Subscription Expires in 7 Days — Mummy Food Hub', html);
}

// ── 1-Day Expiry Reminder ────────────────────────────────────────
export async function sendSubscriptionExpiry1dEmail(
  to: string, name: string,
  sub: { planName: string; endDate: string; totalMeals?: number; usedMeals?: number }
) {
  const remaining = Math.max(0, (sub.totalMeals ?? 0) - (sub.usedMeals ?? 0));
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">🚨 Subscription Expires Tomorrow!</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">Dear ${name}, your <strong>${sub.planName}</strong> expires <strong>tomorrow</strong>. You have <strong>${remaining} meal(s)</strong> remaining.</p>
    
    <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:10px;margin:0 0 20px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:900;color:#B23A3A;">${remaining} Meals Remaining</p>
      <p style="margin:8px 0 0;font-size:13px;color:#7a6e65;">Expires on ${new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    
    <a href="${APP_URL}/subscription" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">Renew Now</a>
    <p style="margin:16px 0 0;font-size:12px;color:#7a6e65;text-align:center;">Warm Regards, Mummy Food Hub ❤️</p>
  `);
  await sendEmail(to, '🚨 Your Subscription Expires Tomorrow — Mummy Food Hub', html);
}

// ── Admin Skip Notification ──────────────────────────────────────
export async function sendAdminSkipNotificationEmail(details: {
  customerName: string;
  customerPhone?: string;
  mealType: 'lunch' | 'dinner';
  date: string;
  subscriptionId: string;
  planName: string;
  remainingMeals: number;
  deliveryPreference?: string;
}) {
  const mealLabel = details.mealType === 'dinner' ? 'Dinner' : 'Lunch';
  const dateFormatted = new Date(details.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">🟡 NEW MEAL SKIP</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">A customer has skipped today's meal. Update the food preparation count accordingly.</p>
    
    <div style="background:#fefce8;border-left:4px solid #eab308;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;"><strong>Customer:</strong> ${details.customerName}</p>
      ${details.customerPhone ? `<p style="margin:0 0 4px;font-size:14px;"><strong>Phone:</strong> ${details.customerPhone}</p>` : ''}
      <p style="margin:0 0 4px;font-size:14px;"><strong>Meal:</strong> ${mealLabel}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Date:</strong> ${dateFormatted}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Plan:</strong> ${details.planName}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Subscription ID:</strong> <span style="font-family:monospace;">${details.subscriptionId}</span></p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Remaining Meals:</strong> ${details.remainingMeals}</p>
      ${details.deliveryPreference ? `<p style="margin:0;font-size:14px;"><strong>Delivery:</strong> ${details.deliveryPreference}</p>` : ''}
    </div>
    
    <a href="${APP_URL}/admin" style="display:block;background:#B23A3A;color:#fff;font-weight:700;text-align:center;padding:14px;border-radius:10px;text-decoration:none;">View Admin Dashboard</a>
  `);
  await sendEmail(OWNER_EMAIL, `🟡 Meal Skip — ${details.customerName} (${mealLabel} on ${details.date})`, html);
}

