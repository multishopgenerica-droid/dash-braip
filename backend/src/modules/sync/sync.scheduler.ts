import cron from 'node-cron';
import { syncAllActiveGateways } from './sync.service';

let syncTask: cron.ScheduledTask | null = null;

export function startSyncScheduler(): void {
  // Run every 5 minutes
  syncTask = cron.schedule('*/5 * * * *', async () => {
    console.log('Starting scheduled sync...');
    try {
      await syncAllActiveGateways();
      console.log('Scheduled sync completed');
    } catch (error) {
      console.error('Scheduled sync failed:', error);
    }
  });

  console.log('Sync scheduler started (every 5 minutes)');
}

export function stopSyncScheduler(): void {
  if (syncTask) {
    syncTask.stop();
    syncTask = null;
    console.log('Sync scheduler stopped');
  }
}
