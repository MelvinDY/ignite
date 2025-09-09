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

  // Dev convenience: log OTP to console when not in production
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    console.info('otp.dev', { signupId, toEmail, otp });
  }

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

/**
 * Issue RESET_PASSWORD OTP:
 * - generate
 * - upsert into user_otps (owner_table='profiles', purpose='RESET_PASSWORD')
 * - send via email
 */
export async function issueResetPasswordOtp(profileId: string, toEmail: string, fullName: string) {
  const otp = generateOtp();
  const hashed = hashOtp(otp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 min

  if ((process.env.NODE_ENV || 'development') !== 'production') {
    console.info('otp.dev.reset_password', { profileId, toEmail, otp });
  }

  const { error } = await supabase
    .from('user_otps')
    .upsert({
      owner_table: 'profiles',
      owner_id: profileId,
      purpose: 'RESET_PASSWORD',
      otp_hash: hashed,
      expires_at: expiresAt,
      attempts: 0,
      resend_count: 0,
      last_sent_at: now.toISOString(),
      updated_at: now.toISOString(),
      locked_at: null,
    }, { onConflict: 'owner_table,owner_id,purpose' });

  if (error) throw error;

  const html = renderSignupOtpEmail(fullName, otp);
  await sendEmail(toEmail, 'Your Ignite password reset code', html);
}

/**
 * Resend RESET_PASSWORD OTP:
 * - enforce: caller should already have checked cooldown/cap
 * - overwrite otp_hash + expiry
 * - reset attempts; clear lock
 * - update last_sent_at
 * - increment resend_count (trigger resets on new day)
 */
export async function resendResetPasswordOtp(profileId: string, toEmail: string, fullName: string) {
  // 1) Load current row to get resend_count + last_sent_at
  const { data: current, error: fetchErr } = await supabase
    .from('user_otps')
    .select('id, resend_count, last_sent_at')
    .eq('owner_table', 'profiles')
    .eq('owner_id', profileId)
    .eq('purpose', 'RESET_PASSWORD')
    .single();

  if (fetchErr || !current) throw fetchErr || new Error('RESET_OTP_ROW_NOT_FOUND');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 min
  const otp = generateOtp();
  const hashed = hashOtp(otp);

  if ((process.env.NODE_ENV || 'development') !== 'production') {
    console.info('otp.dev.reset_password.resend', { profileId, toEmail, otp });
  }

  // 2) First update: overwrite OTP + TTL + timers, reset attempts/lock
  const { error: upErr1 } = await supabase
    .from('user_otps')
    .update({
      otp_hash: hashed,
      expires_at: expiresAt,
      attempts: 0,
      last_sent_at: now.toISOString(),
      locked_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', current.id);

  if (upErr1) throw upErr1;

  // 3) Second update: increment resend_count accounting for day change
  const last = current.last_sent_at ? new Date(current.last_sent_at) : null;
  const isSameDay = last ? last.toDateString() === now.toDateString() : false;
  const newResendCount = isSameDay ? (current.resend_count || 0) + 1 : 1;

  const { error: upErr2 } = await supabase
    .from('user_otps')
    .update({
      resend_count: newResendCount,
      updated_at: now.toISOString(),
    })
    .eq('id', current.id);

  if (upErr2) throw upErr2;

  // 4) Send email
  const html = renderSignupOtpEmail(fullName, otp);
  await sendEmail(toEmail, 'Your Ignite password reset code', html);
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

export async function getResetPasswordOtp(profileId: string) {
  return supabase
    .from('user_otps')
    .select('id, otp_hash, expires_at, attempts, last_sent_at, resend_count, locked_at')
    .eq('owner_table', 'profiles')
    .eq('owner_id', profileId)
    .eq('purpose', 'RESET_PASSWORD')
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

export async function deleteResetPasswordOtp(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('user_otps')
    .delete()
    .eq('owner_table', 'profiles')
    .eq('owner_id', profileId)
    .eq('purpose', 'RESET_PASSWORD');

  if (error) throw error;
}
