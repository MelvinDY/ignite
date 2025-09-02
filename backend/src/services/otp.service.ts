import crypto from 'crypto';
import { supabase } from '../lib/supabase';
import { sendEmail } from './email.service';
import { renderSignupOtpEmail } from '../emails/otp';

/**
 * Generate a 6-digit numeric OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Issue a signup OTP:
 * - generate
 * - store in user_signups
 * - send via email
 */
export async function issueSignupOtp(userId: string, toEmail: string, fullName: string) {
  const otp = generateOtp();
  const hashed = hashOtp(otp);
  const now = new Date();

  const { error } = await supabase
    .from('user_signups')
    .update({
      otp_hash: hashed,
      otp_expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(), // 10 min TTL
      otp_attempts: 0,
      otp_resend_count: 0,
      last_otp_sent_at: now.toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  // Build the email HTML
  const html = renderSignupOtpEmail(fullName, otp);

  // Send the email
  await sendEmail(toEmail, 'Your Ignite verification code', html);
}