import type { FileSystem, WorkspaceState } from '../../../types';
import { workspacePersistenceService } from './workspacePersistenceService';
import { workspaceSnapshotService } from './workspaceSnapshotService';
import { workspaceNotificationBridge } from './workspaceNotificationBridge';

export const workspaceEffectsService = {
  persist: (state: WorkspaceState): void => {
    workspacePersistenceService.save(state).catch(() => {
      // Persistence failures should not break the interaction flow.
    });
  },

  onSaveAll: (files: FileSystem): void => {
    workspaceSnapshotService.createManual(files);
    workspaceNotificationBridge.saved();
  },

  onImport: (files: FileSystem): void => {
    workspaceSnapshotService.createImport(files);
  },

  onSyncUpdated: (): void => {
    workspaceNotificationBridge.syncUpdated();
  },

  onSyncError: (message: string): void => {
    workspaceNotificationBridge.syncError(message);
  }
};

