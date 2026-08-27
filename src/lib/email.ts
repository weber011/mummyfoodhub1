import nodemailer from 'nodemailer';
import type { Order, UserSubscription } from './types';

function getTransporter() {
  const user = process.env.GMAIL_USER ?? 'mummyfoodhub@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) {
    console.warn('[email] GMAIL_APP_PASSWORD not set — emails will not send');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: pass ?? '' },
  });
}

const FROM = '"Mummy Food Hub" <mummyfoodhub@gmail.com>';
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'mummyfoodhub@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mummyfoodhub.vercel.app';

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
</html>`;

async function send(to: string, subject: string, html: string) {
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) {
    console.warn(`[email] Skipping email to ${to} — GMAIL_APP_PASSWORD not set`);
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error('[email] Failed to send:', (err as Error).message);
    // Never throw — email failure must not break main flow
  }
}

// ── 1. OTP Email ──────────────────────────────────────────────────
export async function sendOtpEmail(to: string, otp: string, name?: string) {
  const html = emailBase(`
    <p style="margin:0 0 8px;color:#3D261D;font-size:18px;font-weight:700;">Your One-Time Password</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${name ?? 'there'}! Use the code below to sign in to Mummy Food Hub.</p>
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#FFF3F3;border:2px dashed #B23A3A;border-radius:12px;padding:20px 40px;">
        <p style="margin:0;font-size:38px;font-weight:800;color:#B23A3A;letter-spacing:10px;">${otp}</p>
      </div>
      <p style="margin:16px 0 0;color:#7a6e65;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
    <p style="margin:24px 0 0;color:#7a6e65;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `);
  await send(to, 'Mummy Food Hub — Your Login OTP', html);
}

// ── 2. Welcome Email (new user only) ─────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  const html = emailBase(`
    <p style="margin:0 0 8px;color:#3D261D;font-size:22px;font-weight:700;">Welcome to Mummy Food Hub! ❤️</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hello <strong>${name}</strong>, we're so happy to have you here!</p>
    <div style="background:#FFF8F0;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #B23A3A;">
      <p style="margin:0 0 8px;color:#3D261D;font-size:14px;font-weight:600;">🏡 What is Mummy Food Hub?</p>
      <p style="margin:0;color:#7a6e65;font-size:13px;line-height:1.6;">
        We deliver fresh, homemade food with less oil and less masala — just the way your mummy makes it!
        Based in Sector 110, Noida, we deliver within a 5–7 km radius.
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/menu" style="display:inline-block;background:#B23A3A;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Browse Our Menu →</a>
    </div>
    <div style="background:#F0FFF4;border-radius:8px;padding:16px;margin-top:16px;">
      <p style="margin:0;color:#3D261D;font-size:13px;font-weight:600;">💳 Subscription Benefits</p>
      <p style="margin:6px 0 0;color:#7a6e65;font-size:12px;">Subscribe to any plan and enjoy a flat <strong>10% discount</strong> on every order!</p>
      <a href="${APP_URL}/subscription" style="color:#B23A3A;font-size:12px;font-weight:600;">View Subscription Plans →</a>
    </div>
    <p style="margin:24px 0 0;color:#7a6e65;font-size:12px;">Need help? Email us at <a href="mailto:mummyfoodhub@gmail.com" style="color:#B23A3A;">mummyfoodhub@gmail.com</a></p>
  `);
  await send(to, 'Welcome to Mummy Food Hub ❤️', html);
}

// ── 3. Owner New Order Notification ──────────────────────────────
export async function sendOwnerNewOrderEmail(order: Order) {
  const itemLines = order.items.map(
    (i) => `<tr>
      <td style="padding:5px 0;color:#3D261D;font-size:13px;">${i.quantity}× ${i.title}</td>
      <td style="padding:5px 0;color:#B23A3A;font-size:13px;text-align:right;font-weight:600;">₹${i.price * i.quantity}</td>
    </tr>`
  ).join('');

  const html = emailBase(`
    <div style="background:#FFF3F3;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:4px solid #B23A3A;">
      <p style="margin:0;color:#B23A3A;font-size:16px;font-weight:800;">🔔 NEW ORDER RECEIVED</p>
      <p style="margin:4px 0 0;color:#3D261D;font-size:20px;font-weight:700;">${order.orderNumber}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr><td style="color:#7a6e65;font-size:12px;padding-bottom:4px;">CUSTOMER</td></tr>
      <tr><td style="color:#3D261D;font-size:14px;font-weight:600;padding-bottom:2px;">${order.customerName}</td></tr>
      <tr><td style="color:#7a6e65;font-size:13px;padding-bottom:2px;">📞 ${order.customerPhone}</td></tr>
      <tr><td style="color:#7a6e65;font-size:13px;padding-bottom:2px;">✉️ ${order.customerEmail}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr><td style="color:#7a6e65;font-size:12px;padding-bottom:4px;border-top:1px solid #e6dfd3;padding-top:12px;">DELIVERY ADDRESS</td></tr>
      <tr><td style="color:#3D261D;font-size:13px;">${order.address}, Sector ${order.sector}</td></tr>
      ${order.landmark ? `<tr><td style="color:#7a6e65;font-size:12px;">Landmark: ${order.landmark}</td></tr>` : ''}
      <tr><td style="color:#7a6e65;font-size:12px;">Type: ${order.deliveryType} • Time: ${order.deliveryTime}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr><td colspan="2" style="color:#7a6e65;font-size:12px;padding-bottom:8px;border-top:1px solid #e6dfd3;padding-top:12px;">ORDER ITEMS</td></tr>
      ${itemLines}
      <tr><td colspan="2" style="border-top:1px solid #e6dfd3;padding-top:8px;"></td></tr>
      <tr>
        <td style="color:#7a6e65;font-size:13px;">Subtotal</td>
        <td style="color:#3D261D;font-size:13px;text-align:right;">₹${order.subtotal}</td>
      </tr>
      ${order.subscriptionDiscount > 0 ? `<tr><td style="color:#647545;font-size:13px;">Subscription Discount (10%)</td><td style="color:#647545;font-size:13px;text-align:right;">-₹${order.subscriptionDiscount}</td></tr>` : ''}
      ${order.discount > 0 ? `<tr><td style="color:#647545;font-size:13px;">Coupon (${order.couponCode})</td><td style="color:#647545;font-size:13px;text-align:right;">-₹${order.discount}</td></tr>` : ''}
      <tr>
        <td style="color:#7a6e65;font-size:13px;">Delivery Charge</td>
        <td style="color:#3D261D;font-size:13px;text-align:right;">₹${order.deliveryCharge}</td>
      </tr>
      <tr>
        <td style="color:#3D261D;font-size:15px;font-weight:700;padding-top:8px;">TOTAL</td>
        <td style="color:#B23A3A;font-size:18px;font-weight:800;text-align:right;padding-top:8px;">₹${order.totalAmount}</td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr><td colspan="2" style="border-top:1px solid #e6dfd3;padding-top:12px;color:#7a6e65;font-size:12px;padding-bottom:4px;">PAYMENT & NOTES</td></tr>
      <tr><td style="color:#3D261D;font-size:13px;">💳 ${order.paymentMethod}</td></tr>
      ${order.notes ? `<tr><td style="color:#7a6e65;font-size:12px;padding-top:4px;">Notes: ${order.notes}</td></tr>` : ''}
      <tr><td style="color:#7a6e65;font-size:11px;padding-top:4px;">Placed: ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
    </table>
    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}/admin" style="display:inline-block;background:#B23A3A;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">✅ Open Admin Dashboard to Approve</a>
    </div>
  `);
  await send(OWNER_EMAIL, `🔔 New Order — ${order.orderNumber} — ₹${order.totalAmount}`, html);
}

// ── 4. Customer Order Placed (PENDING) ───────────────────────────
export async function sendOrderPlacedEmail(to: string, order: Order) {
  const itemLines = order.items.map(
    (i) => `<tr>
      <td style="padding:6px 0;color:#3D261D;font-size:13px;">${i.quantity}× ${i.title}</td>
      <td style="padding:6px 0;color:#B23A3A;font-size:13px;text-align:right;font-weight:600;">₹${i.price * i.quantity}</td>
    </tr>`
  ).join('');

  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Order Received! 🎉</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> has been received.</p>
    <div style="background:#FFF8F0;border-radius:10px;padding:16px;margin-bottom:20px;border-left:4px solid #e6a830;">
      <p style="margin:0;color:#7a6e65;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Current Status</p>
      <p style="margin:6px 0 0;color:#d97706;font-size:18px;font-weight:700;">⏳ Pending Approval</p>
      <p style="margin:6px 0 0;color:#7a6e65;font-size:12px;">We'll confirm your order shortly and send you an email.</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemLines}
      <tr><td colspan="2" style="border-top:1px solid #e6dfd3;padding-top:10px;"></td></tr>
      <tr>
        <td style="color:#3D261D;font-size:14px;font-weight:700;">Total</td>
        <td style="color:#B23A3A;font-size:16px;font-weight:800;text-align:right;">₹${order.totalAmount}</td>
      </tr>
    </table>
    <div style="background:#f2efe9;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
      <p style="margin:0;color:#7a6e65;font-size:12px;">📍 ${order.address}, Sector ${order.sector}</p>
      <p style="margin:4px 0 0;color:#7a6e65;font-size:12px;">💳 ${order.paymentMethod}</p>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}/account/orders/${order.id}" style="display:inline-block;background:#B23A3A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">Track Your Order →</a>
    </div>
  `);
  await send(to, `Order Received — ${order.orderNumber}`, html);
}

// ── 5. Customer Order Confirmed ───────────────────────────────────
export async function sendOrderConfirmedEmail(to: string, order: Order) {
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Order Confirmed! ✅ ❤️</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${order.customerName}, great news!</p>
    <div style="background:#F0FFF4;border-radius:10px;padding:20px;margin-bottom:20px;border-left:4px solid #647545;text-align:center;">
      <p style="margin:0;color:#647545;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your Order</p>
      <p style="margin:8px 0;color:#3D261D;font-size:22px;font-weight:800;">${order.orderNumber}</p>
      <p style="margin:0;color:#647545;font-size:16px;font-weight:700;">✅ Confirmed</p>
      <p style="margin:8px 0 0;color:#7a6e65;font-size:13px;">Your homemade food is being prepared with love!</p>
    </div>
    <div style="background:#f2efe9;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0 0 6px;color:#3D261D;font-size:13px;font-weight:600;">Order Details</p>
      <p style="margin:0;color:#7a6e65;font-size:12px;">Total: <strong style="color:#B23A3A;">₹${order.totalAmount}</strong></p>
      <p style="margin:4px 0;color:#7a6e65;font-size:12px;">📍 ${order.address}, Sector ${order.sector}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:12px;">⏰ ${order.deliveryTime}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:12px;">Expected delivery: approximately 45 mins – 1 hour</p>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}/account/orders/${order.id}" style="display:inline-block;background:#647545;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">Track Your Order →</a>
    </div>
    <p style="margin:20px 0 0;color:#7a6e65;font-size:12px;text-align:center;">Thank you for choosing Mummy Food Hub ❤️<br/>Homemade food. Less oil. Less masala.</p>
  `);
  await send(to, `Order Confirmed — ${order.orderNumber} ❤️`, html);
}

// ── 6. Order Status Changed ────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; emoji: string; msg: string; bg: string; border: string }> = {
  pending:          { label: 'Pending Approval', emoji: '⏳', msg: 'Your order is awaiting confirmation.', bg: '#FFF8F0', border: '#e6a830' },
  confirmed:        { label: 'Confirmed',         emoji: '✅', msg: 'Your order has been confirmed!', bg: '#F0FFF4', border: '#647545' },
  preparing:        { label: 'Preparing',         emoji: '👩‍🍳', msg: 'Your homemade food is now being prepared with love!', bg: '#FFF8F0', border: '#e6a830' },
  out_for_delivery: { label: 'Out for Delivery',  emoji: '🚴', msg: 'Your order is on the way! Please be available at the delivery address.', bg: '#F0F4FF', border: '#3B82F6' },
  delivered:        { label: 'Delivered',         emoji: '🎉', msg: 'Your order has been delivered. We hope you enjoyed your meal!', bg: '#F0FFF4', border: '#647545' },
  cancelled:        { label: 'Cancelled',         emoji: '❌', msg: 'Unfortunately, your order has been cancelled. Please contact us if you have questions.', bg: '#FFF3F3', border: '#B23A3A' },
};

export async function sendOrderStatusEmail(to: string, order: Order, newStatus: string) {
  const config = STATUS_CONFIG[newStatus] ?? { label: newStatus, emoji: '📋', msg: 'Your order status has been updated.', bg: '#f2efe9', border: '#e6dfd3' };
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Order Update</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${order.customerName}, your order status has been updated.</p>
    <div style="background:${config.bg};border-radius:12px;padding:24px;border-left:4px solid ${config.border};text-align:center;margin-bottom:20px;">
      <p style="margin:0;font-size:32px;">${config.emoji}</p>
      <p style="margin:8px 0 0;color:#3D261D;font-size:20px;font-weight:800;">${config.label}</p>
      <p style="margin:8px 0 0;color:#7a6e65;font-size:13px;">${config.msg}</p>
    </div>
    <div style="background:#f2efe9;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
      <p style="margin:0;color:#7a6e65;font-size:12px;">Order ${order.orderNumber} • ₹${order.totalAmount}</p>
    </div>
    ${newStatus !== 'cancelled' ? `
    <div style="text-align:center;margin-top:16px;">
      <a href="${APP_URL}/account/orders/${order.id}" style="display:inline-block;background:#B23A3A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">Track Order →</a>
    </div>` : ''}
    ${newStatus === 'delivered' ? '<p style="margin:20px 0 0;color:#7a6e65;font-size:12px;text-align:center;">Thank you for choosing Mummy Food Hub ❤️ We hope to see you again soon!</p>' : ''}
  `);
  await send(to, `${config.emoji} ${config.label} — ${order.orderNumber}`, html);
}

// ── 7. Subscription Activated ─────────────────────────────────────
export async function sendSubscriptionActivatedEmail(to: string, customerName: string, sub: UserSubscription) {
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Subscription Activated! 🎉</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${customerName}, your Mummy Food Hub subscription is now active!</p>
    <div style="background:#F0FFF4;border-radius:10px;border:1px solid #647545;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;color:#647545;font-size:16px;font-weight:700;">${sub.planName}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:13px;">Start: ${new Date(sub.startDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:13px;">Expires: ${new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
      ${sub.totalMeals ? `<p style="margin:4px 0;color:#7a6e65;font-size:13px;">Total Meals: ${sub.totalMeals}</p>` : ''}
      <div style="margin-top:12px;padding:10px;background:#fff;border-radius:8px;border:1px solid #647545;">
        <p style="margin:0;color:#647545;font-size:14px;font-weight:700;">🎁 Your Benefit: 10% off every order!</p>
        <p style="margin:4px 0 0;color:#7a6e65;font-size:12px;">Discount is applied automatically at checkout.</p>
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/menu" style="display:inline-block;background:#647545;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">Order Now →</a>
    </div>
  `);
  await send(to, 'Your Mummy Food Hub Subscription is Active! 🎉', html);
}

// ── 8. Subscription Expiring Soon ─────────────────────────────────
export async function sendSubscriptionExpiringEmail(to: string, customerName: string, sub: UserSubscription, daysLeft: number) {
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Subscription Expiring Soon ⏰</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${customerName}, your subscription expires in <strong style="color:#B23A3A;">${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
    <div style="background:#FFF8F0;border-radius:10px;border:1px solid #e6a830;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;color:#3D261D;font-size:15px;font-weight:700;">${sub.planName}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:13px;">Expires: ${new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
    </div>
    <p style="color:#7a6e65;font-size:13px;">Renew your subscription to continue enjoying your 10% discount on all orders.</p>
    <div style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}/subscription" style="display:inline-block;background:#B23A3A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">Renew Subscription →</a>
    </div>
    <p style="margin:16px 0 0;color:#7a6e65;font-size:12px;text-align:center;">Or contact us on WhatsApp: <strong>+91 70656 65988</strong></p>
  `);
  await send(to, `Your Mummy Food Hub Subscription Expires in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`, html);
}

// ── 9. Subscription Expired ───────────────────────────────────────
export async function sendSubscriptionExpiredEmail(to: string, customerName: string, sub: UserSubscription) {
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Subscription Expired</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${customerName}, your <strong>${sub.planName}</strong> subscription has expired.</p>
    <div style="background:#FFF3F3;border-radius:10px;border:1px solid #B23A3A;padding:20px;margin-bottom:20px;">
      <p style="margin:0;color:#B23A3A;font-size:13px;">Expired on ${new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
    </div>
    <p style="color:#7a6e65;font-size:13px;">To continue enjoying fresh homemade meals with a 10% discount, please renew your subscription.</p>
    <div style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}/subscription" style="display:inline-block;background:#B23A3A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">Renew Now →</a>
    </div>
  `);
  await send(to, 'Your Mummy Food Hub Subscription Has Expired', html);
}
