import type { WorkspaceState } from '../../../types';
import { loadWorkspace, saveWorkspace } from '../../../lib/storage';

export const workspacePersistenceService = {
  load: async (): Promise<WorkspaceState | undefined> => {
    return loadWorkspace();
  },

  save: async (state: WorkspaceState): Promise<void> => {
    await saveWorkspace(state);
  }
};

