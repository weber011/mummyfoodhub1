import { Resend } from 'resend';
import type { Order, UserSubscription } from './types';

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = 'Mummy Food Hub <onboarding@resend.dev>';
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
  const itemsHtml = order.items
    .map(i => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0ece5;">${i.quantity}× ${i.title}</td><td style="padding:8px 0;border-bottom:1px solid #f0ece5;text-align:right;font-weight:700;">₹${i.price * i.quantity}</td></tr>`)
    .join('');

  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">🔔 New Order Received!</p>
    <p style="color:#B23A3A;font-size:16px;font-weight:700;margin:0 0 24px;">${order.orderNumber}</p>
    
    <div style="background:#fff8f0;border-left:4px solid #B23A3A;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;"><strong>Customer:</strong> ${order.customerName}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Phone:</strong> ${order.customerPhone}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Address:</strong> ${order.address}, Sector ${order.sector}</p>
      ${order.landmark ? `<p style="margin:0 0 4px;font-size:14px;"><strong>Landmark:</strong> ${order.landmark}</p>` : ''}
      <p style="margin:0 0 4px;font-size:14px;"><strong>Delivery Time:</strong> ${order.deliveryTime}</p>
      <p style="margin:0;font-size:14px;"><strong>Payment:</strong> ${order.paymentMethod}</p>
    </div>
    
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
}) {
  const html = emailBase(`
    <p style="color:#2d2926;font-size:20px;font-weight:900;margin:0 0 4px;">🌟 New Subscription Request!</p>
    <p style="color:#5a534d;font-size:14px;margin:0 0 20px;">A customer wants to subscribe. Please review and activate from the admin dashboard.</p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;"><strong>Name:</strong> ${request.name}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Email:</strong> ${request.email}</p>
      <p style="margin:0 0 4px;font-size:14px;"><strong>Phone:</strong> ${request.phone}</p>
      <p style="margin:0;font-size:14px;"><strong>Plan:</strong> ${request.planName} — ₹${request.planPrice}</p>
    </div>
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

// ── Aliases ────────────────────────────────────────────────────
export const sendOwnerNewOrderEmail = sendNewOrderNotificationEmail;
export const sendOrderStatusEmail = sendOrderStatusUpdateEmail;
