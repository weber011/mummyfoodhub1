import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otp';
import { getUserByEmail, createUser, updateUser } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';
import { sendWelcomeEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import type { SessionPayload } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? '').toLowerCase().trim();
    const otp = (body.otp ?? '').trim();
    const name: string = (body.name ?? '').trim();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP required.' }, { status: 400 });
    }

    const result = await verifyOtp(email, otp);

    if (!result.success) {
      const messages: Record<string, string> = {
        INVALID: 'Incorrect OTP. Please try again.',
        EXPIRED: 'OTP has expired. Please request a new one.',
        MAX_ATTEMPTS: 'Too many incorrect attempts. Please request a new OTP.',
      };
      return NextResponse.json(
        { success: false, error: messages[result.reason] ?? 'Verification failed.' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      if (!name) {
        return NextResponse.json({ success: false, error: 'Name required for new accounts.' }, { status: 422 });
      }
      user = await createUser({ email, name });
      isNewUser = true;
    }

    // Send Welcome Email if needed
    if (isNewUser || (!user.welcomeEmailSent)) {
      sendWelcomeEmail(user.email, user.name).catch(e => console.error(e));
      await updateUser(user.id, { welcomeEmailSent: true });
      if (isNewUser) {
        createNotification('admin', 'new_customer', 'New Customer Registered', `${user.name} (${user.email}) just registered!`).catch(e => console.error(e));
      }
    }

    // Create session
    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const res = NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    await setSessionCookie(res, sessionPayload);
    return res;
  } catch (e: any) {
    console.error('[verify-otp]', e);
    return NextResponse.json({ success: false, error: 'Server error. Please try again.' }, { status: 500 });
  }
}
