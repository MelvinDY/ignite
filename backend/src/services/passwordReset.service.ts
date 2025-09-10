// src/services/passwordReset.service.ts
import { supabase } from '../lib/supabase';
import {
  getResetPasswordOtp,
  issueResetPasswordOtp,
  resendResetPasswordOtp,
  deleteResetPasswordOtp
} from './otp.service';

const COOLDOWN_SECONDS = 60;
const DAILY_CAP = 5;

/**
 * Process a password reset OTP (start or resend) in an enumeration-safe way.
 * Always resolves with { success: true, message } (no existence leaks).
 *
 * @param emailLower   lowercased email
 * @param message      generic success message to return to client
 * @param logTag       logger prefix e.g. "password-reset.request" | "password-reset.resend"
 */
export async function processResetOtpRequest(
  emailLower: string,
  message: string,
  logTag: string = 'password-reset'
): Promise<{ success: true; message: string }> {
  try {
    // Find ACTIVE profile by email
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, status, full_name, email')
      .eq('email', emailLower)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (profileErr || !profile) {
      if (profileErr) console.error(`${logTag}.profile_lookup.error`, profileErr);
      return { success: true, message };
    }

    const profileId = profile.id;
    const now = new Date();

    // Load existing RESET_PASSWORD OTP row (if any)
    const { data: otpRow, error: otpErr } = await getResetPasswordOtp(profileId);
    if (otpErr) {
      console.error(`${logTag}.otp_lookup.error`, otpErr);
      return { success: true, message };
    }

    // Enforce cooldown (≥60s), daily cap (≤5/day), and lock check
    let canSend = true;

    if (otpRow) {
      if (otpRow.locked_at) {
        canSend = false;
      }

      if (canSend && otpRow.last_sent_at) {
        const last = new Date(otpRow.last_sent_at);
        const diffSec = Math.floor((now.getTime() - last.getTime()) / 1000);
        if (diffSec < COOLDOWN_SECONDS) canSend = false;
      }

      if (canSend) {
        const lastDate = otpRow.last_sent_at ? new Date(otpRow.last_sent_at) : null;
        const isSameDay = lastDate ? lastDate.toDateString() === now.toDateString() : false;
        const resendCountToday = isSameDay ? (otpRow.resend_count || 0) : 0;
        if (resendCountToday >= DAILY_CAP) canSend = false;
      }
    }

    if (!canSend) {
      console.info(`${logTag}.rate_limited`, { profileId, reason: 'cooldown_or_daily_cap_or_locked' });
      return { success: true, message };
    }

    // Issue new reset password OTP or resend existing password OTP
    try {
      if (!otpRow) {
        await issueResetPasswordOtp(profileId, emailLower, profile.full_name);
        console.info(`${logTag}.issued.new`, { profileId });
      } else {
        await resendResetPasswordOtp(profileId, emailLower, profile.full_name);
        console.info(`${logTag}.issued.resend`, { profileId });
      }
    } catch (sendErr: any) {
      console.error(`${logTag}.issue.error`, sendErr?.message || sendErr);
    }

    return { success: true, message };
  } catch (err: any) {
    console.error(`${logTag}.unexpected.error`, err?.message || err);
    return { success: true, message };
  }
}

/**
 * Cancel an in-progress password reset in an enumeration-safe way.
 * Always returns { success: true } regardless of existence/state.
 */
export async function processCancelResetOtp(
  emailLower: string,
  logTag: string = 'password-reset.cancel'
): Promise<{ success: true }> {
  try {
    // Only ACTIVE profiles participate in reset cancellation
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('email', emailLower)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (profileErr || !profile) {
      if (profileErr) console.error(`${logTag}.profile_lookup.error`, profileErr);
      return { success: true };
    }

    const profileId = profile.id;

    const { data: otpRow, error: otpErr } = await getResetPasswordOtp(profileId);
    if (otpErr) {
      console.error(`${logTag}.otp_lookup.error`, otpErr);
      return { success: true };
    }

    // If there is an active/reset OTP row, clear it; else no-op
    if (otpRow) {
      try {
        await deleteResetPasswordOtp(profileId);
        console.info(`${logTag}.cleared`, { profileId });
      } catch (clearErr: any) {
        console.error(`${logTag}.clear.error`, clearErr?.message || clearErr);
      }
    } else {
      console.info(`${logTag}.noop`, { profileId });
    }

    return { success: true };
  } catch (err: any) {
    console.error(`${logTag}.unexpected.error`, err?.message || err);
    return { success: true };
  }
}
