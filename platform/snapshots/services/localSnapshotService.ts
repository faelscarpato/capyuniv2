import { get, set } from 'idb-keyval';
import type { FileSystem } from '../../../types';

export interface WorkspaceSnapshotRecord {
  id: string;
  createdAt: number;
  reason: 'manual' | 'autosave' | 'import';
  files: FileSystem;
}

const SNAPSHOT_KEY = 'capy_workspace_snapshots_v1';
const MAX_SNAPSHOTS = 20;

const readAll = async (): Promise<WorkspaceSnapshotRecord[]> => {
  return (await get<WorkspaceSnapshotRecord[]>(SNAPSHOT_KEY)) || [];
};

export const localSnapshotService = {
  create: async (files: FileSystem, reason: WorkspaceSnapshotRecord['reason']): Promise<WorkspaceSnapshotRecord> => {
    const snapshot: WorkspaceSnapshotRecord = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      reason,
      files
    };

    const existing = await readAll();
    const next = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS);
    await set(SNAPSHOT_KEY, next);
    return snapshot;
  },

  list: async (): Promise<WorkspaceSnapshotRecord[]> => {
    return readAll();
  }
};

