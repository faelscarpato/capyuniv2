import { create } from 'zustand';
import type { FileNode, FileSystem, WorkspaceState } from '../../../types';
import { INITIAL_FILES } from '../../../constants';
import { triggerEditorHook } from '../../../lib/extensions';
import { workspacePersistenceService } from '../services/workspacePersistenceService';
import { workspaceEffectsService } from '../services/workspaceEffectsService';
import { workspaceSyncBridge } from '../services/workspaceSyncBridge';
import { workspacePathService } from '../services/workspacePathService';
import { workspaceTabsService } from '../services/workspaceTabsService';
import { workspaceTreeService } from '../services/workspaceTreeService';

interface PendingScroll {
  fileId: string;
  lineNumber: number;
}

export interface WorkspaceDomainActions {
  initialize: () => Promise<void>;
  createFile: (parentId: string, name: string) => string;
  createFolder: (parentId: string, name: string) => string;
  createFileByPath: (path: string, content: string) => string;
  deleteNode: (id: string) => void;
  deleteFileByPath: (path: string) => void;
  renameNode: (id: string, newName: string) => void;
  moveNode: (id: string, newParentId: string) => void;
  updateFileContent: (id: string, content: string) => void;
  openFile: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  toggleFolder: (id: string) => void;
  unsavedChanges: Set<string>;
  markSaved: (id: string) => void;
  saveAll: () => void;
  closeWorkspace: () => void;
  pendingScroll: PendingScroll | null;
  requestScrollToLine: (fileId: string, lineNumber: number) => void;
  clearPendingScroll: () => void;
  getFileByPath: (path: string) => FileNode | undefined;
  importWorkspaceData: (newFiles: FileSystem) => void;
  getPathForId: (id: string) => string;
  syncAllToPTY: () => void;
  refreshFromPTY: () => void;
}

let unbindSyncListeners: (() => void) | null = null;

export const useWorkspaceDomainStore = create<WorkspaceState & WorkspaceDomainActions>((set, get) => ({
  files: INITIAL_FILES,
  openTabs: [],
  activeTabId: null,
  expandedFolders: ['root'],
  unsavedChanges: new Set(),
  pendingScroll: null,

  initialize: async () => {
    const saved = await workspacePersistenceService.load();
    if (saved) {
      set({
        files: saved.files,
        openTabs: saved.openTabs,
        activeTabId: saved.activeTabId,
        expandedFolders: saved.expandedFolders
      });
    }
    get().syncAllToPTY();
  },

  createFile: (parentId, name) => {
    const state = get();
    const result = workspaceTreeService.createFile(state.files, parentId, name);

    set((current) => ({
      files: result.files
    }));

    get().openFile(result.fileId);
    return result.fileId;
  },

  createFolder: (parentId, name) => {
    const state = get();
    const result = workspaceTreeService.createFolder(state.files, parentId, name);

    set((current) => ({
      files: result.files,
      expandedFolders: [...current.expandedFolders, result.folderId]
    }));

    return result.folderId;
  },

  createFileByPath: (path, content) => {
    const currentState = get();
    const result = workspaceTreeService.createFileByPath(currentState.files, path, content);
    if (!result.fileId) return '';

    set((state) => ({
      files: result.files,
      expandedFolders: Array.from(new Set([...state.expandedFolders, ...result.createdFolders])),
      unsavedChanges: new Set(state.unsavedChanges).add(result.fileId)
    }));

    workspaceEffectsService.persist({
      files: result.files,
      openTabs: get().openTabs,
      activeTabId: get().activeTabId,
      expandedFolders: get().expandedFolders
    });

    workspaceSyncBridge.syncFile(path, content);
    return result.fileId;
  },

  getFileByPath: (path) => workspacePathService.getFileByPath(get().files, path),

  deleteFileByPath: (path) => {
    const node = get().getFileByPath(path);
    if (node) get().deleteNode(node.id);
  },

  deleteNode: (id) => {
    set((state) => {
      const node = state.files[id];
      if (!node || !node.parentId) return state;

      const deletedPath = workspacePathService.getPathForId(state.files, id);
      const { files: newFiles } = workspaceTreeService.deleteNode(state.files, id);
      const tabState = workspaceTabsService.sanitizeAfterDeletion(
        state.openTabs,
        newFiles,
        state.activeTabId,
        id
      );
      const nextState = {
        ...state,
        files: newFiles,
        openTabs: tabState.openTabs,
        activeTabId: tabState.activeTabId
      };

      if (deletedPath) workspaceSyncBridge.deleteFile(deletedPath);
      workspaceEffectsService.persist(nextState);
      return nextState;
    });
  },

  renameNode: (id, newName) => {
    set((state) => {
      const newFiles = workspaceTreeService.renameNode(state.files, id, newName);
      workspaceEffectsService.persist({ ...state, files: newFiles });
      return { files: newFiles };
    });
  },

  moveNode: (id, newParentId) => {
    set((current) => {
      const newFiles = workspaceTreeService.moveNode(current.files, id, newParentId);
      if (!newFiles) return {} as Partial<WorkspaceState & WorkspaceDomainActions>;
      workspaceEffectsService.persist({ ...current, files: newFiles });
      return { files: newFiles };
    });
  },

  updateFileContent: (id, content) => {
    set((state) => {
      const path = get().getPathForId(id);
      if (path) workspaceSyncBridge.syncFile(path, content);
      return {
        files: { ...state.files, [id]: { ...state.files[id], content } },
        unsavedChanges: new Set(state.unsavedChanges).add(id)
      };
    });
  },

  markSaved: (id) => {
    set((state) => {
      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.delete(id);
      workspaceEffectsService.persist(get());
      return { unsavedChanges: newUnsaved };
    });
  },

  saveAll: () => {
    workspaceEffectsService.persist(get());
    workspaceEffectsService.onSaveAll(get().files);
    set({ unsavedChanges: new Set() });
  },

  closeWorkspace: () => {
    const root: FileSystem = {
      root: {
        id: 'root',
        name: 'root',
        type: 'folder',
        parentId: null,
        childrenIds: [],
        createdAt: Date.now()
      }
    };
    set({ files: root, openTabs: [], activeTabId: null, expandedFolders: ['root'], unsavedChanges: new Set() });
    workspaceEffectsService.persist(get());
  },

  openFile: (id) => {
    const { files, getPathForId } = get();
    const node = files[id];
    const filePath = getPathForId(id);

    if (node && node.type === 'file' && node.content === undefined && filePath) {
      workspaceSyncBridge.readFile(filePath);
    }

    set((state) => ({
      openTabs: workspaceTabsService.openTab(state.openTabs, id),
      activeTabId: id
    }));

    if (filePath) triggerEditorHook('onFileOpen', filePath);
    workspaceEffectsService.persist(get());
  },

  closeTab: (id) => {
    set((state) => {
      const newTabs = workspaceTabsService.closeTab(state.openTabs, id);
      return {
        openTabs: newTabs,
        activeTabId: workspaceTabsService.getNextActiveAfterClose(newTabs, state.activeTabId, id)
      };
    });
    workspaceEffectsService.persist(get());
  },

  setActiveTab: (id) => set({ activeTabId: id }),
  toggleFolder: (id) =>
    set((state) => ({
      expandedFolders: state.expandedFolders.includes(id)
        ? state.expandedFolders.filter((folderId) => folderId !== id)
        : [...state.expandedFolders, id]
    })),
  requestScrollToLine: (fileId, lineNumber) => set({ pendingScroll: { fileId, lineNumber } }),
  clearPendingScroll: () => set({ pendingScroll: null }),

  importWorkspaceData: (newFiles) => {
    set({ files: newFiles, openTabs: [], activeTabId: null, expandedFolders: ['root'] });
    workspaceEffectsService.persist(get());
    workspaceEffectsService.onImport(newFiles);
  },

  refreshFromPTY: () => {
    workspaceSyncBridge.requestScan();
  },

  getPathForId: (id) => {
    return workspacePathService.getPathForId(get().files, id);
  },

  syncAllToPTY: () => {
    workspaceSyncBridge.syncAllFiles(get().files, get().getPathForId);
    unbindSyncListeners?.();
    unbindSyncListeners = workspaceSyncBridge.bind(
      {
        onFileContent: (path, content) => {
          const node = get().getFileByPath(path);
          if (!node) return;
          set((state) => ({
            files: {
              ...state.files,
              [node.id]: { ...state.files[node.id], content }
            }
          }));
        },
        onScanSuccess: (files) => {
          set({ files });
          workspaceEffectsService.persist({
            files,
            openTabs: get().openTabs,
            activeTabId: get().activeTabId,
            expandedFolders: get().expandedFolders
          });
          workspaceEffectsService.onSyncUpdated();
        },
        onError: (message) => {
          workspaceEffectsService.onSyncError(message);
        }
      },
      () => get().files
    );
  }
}));
