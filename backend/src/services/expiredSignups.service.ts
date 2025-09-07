// src/services/signup.service.ts
import { supabase } from '../lib/supabase';
import type { ExpireStaleSignupsResult } from '../types/ExpiredStaleSignups';

export async function expireStaleSignups(): Promise<ExpireStaleSignupsResult> {
  const EXPIRATION_DAYS = 7;
  const cutoffDate = new Date(Date.now() - EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  
  try {
    console.info('expire-stale-signups.start', { 
      cutoffDate: cutoffDate.toISOString(),
      expirationDays: EXPIRATION_DAYS
    });

    // Find stale signups (status=PENDING_VERIFICATION AND created_at < now()-7d)
    const { data: staleSignups, error: selectError } = await supabase
      .from('user_signups')
      .select('id, signup_email, created_at, full_name')
      .eq('status', 'PENDING_VERIFICATION')
      .lt('created_at', cutoffDate.toISOString());

    if (selectError) {
      console.error('expire-stale-signups.select_error', selectError);
      throw selectError;
    }

    if (!staleSignups || staleSignups.length === 0) {
      console.info('expire-stale-signups.no_records_found');
      return { expiredCount: 0, userIds: [] };
    }

    const userIds = staleSignups.map(s => s.id);
    console.info('expire-stale-signups.found_stale_signups', { 
      count: staleSignups.length,
      userIds,
      emails: staleSignups.map(s => s.signup_email),
      oldestCreated: Math.min(...staleSignups.map(s => new Date(s.created_at).getTime())),
      newestCreated: Math.max(...staleSignups.map(s => new Date(s.created_at).getTime()))
    });

    // Update user_signups status to EXPIRED and clear email_verified_at, tokens
    const { error: updateError } = await supabase
      .from('user_signups')
      .update({
        status: 'EXPIRED',
        email_verified_at: null,
        resume_token_hash: null,
        resume_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', userIds);

    if (updateError) {
      console.error('expire-stale-signups.update_error', updateError);
      throw updateError;
    }

    // Delete associated OTPs (invalidate active OTP)
    const { error: otpError } = await supabase
      .from('user_otps')
      .delete()
      .eq('owner_table', 'user_signups')
      .in('owner_id', userIds)
      .eq('purpose', 'SIGNUP');

    if (otpError) {
      console.error('expire-stale-signups.otp_cleanup_error', otpError);
      // Don't throw - the main expiration succeeded, OTP cleanup is secondary
    }

    console.info('expire-stale-signups.success', { 
      expiredCount: staleSignups.length,
      userIds,
      cutoffDate: cutoffDate.toISOString()
    });
    
    return { 
      expiredCount: staleSignups.length, 
      userIds 
    };

  } catch (error) {
    console.error('expire-stale-signups.error', error);
    throw error;
  }
}