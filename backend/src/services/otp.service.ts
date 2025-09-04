// src/services/otp.service.ts

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

export async function loadPendingSignup(userId: string) {
  return supabase
    .from('user_signups')
    .select('id, status, otp_hash, otp_expires_at, otp_attempts')
    .eq('id', userId)
    .maybeSingle();
}

export async function incrementOtpAttempts(userId: string) {
  const { data } = await supabase
    .from('user_signups')
    .select('otp_attempts')
    .eq('id', userId)
    .single();
  await supabase
    .from('user_signups')
    .update({
      otp_attempts: (data?.otp_attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export async function clearOtpState(userId: string) {
  await supabase
    .from('user_signups')
    .update({
      otp_hash: null,
      otp_expires_at: null,
      otp_attempts: 0,
      otp_resend_count: 0,
      last_otp_sent_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export async function activateUser(userId: string) {
  await supabase
    .from('user_signups')
    .update({
      status: 'ACTIVE',
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}