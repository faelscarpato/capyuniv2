import { create } from 'zustand';

export type WorkspaceNodeType = 'file' | 'folder';

export interface WorkspaceNode {
  id: string;
  name: string;
  type: WorkspaceNodeType;
  parentId: string | null;
  childrenIds: string[];
  content?: string;
  language?: string;
  createdAt: number;
}

export interface WorkspaceSnapshot {
  files: Record<string, WorkspaceNode>;
  activeTabId: string | null;
  openTabs: string[];
}

interface WorkspaceState {
  files: Record<string, WorkspaceNode>;
  activeTabId: string | null;
  openTabs: string[];
  expandedFolders: string[];
  unsavedFileIds: Set<string>;
  setSnapshot: (snapshot: WorkspaceSnapshot) => void;
  setActiveTab: (id: string | null) => void;
  markUnsaved: (id: string) => void;
  markSaved: (id: string) => void;
}

export const useWorkspaceCoreStore = create<WorkspaceState>((set) => ({
  files: {},
  activeTabId: null,
  openTabs: [],
  expandedFolders: ['root'],
  unsavedFileIds: new Set<string>(),
  setSnapshot: (snapshot) =>
    set({
      files: snapshot.files,
      activeTabId: snapshot.activeTabId,
      openTabs: snapshot.openTabs
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  markUnsaved: (id) =>
    set((state) => {
      const next = new Set(state.unsavedFileIds);
      next.add(id);
      return { unsavedFileIds: next };
    }),
  markSaved: (id) =>
    set((state) => {
      const next = new Set(state.unsavedFileIds);
      next.delete(id);
      return { unsavedFileIds: next };
    })
}));

