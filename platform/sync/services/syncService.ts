import type { FileSystem } from '../../../types';

export interface SyncTarget {
  uploadWorkspace: (files: FileSystem) => Promise<void>;
  downloadWorkspace: () => Promise<FileSystem | null>;
}

export class SyncService {
  constructor(private readonly target: SyncTarget) {}

  public async backup(files: FileSystem): Promise<void> {
    await this.target.uploadWorkspace(files);
  }

  public async restore(): Promise<FileSystem | null> {
    return this.target.downloadWorkspace();
  }
}

