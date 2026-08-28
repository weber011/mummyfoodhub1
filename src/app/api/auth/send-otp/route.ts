import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, storeOtp } from '@/lib/otp';
import { getUserByEmail } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? '').toLowerCase().trim();
    const name: string = (body.name ?? '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Valid email required.' }, { status: 400 });
    }

    // Check if user exists (for UX: tells client if this is login or signup)
    const existing = await getUserByEmail(email);
    if (!existing && !name) {
      return NextResponse.json({ success: false, needsName: true, error: 'Name required for new accounts.' }, { status: 422 });
    }

    const otp = generateOtp();

    try {
      await storeOtp(email, otp);
    } catch (e: any) {
      if (e.message === 'RESEND_TOO_SOON') {
        return NextResponse.json({ success: false, error: 'Please wait 60 seconds before requesting a new OTP.' }, { status: 429 });
      }
      throw e;
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const emailConfigured = !!(process.env.RESEND_API_KEY || process.env.GMAIL_APP_PASSWORD);
    const displayName = existing?.name ?? name ?? undefined;

    console.log(`[OTP] ${email} → ${otp}`);

    // Send OTP via email
    if (emailConfigured) {
      sendOtpEmail(email, otp, displayName).catch((err) =>
        console.error('[send-otp] email send failed:', err?.message)
      );
    }

    return NextResponse.json({
      success: true,
      isNewUser: !existing,
      // Only expose OTP in the response in dev or when email is NOT configured (demo mode)
      ...(isDev || !emailConfigured ? { devOtp: otp } : {}),
    });
  } catch (e: any) {
    console.error('[send-otp]', e);
    return NextResponse.json({ success: false, error: 'Server error. Please try again.' }, { status: 500 });
  }
}
