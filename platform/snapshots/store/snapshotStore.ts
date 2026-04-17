import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { localSnapshotService, type WorkspaceSnapshotRecord } from '../services/localSnapshotService';

interface SnapshotSlice {
  snapshots: WorkspaceSnapshotRecord[];
  isLoading: boolean;
  loadSnapshots: () => Promise<void>;
  createSnapshot: (reason?: WorkspaceSnapshotRecord['reason'], name?: string) => Promise<WorkspaceSnapshotRecord | null>;
  deleteSnapshot: (id: string) => Promise<void>;
  clearSnapshots: () => Promise<void>;
}

function createSnapshotStore<T extends SnapshotSlice>(set: any, get: any) {
  return {
    snapshots: [],
    isLoading: false,

    loadSnapshots: async () => {
      set({ isLoading: true });
      try {
        const snapshots = await localSnapshotService.list();
        set({ snapshots, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    },

    createSnapshot: async (reason = 'manual', name?: string) => {
      set({ isLoading: true });
      try {
        const workspaceState = useWorkspaceSnapshotStore.getState();
        if (!workspaceState.files) {
          set({ isLoading: false });
          return null;
        }
        const snapshot = await localSnapshotService.create(workspaceState.files, reason, name);
        const snapshots = await localSnapshotService.list();
        set({ snapshots, isLoading: false });
        return snapshot;
      } catch {
        set({ isLoading: false });
        return null;
      }
    },

    deleteSnapshot: async (id: string) => {
      set({ isLoading: true });
      try {
        await localSnapshotService.delete(id);
        const snapshots = await localSnapshotService.list();
        set({ snapshots, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    },

    clearSnapshots: async () => {
      set({ isLoading: true });
      try {
        await localSnapshotService.clear();
        set({ snapshots: [], isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    }
  };
}

interface WorkspaceSnapshotState {
  files: import('../../../types').FileSystem | null;
  setFiles: (files: import('../../../types').FileSystem) => void;
}

const useWorkspaceSnapshotStore = create<SnapshotSlice & WorkspaceSnapshotState>((set, get) => ({
  files: null,
  setFiles: (files) => set({ files }),
  ...createSnapshotStore(set, get)
}));

export const useSnapshotStore = useWorkspaceSnapshotStore;
export type { SnapshotSlice };