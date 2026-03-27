import type { FileNode, FileSystem } from '../../../types';
import { generateId } from '../../../lib/ids';
import { getLanguageFromFilename } from '../../../lib/fileUtils';
import { terminalSync } from '../../../lib/terminalSync';

interface SyncListeners {
  onFileContent: (path: string, content: string) => void;
  onScanSuccess: (files: FileSystem) => void;
  onError: (message: string) => void;
}

const nestedToFlat = (
  items: any[],
  parentId: string,
  currentFiles: FileSystem
): FileSystem => {
  let flat: FileSystem = {};

  for (const item of items) {
    const existing = Object.values(currentFiles).find(
      (node) => node.name === item.name && node.parentId === parentId
    );
    const id = existing?.id || generateId();

    const node: FileNode = {
      id,
      name: item.name,
      type: item.type,
      parentId,
      childrenIds: [],
      content: item.content || existing?.content,
      createdAt: existing?.createdAt || Date.now(),
      language: item.type === 'file' ? getLanguageFromFilename(item.name) : undefined
    };

    flat[id] = node;

    if (item.children && item.children.length > 0) {
      const childrenFlat = nestedToFlat(item.children, id, currentFiles);
      node.childrenIds = Object.keys(childrenFlat).filter((childId) => childrenFlat[childId].parentId === id);
      flat = { ...flat, ...childrenFlat };
    }
  }

  return flat;
};

export const workspaceSyncAdapter = {
  syncFile: (path: string, content: string): void => {
    terminalSync.syncFile(path, content);
  },

  deleteFile: (path: string): void => {
    terminalSync.deleteFile(path);
  },

  readFile: (path: string): void => {
    terminalSync.readFile(path);
  },

  requestScan: (): void => {
    terminalSync.requestScan();
  },

  syncAllFiles: (files: FileSystem, getPathForId: (id: string) => string): void => {
    Object.values(files).forEach((node) => {
      if (node.type === 'file' && node.content !== undefined) {
        const path = getPathForId(node.id);
        if (path) terminalSync.syncFile(path, node.content);
      }
    });
  },

  bindListeners: (listeners: SyncListeners, getCurrentFiles: () => FileSystem): (() => void) => {
    const onFileContent = listeners.onFileContent;
    const onError = listeners.onError;
    const onScanSuccess = (structure: any[]) => {
      const newRoot: FileSystem = {
        root: {
          id: 'root',
          name: 'root',
          type: 'folder',
          parentId: null,
          childrenIds: [],
          createdAt: Date.now()
        }
      };

      const scannedFlat = nestedToFlat(structure, 'root', getCurrentFiles());
      newRoot.root.childrenIds = Object.keys(scannedFlat).filter((id) => scannedFlat[id].parentId === 'root');
      listeners.onScanSuccess({ ...newRoot, ...scannedFlat });
    };

    terminalSync.onFileContent = onFileContent;
    terminalSync.onError = onError;
    terminalSync.onScanSuccess = onScanSuccess;

    return () => {
      if (terminalSync.onFileContent === onFileContent) terminalSync.onFileContent = null;
      if (terminalSync.onError === onError) terminalSync.onError = null;
      if (terminalSync.onScanSuccess === onScanSuccess) terminalSync.onScanSuccess = null;
    };
  }
};
