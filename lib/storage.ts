import { set, get } from 'idb-keyval';
import { WorkspaceState } from '../types';

const STORAGE_KEY = 'capyuni-workspace-v1';

export const saveWorkspace = async (state: WorkspaceState) => {
  try {
    // Destructure only the properties we want to persist to avoid saving functions or transient data
    const { files, openTabs, activeTabId, expandedFolders } = state;
    const persistentState = { files, openTabs, activeTabId, expandedFolders };
    await set(STORAGE_KEY, persistentState);
  } catch (err) {
    console.error('Failed to save workspace', err);
  }
};

export const loadWorkspace = async (): Promise<WorkspaceState | undefined> => {
  try {
    return await get<WorkspaceState>(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to load workspace', err);
    return undefined;
  }
};