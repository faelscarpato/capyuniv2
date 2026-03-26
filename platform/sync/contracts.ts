export interface SyncOptions {
  autoBackup: boolean;
  intervalMs: number;
  conflictPolicy: 'manual' | 'last-write-wins';
}

export interface SyncMetadata {
  lastSyncAt: number | null;
  lastRemoteRevision: string | null;
}

