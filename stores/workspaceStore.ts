import { create } from 'zustand';
import { WorkspaceState, FileNode, FileSystem } from '../types';
import { INITIAL_FILES } from '../constants';
import { generateId } from '../lib/ids';
import { saveWorkspace, loadWorkspace } from '../lib/storage';
import { getLanguageFromFilename } from '../lib/fileUtils';
import { useNotificationStore } from './notificationStore';

interface PendingScroll {
  fileId: string;
  lineNumber: number;
}

interface WorkspaceActions {
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
  renamingNodeId: string | null;
  setRenamingNodeId: (id: string | null) => void;
  pendingScroll: PendingScroll | null;
  requestScrollToLine: (fileId: string, lineNumber: number) => void;
  clearPendingScroll: () => void;
  getFileByPath: (path: string) => FileNode | undefined;
  importWorkspaceData: (newFiles: FileSystem) => void;
}

const deleteRecursive = (files: FileSystem, id: string): FileSystem => {
  const node = files[id];
  if (!node) return files;
  let nextFiles = { ...files };
  if (node.type === 'folder') {
    node.childrenIds.forEach(childId => {
      nextFiles = deleteRecursive(nextFiles, childId);
    });
  }
  delete nextFiles[id];
  return nextFiles;
};

const isDescendant = (files: FileSystem, potentialParentId: string, nodeId: string): boolean => {
    let current = files[potentialParentId];
    while (current && current.parentId) {
        if (current.parentId === nodeId) return true;
        current = files[current.parentId];
    }
    return false;
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set, get) => ({
  files: INITIAL_FILES,
  openTabs: [],
  activeTabId: null,
  expandedFolders: ['root'],
  unsavedChanges: new Set(),
  pendingScroll: null,
  renamingNodeId: null,

  initialize: async () => {
    const saved = await loadWorkspace();
    if (saved) {
      set({
        files: saved.files,
        openTabs: saved.openTabs,
        activeTabId: saved.activeTabId,
        expandedFolders: saved.expandedFolders
      });
    }
  },

  setRenamingNodeId: (id) => set({ renamingNodeId: id }),

  createFile: (parentId, name) => {
    const state = get();
    // Default to root if parent doesn't exist
    const actualParentId = state.files[parentId] ? parentId : 'root';
    
    const id = generateId();
    const newNode: FileNode = {
      id,
      name,
      type: 'file',
      parentId: actualParentId,
      childrenIds: [],
      content: '',
      language: getLanguageFromFilename(name),
      createdAt: Date.now(),
    };
    set(state => ({
      files: {
        ...state.files,
        [id]: newNode,
        [actualParentId]: { ...state.files[actualParentId], childrenIds: [...state.files[actualParentId].childrenIds, id] }
      }
    }));
    get().openFile(id);
    return id; // Explicitly returning the ID
  },

  createFolder: (parentId, name) => {
    const state = get();
    const actualParentId = state.files[parentId] ? parentId : 'root';

    const id = generateId();
    const newNode: FileNode = {
      id,
      name,
      type: 'folder',
      parentId: actualParentId,
      childrenIds: [],
      createdAt: Date.now(),
    };
    set(state => ({
      files: {
        ...state.files,
        [id]: newNode,
        [actualParentId]: { ...state.files[actualParentId], childrenIds: [...state.files[actualParentId].childrenIds, id] }
      },
      expandedFolders: [...state.expandedFolders, id]
    }));
    return id; // Explicitly returning the ID
  },

  createFileByPath: (path, content) => {
      const parts = path.split('/').filter(p => p.trim() !== '' && p !== '.');
      const fileName = parts.pop();
      if (!fileName) return '';

      const state = get();
      let currentParentId = 'root';
      let files = { ...state.files };
      let createdFolders: string[] = [];

      // Navigate or Create Folders
      for (const folderName of parts) {
          const parentNode = files[currentParentId];
          const existingFolderId = parentNode.childrenIds.find(
              cid => files[cid]?.name === folderName && files[cid]?.type === 'folder'
          );

          if (existingFolderId) {
              currentParentId = existingFolderId;
          } else {
              const newFolderId = generateId();
              files[newFolderId] = { id: newFolderId, name: folderName, type: 'folder', parentId: currentParentId, childrenIds: [], createdAt: Date.now() };
              files[currentParentId] = { ...files[currentParentId], childrenIds: [...files[currentParentId].childrenIds, newFolderId] };
              currentParentId = newFolderId;
              createdFolders.push(newFolderId);
          }
      }

      const parentNode = files[currentParentId];
      const existingFileId = parentNode.childrenIds.find(cid => files[cid]?.name === fileName && files[cid]?.type === 'file');
      
      let fileId = existingFileId || generateId();

      // Create or Update File
      files[fileId] = {
          id: fileId,
          name: fileName,
          type: 'file',
          parentId: currentParentId,
          childrenIds: [],
          content: content,
          language: getLanguageFromFilename(fileName),
          createdAt: Date.now()
      };

      if (!existingFileId) {
          files[currentParentId] = { ...files[currentParentId], childrenIds: [...files[currentParentId].childrenIds, fileId] };
      }

      set(s => ({
          files: files,
          expandedFolders: Array.from(new Set([...s.expandedFolders, ...createdFolders])),
          unsavedChanges: new Set(s.unsavedChanges).add(fileId)
      }));
      
      // Auto save to persistence
      saveWorkspace({ files, openTabs: get().openTabs, activeTabId: get().activeTabId, expandedFolders: get().expandedFolders });
      
      return fileId; // Explicitly returning the ID
  },

  getFileByPath: (path) => {
      const parts = path.split('/').filter(p => p.trim() !== '' && p !== '.');
      const state = get();
      let currentId = 'root';

      for (const part of parts) {
          const node = state.files[currentId];
          if (!node) return undefined;
          const nextId = node.childrenIds.find(cid => state.files[cid]?.name === part);
          if (!nextId) return undefined;
          currentId = nextId;
      }
      return state.files[currentId];
  },

  deleteFileByPath: (path) => {
      const node = get().getFileByPath(path);
      if (node) get().deleteNode(node.id);
  },

  deleteNode: (id) => {
    set(state => {
      const node = state.files[id];
      if (!node || !node.parentId) return state; 
      const parent = state.files[node.parentId];
      const parentChildren = parent.childrenIds.filter(cid => cid !== id);
      const newFiles = deleteRecursive(state.files, id);
      newFiles[node.parentId] = { ...parent, childrenIds: parentChildren };
      const newOpenTabs = state.openTabs.filter(tid => newFiles[tid]);
      const newState = { ...state, files: newFiles, openTabs: newOpenTabs, activeTabId: state.activeTabId === id ? (newOpenTabs[0] || null) : state.activeTabId };
      saveWorkspace(newState);
      return newState;
    });
  },

  renameNode: (id, newName) => {
    set(state => {
      const newFiles = { ...state.files, [id]: { ...state.files[id], name: newName, language: state.files[id].type === 'file' ? getLanguageFromFilename(newName) : undefined } };
      saveWorkspace({ ...state, files: newFiles });
      return { files: newFiles };
    });
  },

  moveNode: (id, newParentId) => {
    const state = get();
    if (isDescendant(state.files, newParentId, id) || id === newParentId) return;
    set(state => {
        const node = state.files[id];
        const oldParentId = node.parentId!;
        const newFiles = {
            ...state.files,
            [oldParentId]: { ...state.files[oldParentId], childrenIds: state.files[oldParentId].childrenIds.filter(cid => cid !== id) },
            [newParentId]: { ...state.files[newParentId], childrenIds: [...state.files[newParentId].childrenIds, id] },
            [id]: { ...node, parentId: newParentId }
        };
        saveWorkspace({ ...state, files: newFiles });
        return { files: newFiles };
    });
  },

  updateFileContent: (id, content) => {
    set(state => ({
      files: { ...state.files, [id]: { ...state.files[id], content } },
      unsavedChanges: new Set(state.unsavedChanges).add(id)
    }));
  },

  markSaved: (id) => {
    set(state => {
      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.delete(id);
      saveWorkspace(get());
      return { unsavedChanges: newUnsaved };
    });
  },

  saveAll: () => {
    saveWorkspace(get());
    set({ unsavedChanges: new Set() });
    useNotificationStore.getState().addNotification('success', 'Workspace Saved');
  },

  closeWorkspace: () => {
      const root = { 'root': { id: 'root', name: 'root', type: 'folder', parentId: null, childrenIds: [], createdAt: Date.now() } };
      set({ files: root, openTabs: [], activeTabId: null, expandedFolders: ['root'], unsavedChanges: new Set() });
      saveWorkspace(get());
  },

  openFile: (id) => {
    set(state => ({
      openTabs: state.openTabs.includes(id) ? state.openTabs : [...state.openTabs, id],
      activeTabId: id
    }));
    saveWorkspace(get());
  },

  closeTab: (id) => {
    set(state => {
      const newTabs = state.openTabs.filter(tid => tid !== id);
      return { openTabs: newTabs, activeTabId: state.activeTabId === id ? (newTabs[newTabs.length - 1] || null) : state.activeTabId };
    });
    saveWorkspace(get());
  },

  setActiveTab: (id) => set({ activeTabId: id }),
  toggleFolder: (id) => set(state => ({ expandedFolders: state.expandedFolders.includes(id) ? state.expandedFolders.filter(f => f !== id) : [...state.expandedFolders, id] })),
  requestScrollToLine: (fileId, lineNumber) => set({ pendingScroll: { fileId, lineNumber } }),
  clearPendingScroll: () => set({ pendingScroll: null }),
  importWorkspaceData: (newFiles) => { set({ files: newFiles, openTabs: [], activeTabId: null, expandedFolders: ['root'] }); saveWorkspace(get()); }
}));