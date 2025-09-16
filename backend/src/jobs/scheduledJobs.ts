// src/jobs/scheduledJobs.ts
import cron from 'node-cron';
import { expireStaleSignups } from '../services/expiredSignups.service';
import { purgeExpiredAccounts } from '../services/purgeExpiredAccounts.service';

/**
 * Initialize and start all scheduled jobs
 */
export function startScheduledJobs() {
  console.info('scheduled-jobs.initializing');

  // Run daily at 2:00 AM - Expire stale signups
  cron.schedule('0 2 * * *', async () => {
    console.info('scheduled-job.expire-stale-signups.triggered');
    try {
      const result = await expireStaleSignups();
      console.info('scheduled-job.expire-stale-signups.completed', {
        expiredCount: result.expiredCount,
        userIds: result.userIds
      });
    } catch (error) {
      console.error('scheduled-job.expire-stale-signups.failed', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }, {
    timezone: 'Australia/Sydney',
    name: 'expire-stale-signups'
  });

  // Run daily at 3:00 AM - Purge expired accounts (runs after expire job)
  cron.schedule('0 3 * * *', async () => {
    console.info('scheduled-job.purge-expired-accounts.triggered');
    try {
      const result = await purgeExpiredAccounts();
      console.info('scheduled-job.purge-expired-accounts.completed', {
        purgedCount: result.purgedCount,
        userIdCount: result.userIds.length
      });
    } catch (error) {
      console.error('scheduled-job.purge-expired-accounts.failed', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }, {
    timezone: 'Australia/Sydney',
    name: 'purge-expired-accounts'
  });

  console.info('scheduled-jobs.started', {
    jobs: ['expire-stale-signups', 'purge-expired-accounts'],
    timezone: 'Australia/Sydney',
    schedules: {
      'expire-stale-signups': 'daily at 2:00 AM',
      'purge-expired-accounts': 'daily at 3:00 AM'
    }
  });
}

/**
 * Manually trigger the expire stale signups job (for testing)
 */
export async function triggerExpireStaleSignups() {
  console.info('manual-trigger.expire-stale-signups.start');
  try {
    const result = await expireStaleSignups();
    console.info('manual-trigger.expire-stale-signups.success', result);
    return result;
  } catch (error) {
    console.error('manual-trigger.expire-stale-signups.error', error);
    throw error;
  }
}

/**
 * Manually trigger the purge expired accounts job (for testing)
 */
export async function triggerPurgeExpiredAccounts() {
  console.info('manual-trigger.purge-expired-accounts.start');
  try {
    const result = await purgeExpiredAccounts();
    console.info('manual-trigger.purge-expired-accounts.success', result);
    return result;
  } catch (error) {
    console.error('manual-trigger.purge-expired-accounts.error', error);
    throw error;
  }
}