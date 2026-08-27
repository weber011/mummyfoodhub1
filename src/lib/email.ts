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
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Homemade Food • Noida</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f2efe9;padding:16px 32px;text-align:center;border-top:1px solid #e6dfd3;">
            <p style="margin:0;color:#7a6e65;font-size:11px;">© 2026 Mummy Food Hub, Noida Sector 106</p>
            <p style="margin:4px 0 0;color:#7a6e65;font-size:11px;">WhatsApp: +91 70656 65988</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

async function send(to: string, subject: string, html: string) {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    // Log but never throw — email failure should not break the main flow
    console.error('[email] Failed to send:', (err as Error).message);
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
      <p style="margin:16px 0 0;color:#7a6e65;font-size:12px;">This code expires in 5 minutes. Do not share it with anyone.</p>
    </div>
    <p style="margin:24px 0 0;color:#7a6e65;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `);
  await send(to, 'Your Mummy Food Hub OTP', html);
}

// ── 2. Order Placed ───────────────────────────────────────────────
export async function sendOrderPlacedEmail(to: string, order: Order) {
  const itemLines = order.items.map(
    (i) => `<tr>
      <td style="padding:6px 0;color:#3D261D;font-size:13px;">${i.quantity}× ${i.title}</td>
      <td style="padding:6px 0;color:#B23A3A;font-size:13px;text-align:right;font-weight:600;">₹${i.price * i.quantity}</td>
    </tr>`
  ).join('');

  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Order Placed! 🎉</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${order.customerName}, your order has been received.</p>
    <div style="background:#FFF8F8;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;color:#7a6e65;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
      <p style="margin:0;color:#B23A3A;font-weight:700;font-size:15px;">#${order.id.slice(-8).toUpperCase()}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemLines}
      <tr><td colspan="2" style="border-top:1px solid #e6dfd3;padding-top:10px;"></td></tr>
      <tr>
        <td style="color:#3D261D;font-size:14px;font-weight:700;">Total Paid</td>
        <td style="color:#B23A3A;font-size:16px;font-weight:800;text-align:right;">₹${order.totalAmount}</td>
      </tr>
    </table>
    <div style="background:#f2efe9;border-radius:8px;padding:12px 16px;">
      <p style="margin:0;color:#7a6e65;font-size:12px;">Status: <strong style="color:#647545;">Placed</strong> • We'll confirm your order shortly via WhatsApp.</p>
    </div>
  `);
  await send(to, `Order Placed — #${order.id.slice(-8).toUpperCase()}`, html);
}

// ── 3. Order Status Changed ────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  placed: '📋 Placed',
  confirmed: '✅ Confirmed',
  preparing: '👩‍🍳 Preparing',
  out_for_delivery: '🚴 Out for Delivery',
  delivered: '🎉 Delivered',
  cancelled: '❌ Cancelled',
};

export async function sendOrderStatusEmail(to: string, order: Order, newStatus: string) {
  const label = STATUS_LABELS[newStatus] ?? newStatus;
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Order Update</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${order.customerName}, your order status has been updated.</p>
    <div style="text-align:center;padding:24px 0;">
      <div style="display:inline-block;background:#FFF3F3;border-radius:12px;padding:16px 32px;border-left:4px solid #B23A3A;">
        <p style="margin:0;color:#7a6e65;font-size:12px;text-transform:uppercase;letter-spacing:1px;">New Status</p>
        <p style="margin:8px 0 0;color:#B23A3A;font-size:22px;font-weight:800;">${label}</p>
      </div>
    </div>
    <div style="background:#f2efe9;border-radius:8px;padding:12px 16px;margin-top:16px;">
      <p style="margin:0;color:#7a6e65;font-size:12px;">Order #${order.id.slice(-8).toUpperCase()} • ₹${order.totalAmount}</p>
    </div>
  `);
  await send(to, `Order Update — ${label}`, html);
}

// ── 4. Subscription Activated ─────────────────────────────────────
export async function sendSubscriptionActivatedEmail(to: string, customerName: string, sub: UserSubscription) {
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Subscription Activated! 🎉</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${customerName}, your subscription is now active.</p>
    <div style="background:#F0FFF4;border-radius:10px;border:1px solid #647545;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;color:#647545;font-size:16px;font-weight:700;">${sub.planName}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:13px;">Start: ${new Date(sub.startDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:13px;">Expires: ${new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
      ${sub.totalMeals ? `<p style="margin:4px 0;color:#7a6e65;font-size:13px;">Total Meals: ${sub.totalMeals}</p>` : ''}
      <p style="margin:12px 0 0;display:inline-block;background:#647545;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">Active</p>
    </div>
  `);
  await send(to, 'Your Mummy Food Hub Subscription is Active!', html);
}

// ── 5. Subscription Expiring Soon ─────────────────────────────────
export async function sendSubscriptionExpiringEmail(to: string, customerName: string, sub: UserSubscription, daysLeft: number) {
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Subscription Expiring Soon ⏰</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${customerName}, your subscription expires in <strong style="color:#B23A3A;">${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
    <div style="background:#FFF8F0;border-radius:10px;border:1px solid #e6a830;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;color:#3D261D;font-size:15px;font-weight:700;">${sub.planName}</p>
      <p style="margin:4px 0;color:#7a6e65;font-size:13px;">Expires: ${new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
    </div>
    <p style="color:#7a6e65;font-size:13px;">Contact us on WhatsApp at +91 70656 65988 to renew your plan.</p>
  `);
  await send(to, `Subscription Expiring in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`, html);
}

// ── 6. Subscription Expired ───────────────────────────────────────
export async function sendSubscriptionExpiredEmail(to: string, customerName: string, sub: UserSubscription) {
  const html = emailBase(`
    <p style="margin:0 0 4px;color:#3D261D;font-size:18px;font-weight:700;">Subscription Expired</p>
    <p style="margin:0 0 24px;color:#7a6e65;font-size:14px;">Hi ${customerName}, your <strong>${sub.planName}</strong> subscription has expired.</p>
    <div style="background:#FFF3F3;border-radius:10px;border:1px solid #B23A3A;padding:20px;margin-bottom:20px;">
      <p style="margin:0;color:#B23A3A;font-size:13px;">Expired on ${new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}</p>
    </div>
    <p style="color:#7a6e65;font-size:13px;">To continue enjoying fresh homemade meals, please renew your subscription. Contact us on WhatsApp: +91 70656 65988</p>
  `);
  await send(to, 'Your Mummy Food Hub Subscription Has Expired', html);
}
