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
export async function issueSignupOtp(signupId: string, toEmail: string, fullName: string) {
  const otp = generateOtp();
  const hashed = hashOtp(otp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 min

  // single active OTP per (owner_table, owner_id, purpose)
  const { error } = await supabase
    .from('user_otps')
    .upsert({
      owner_table: 'user_signups',
      owner_id: signupId,
      purpose: 'SIGNUP',
      otp_hash: hashed,
      expires_at: expiresAt,
      attempts: 0,
      resend_count: 0,
      last_sent_at: now.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'owner_table,owner_id,purpose' });

  if (error) throw error;

  const html = renderSignupOtpEmail(fullName, otp);
  await sendEmail(toEmail, 'Your Ignite verification code', html);
}


export async function loadPendingSignup(userId: string) {
  return supabase
    .from('user_signups')
    .select('id, status')
    .eq('id', userId)
    .maybeSingle();
}

export async function activateUser(signupId: string) {
  const now = new Date().toISOString();

  // activate signup
  await supabase.from('user_signups')
    .update({ status: 'ACTIVE', email_verified_at: now, updated_at: now })
    .eq('id', signupId);

  // flip linked profile status if present
  const { data } = await supabase
    .from('user_signups')
    .select('profile_id')
    .eq('id', signupId)
    .single();

  if (data?.profile_id) {
    await supabase.from('profiles')
      .update({ status: 'ACTIVE', updated_at: now })
      .eq('id', data.profile_id);
  }
}

export async function getSignupOtp(signupId: string) {
  return supabase
    .from('user_otps')
    .select('id, otp_hash, expires_at, attempts, last_sent_at, resend_count, locked_at')
    .eq('owner_table', 'user_signups')
    .eq('owner_id', signupId)
    .eq('purpose', 'SIGNUP')
    .maybeSingle();
}

export async function bumpAttemptsOrLock(otpRowId: string, currentAttempts: number) {
  const attempts = (currentAttempts ?? 0) + 1;
  const updates: any = { attempts, updated_at: new Date().toISOString() };
  if (attempts >= 5) updates.locked_at = new Date().toISOString();
  await supabase.from('user_otps').update(updates).eq('id', otpRowId);
  return attempts;
}

export async function deleteSignupOtp(signupId: string) {
  await supabase
    .from('user_otps')
    .delete()
    .eq('owner_table', 'user_signups')
    .eq('owner_id', signupId)
    .eq('purpose', 'SIGNUP');
}
