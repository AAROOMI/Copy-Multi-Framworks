export interface OfflineAuditLog {
    id: string;
    timestamp: number;
    userId: string;
    userName: string;
    action: string;
    details: string;
    targetId?: string;
    pending_sync?: boolean;
}

const DB_NAME = 'AuditLogOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_logs';

export class AuditLogDB {
    private static dbPromise: Promise<IDBDatabase> | null = null;

    private static initDB(): Promise<IDBDatabase> {
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                reject(new Error('IndexedDB not supported in this environment'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('pending_sync', 'pending_sync', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };

            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });

        return this.dbPromise;
    }

    static async saveLog(log: Omit<OfflineAuditLog, 'pending_sync'>): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const record: OfflineAuditLog = {
                ...log,
                pending_sync: true
            };

            const request = store.put(record);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    static async getPendingLogs(): Promise<OfflineAuditLog[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('pending_sync');
            const request = index.getAll(IDBKeyRange.only(true));

            request.onsuccess = () => {
                const logs = request.result as OfflineAuditLog[];
                // Sort by timestamp
                logs.sort((a, b) => a.timestamp - b.timestamp);
                resolve(logs);
            };
            request.onerror = () => reject(request.error);
        });
    }

    static async markLogsSynced(ids: string[]): Promise<void> {
        if (ids.length === 0) return;
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            let completed = 0;
            let errored = false;

            const checkComplete = () => {
                completed++;
                if (completed === ids.length) {
                    if (errored) {
                        reject(new Error('Some logs failed to mark as synced'));
                    } else {
                        resolve();
                    }
                }
            };

            for (const id of ids) {
                const getReq = store.get(id);
                getReq.onsuccess = () => {
                    const data = getReq.result as OfflineAuditLog;
                    if (data) {
                        data.pending_sync = false;
                        const putReq = store.put(data);
                        putReq.onsuccess = () => checkComplete();
                        putReq.onerror = () => {
                            errored = true;
                            checkComplete();
                        };
                    } else {
                        checkComplete();
                    }
                };
                getReq.onerror = () => {
                    errored = true;
                    checkComplete();
                };
            }
        });
    }

    static async getAllLogs(): Promise<OfflineAuditLog[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const logs = request.result as OfflineAuditLog[];
                logs.sort((a, b) => b.timestamp - a.timestamp);
                resolve(logs);
            };
            request.onerror = () => reject(request.error);
        });
    }

    static async clearAll(): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
