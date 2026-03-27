import { create } from 'zustand';

export type WorkspaceDialogMode = 'create-file' | 'create-folder' | 'delete-node' | 'rename-node';

interface WorkspaceActionDialogState {
  isOpen: boolean;
  mode: WorkspaceDialogMode | null;
  parentId: string | null;
  targetId: string | null;
  nodeName: string;
  openCreateFile: (parentId: string) => void;
  openCreateFolder: (parentId: string) => void;
  openDeleteNode: (targetId: string, nodeName: string) => void;
  openRenameNode: (targetId: string, nodeName: string) => void;
  close: () => void;
}

const initialState = {
  isOpen: false,
  mode: null as WorkspaceDialogMode | null,
  parentId: null,
  targetId: null,
  nodeName: ''
};

export const useWorkspaceActionDialogStore = create<WorkspaceActionDialogState>((set) => ({
  ...initialState,
  openCreateFile: (parentId) =>
    set({
      isOpen: true,
      mode: 'create-file',
      parentId,
      targetId: null,
      nodeName: ''
    }),
  openCreateFolder: (parentId) =>
    set({
      isOpen: true,
      mode: 'create-folder',
      parentId,
      targetId: null,
      nodeName: ''
    }),
  openDeleteNode: (targetId, nodeName) =>
    set({
      isOpen: true,
      mode: 'delete-node',
      parentId: null,
      targetId,
      nodeName
    }),
  openRenameNode: (targetId, nodeName) =>
    set({
      isOpen: true,
      mode: 'rename-node',
      parentId: null,
      targetId,
      nodeName
    }),
  close: () => set(initialState)
}));
