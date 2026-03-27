import type { FileSystem } from '../../../types';
import { workspaceSyncAdapter } from './workspaceSyncAdapter';

interface WorkspaceSyncListeners {
  onFileContent: (path: string, content: string) => void;
  onScanSuccess: (files: FileSystem) => void;
  onError: (message: string) => void;
}

export const workspaceSyncBridge = {
  syncFile: (path: string, content: string): void => {
    workspaceSyncAdapter.syncFile(path, content);
  },

  deleteFile: (path: string): void => {
    workspaceSyncAdapter.deleteFile(path);
  },

  readFile: (path: string): void => {
    workspaceSyncAdapter.readFile(path);
  },

  requestScan: (): void => {
    workspaceSyncAdapter.requestScan();
  },

  syncAllFiles: (files: FileSystem, getPathForId: (id: string) => string): void => {
    workspaceSyncAdapter.syncAllFiles(files, getPathForId);
  },

  bind: (listeners: WorkspaceSyncListeners, getCurrentFiles: () => FileSystem): (() => void) => {
    return workspaceSyncAdapter.bindListeners(listeners, getCurrentFiles);
  }
};

