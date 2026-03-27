import type { FileSystem } from '../../../types';
import { localSnapshotService } from '../../../platform/snapshots/services/localSnapshotService';

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
  }
};

