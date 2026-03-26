import type { FileSystem } from '../../../types';
import { exportWorkspaceToZip, importWorkspaceFromZip } from '../../../lib/zip';

export const workspacePackageService = {
  exportZip: async (files: FileSystem): Promise<void> => {
    await exportWorkspaceToZip(files);
  },
  importZip: async (file: File): Promise<FileSystem | null> => {
    return importWorkspaceFromZip(file);
  }
};

