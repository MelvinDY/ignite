// src/jobs/scheduledJobs.ts
import cron from 'node-cron';
import { expireStaleSignups } from '../services/expiredSignups.service';
import { purgeExpiredAccounts } from '../services/purgeExpiredAccounts.service';

/**
 * Initialize and start all scheduled jobs
 */
export function startScheduledJobs() {
  console.info('scheduled-jobs.initializing');

  // Run daily at 2:00 AM 
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
    timezone: 'Australia/Sydney', // Adjust to your timezone
    name: 'expire-stale-signups'
  });

  console.info('scheduled-jobs.started', {
    jobs: ['expire-stale-signups'],
    timezone: 'Australia/Sydney',
    schedule: 'daily at 2:00 AM'
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