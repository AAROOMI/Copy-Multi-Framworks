import { AuditLogDB, OfflineAuditLog } from './auditLogDB';
import { dbAPI } from '../db';

export class SyncEngine {
    private static isSyncing = false;
    private static retryDelay = 1000; // initial retry delay in ms (1 second)
    private static maxRetryDelay = 30000; // max backoff (30 seconds)
    private static activeCompanyId: string | null = null;
    private static notificationCallback: ((msg: string, type: 'success' | 'info' | 'error') => void) | null = null;
    private static syncCompleteCallback: ((syncedLogs: OfflineAuditLog[]) => void) | null = null;

    static initialize(
        companyId: string,
        addNotification: (msg: string, type: 'success' | 'info' | 'error') => void,
        onSyncComplete?: (syncedLogs: OfflineAuditLog[]) => void
    ) {
        this.activeCompanyId = companyId;
        this.notificationCallback = addNotification;
        this.syncCompleteCallback = onSyncComplete;

        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this.handleOnlineEvent);
            window.addEventListener('online', this.handleOnlineEvent);
        }
    }

    private static handleOnlineEvent = () => {
        console.log('[SyncEngine] Network online detected. Triggering queue flush...');
        this.resetBackoff();
        this.flushQueue();
    };

    static resetBackoff() {
        this.retryDelay = 1000;
    }

    static async flushQueue(): Promise<void> {
        if (this.isSyncing || !this.activeCompanyId) return;

        if (typeof window !== 'undefined' && !window.navigator.onLine) {
            console.log('[SyncEngine] Offline, skipping sync flush.');
            return;
        }

        const pendingLogs = await AuditLogDB.getPendingLogs();
        if (pendingLogs.length === 0) {
            return;
        }

        this.isSyncing = true;
        console.log(`[SyncEngine] Found ${pendingLogs.length} pending logs. Initiating batch flush...`);
        if (this.notificationCallback) {
            this.notificationCallback(`Syncing ${pendingLogs.length} offline audit logs back to cloud secure storage...`, 'info');
        }

        try {
            const syncedIds: string[] = [];
            const syncedLogs: OfflineAuditLog[] = [];

            for (const log of pendingLogs) {
                // Prepare clean log for firestore (without pending_sync property)
                const { pending_sync, ...cleanLog } = log;
                
                // Attempt to upload
                await dbAPI.addAuditLog(this.activeCompanyId, cleanLog as any);
                syncedIds.push(log.id);
                syncedLogs.push(log);
            }

            // Update local status in IndexedDB
            await AuditLogDB.markLogsSynced(syncedIds);
            
            console.log(`[SyncEngine] Successfully synchronized ${syncedIds.length} audit logs.`);
            
            if (this.notificationCallback) {
                this.notificationCallback(`Successfully synchronized ${syncedIds.length} offline audit logs with zero loss.`, 'success');
            }

            if (this.syncCompleteCallback) {
                this.syncCompleteCallback(syncedLogs);
            }

            this.resetBackoff();
            this.isSyncing = false;

            // Run again in case more logs entered the queue
            const checkAgain = await AuditLogDB.getPendingLogs();
            if (checkAgain.length > 0) {
                this.flushQueue();
            }

        } catch (error) {
            console.error('[SyncEngine] Synchronization failed. Scheduling retry with exponential backoff...', error);
            this.isSyncing = false;

            // Exponential backoff
            const currentDelay = this.retryDelay;
            this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);

            console.log(`[SyncEngine] Retrying in ${currentDelay}ms...`);
            setTimeout(() => {
                this.flushQueue();
            }, currentDelay);
        }
    }
}
