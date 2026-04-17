import type { FileSystem, FileNode } from '../../../types';
import { localSnapshotService, type WorkspaceSnapshotRecord } from '../../../platform/snapshots/services/localSnapshotService';

export const workspaceSnapshotService = {
  createManual: (files: FileSystem): void => {
    localSnapshotService.create(files, 'manual').catch(() => {
      // Snapshot failures should not break save flow.
    });
  },
  createImport: (files: FileSystem): void => {
    localSnapshotService.create(files, 'import').catch(() => {
      // Snapshot failures should not block import.
    });
  },
  createAutosave: (files: FileSystem): void => {
    localSnapshotService.create(files, 'autosave').catch(() => {
      // Snapshot failures should not break autosave.
    });
  },
  getSnapshots: async (): Promise<WorkspaceSnapshotRecord[]> => {
    return localSnapshotService.list();
  },
  getSnapshot: async (id: string): Promise<WorkspaceSnapshotRecord | undefined> => {
    return localSnapshotService.get(id);
  },
  restoreSnapshot: async (id: string): Promise<FileSystem | null> => {
    const snapshot = await localSnapshotService.get(id);
    if (!snapshot) return null;
    return snapshot.files;
  },
  deleteSnapshot: async (id: string): Promise<void> => {
    return localSnapshotService.delete(id);
  },
  clearAllSnapshots: async (): Promise<void> => {
    return localSnapshotService.clear();
  }
};

