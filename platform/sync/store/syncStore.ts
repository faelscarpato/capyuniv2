import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncState {
  enabled: boolean;
  lastSyncAt: number | null;
  status: SyncStatus;
  error: string | null;
  setEnabled: (enabled: boolean) => void;
  startSync: () => void;
  completeSync: () => void;
  failSync: (message: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  enabled: false,
  lastSyncAt: null,
  status: 'idle',
  error: null,
  setEnabled: (enabled) => set({ enabled }),
  startSync: () => set({ status: 'syncing', error: null }),
  completeSync: () => set({ status: 'success', lastSyncAt: Date.now(), error: null }),
  failSync: (message) => set({ status: 'error', error: message })
}));

