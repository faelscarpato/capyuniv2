import { get, set } from 'idb-keyval';
import type { WorkspaceSnapshot } from '../store/workspaceStore';

const WORKSPACE_STORAGE_KEY = 'capy_workspace_v2';

export const workspacePersistenceService = {
  save: async (snapshot: WorkspaceSnapshot): Promise<void> => {
    await set(WORKSPACE_STORAGE_KEY, snapshot);
  },
  load: async (): Promise<WorkspaceSnapshot | undefined> => {
    return get<WorkspaceSnapshot>(WORKSPACE_STORAGE_KEY);
  }
};

