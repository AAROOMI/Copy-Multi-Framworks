import { useState, useEffect } from 'react';
import { AIService } from '../services/aiService';
import { AuditLogDB, OfflineAuditLog } from '../services/auditLogDB';
import { SyncEngine } from '../services/syncEngine';

export interface QueuedAuditLog {
    id: string;
    timestamp: number;
    userId: string;
    userName: string;
    action: string;
    details: string;
    targetId?: string;
    pending_sync?: boolean;
}

export function useAiOrchestrator(
    companyId: string | undefined, 
    addNotification: (msg: string, type: 'success' | 'info' | 'error') => void,
    onSyncComplete?: (syncedLogs: QueuedAuditLog[]) => void
) {
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.navigator.onLine;
        }
        return true;
    });

    const [forceLocal, setForceLocal] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('force_local_gemma') === 'true';
        }
        return false;
    });

    // Determine offline active state
    const isOfflineActive = !isOnline || forceLocal;

    // Apply status directly to AIService
    useEffect(() => {
        AIService.setForceLocal(isOfflineActive);
    }, [isOfflineActive]);

    // Track network state and start SyncEngine
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Initialize SyncEngine when online/offline transitions or companyId changes
        if (companyId) {
            SyncEngine.initialize(companyId, addNotification, (synced) => {
                if (onSyncComplete) {
                    onSyncComplete(synced as QueuedAuditLog[]);
                }
            });
            // Try initial flush if we are online
            if (window.navigator.onLine) {
                SyncEngine.flushQueue();
            }
        }

        const handleOnline = () => {
            setIsOnline(true);
            addNotification('Network connection restored. Switching back to Google Cloud Gemini.', 'success');
        };

        const handleOffline = () => {
            setIsOnline(false);
            addNotification('Internet connection lost. Automatically switched to Google Gemma 4 (Air-Gapped Local Engine).', 'info');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [companyId]);

    // Handle forceLocal state persistence and notify
    const toggleForceLocal = () => {
        const nextState = !forceLocal;
        setForceLocal(nextState);
        localStorage.setItem('force_local_gemma', String(nextState));
        
        if (nextState) {
            addNotification('Local air-gap mode activated. Using Google Gemma 4.', 'info');
        } else {
            if (isOnline) {
                addNotification('Local mode disarmed. Switched back to Google Cloud Gemini.', 'success');
                if (companyId) {
                    SyncEngine.flushQueue();
                }
            } else {
                addNotification('Internet connection is currently offline. Remaining on local Gemma 4.', 'info');
            }
        }
    };

    // Queue management using persistent IndexedDB
    const queueAuditLog = async (entry: Omit<OfflineAuditLog, 'pending_sync'>) => {
        try {
            await AuditLogDB.saveLog(entry);
            console.log('[Orchestrator] Audit log successfully written to IndexedDB:', entry);
        } catch (err) {
            console.error('[Orchestrator] Failed to save audit log to IndexedDB:', err);
        }
    };

    return {
        isOnline,
        forceLocal,
        isOfflineActive,
        toggleForceLocal,
        queueAuditLog,
        syncOfflineLogs: () => {
            SyncEngine.resetBackoff();
            SyncEngine.flushQueue();
        }
    };
}
