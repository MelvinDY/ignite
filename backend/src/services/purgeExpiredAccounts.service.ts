// src/services/purgeExpiredAccounts.service.ts
import { supabase } from '../lib/supabase';
import { PurgeExpiredAccountsResult } from '../types/PurgeExpiredAccounts';

/**
 * Permanently delete unverified accounts that have been expired for more than 15 days
 * This removes users with status=EXPIRED where updated_at is older than 15 days
 */
export async function purgeExpiredAccounts(): Promise<PurgeExpiredAccountsResult> {
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const cutoffDate = fifteenDaysAgo.toISOString();

  try {
    // First, find the users that will be deleted for logging purposes
    const { data: usersToDelete, error: findError } = await supabase
      .from('user_signups')
      .select('id')
      .eq('status', 'EXPIRED')
      .lt('updated_at', cutoffDate);

    if (findError) {
      console.error('purge-expired-accounts.find-users-failed', {
        error: findError.message,
        cutoffDate
      });
      throw findError;
    }

    if (!usersToDelete || usersToDelete.length === 0) {
      console.info('purge-expired-accounts.no-records-found', {
        cutoffDate,
        purgedCount: 0
      });
      return {
        purgedCount: 0,
        userIds: []
      };
    }

    const userIds = usersToDelete.map(user => user.id);

    // Delete dependent records first (OTP entries)
    const { error: otpDeleteError, count: deletedOtpsCount } = await supabase
      .from('user_otps')
      .delete({ count: 'exact' })
      .eq('type', 'REGISTRATION')
      .in('user_id', userIds);

    if (otpDeleteError) {
      console.error('purge-expired-accounts.delete-otps-failed', {
        error: otpDeleteError.message,
        userIds: userIds.length
      });
      throw otpDeleteError;
    }

    // Delete resume tokens
    const { error: tokenDeleteError, count: deletedTokensCount } = await supabase
      .from('user_resume_tokens')
      .delete({ count: 'exact' })
      .in('user_id', userIds);

    if (tokenDeleteError) {
      console.error('purge-expired-accounts.delete-tokens-failed', {
        error: tokenDeleteError.message,
        userIds: userIds.length
      });
      throw tokenDeleteError;
    }

    // Finally, delete the users
    const { error: userDeleteError, count: deletedUsersCount } = await supabase
      .from('user_signups')
      .delete({ count: 'exact' })
      .in('id', userIds)
      .eq('status', 'EXPIRED')
      .lt('updated_at', cutoffDate);

    if (userDeleteError) {
      console.error('purge-expired-accounts.delete-users-failed', {
        error: userDeleteError.message,
        userIds: userIds.length
      });
      throw userDeleteError;
    }

    const purgedCount = deletedUsersCount || 0;

    console.info('purge-expired-accounts.deletion-details', {
      deletedUsers: purgedCount,
      deletedOtps: deletedOtpsCount || 0,
      deletedTokens: deletedTokensCount || 0,
      cutoffDate
    });

    console.info('purge-expired-accounts.completed', {
      purgedCount,
      cutoffDate,
      userIdCount: userIds.length
    });

    return {
      purgedCount,
      userIds: userIds
    };

  } catch (error) {
    console.error('purge-expired-accounts.failed', {
      error: error instanceof Error ? error.message : error,
      cutoffDate
    });
    throw error;
  }
}

/**
 * Get count of expired accounts eligible for purging (for monitoring/reporting)
 */
export async function getExpiredAccountsPurgeCount(): Promise<number> {
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const cutoffDate = fifteenDaysAgo.toISOString();

  try {
    const { count, error } = await supabase
      .from('user_signups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'EXPIRED')
      .lt('updated_at', cutoffDate);

    if (error) {
      console.error('purge-expired-accounts.count-failed', {
        error: error.message
      });
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('purge-expired-accounts.count-failed', {
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}