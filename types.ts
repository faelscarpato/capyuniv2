export type FileType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  childrenIds: string[];
  content?: string; // Only for files
  language?: string; // e.g. 'javascript', 'typescript', 'css'
  createdAt: number;
}

export interface FileSystem {
  [id: string]: FileNode;
}

export interface WorkspaceState {
  files: FileSystem;
  openTabs: string[]; // List of file IDs
  activeTabId: string | null;
  expandedFolders: string[]; // List of folder IDs
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuState {
  isOpen: boolean;
  position: ContextMenuPosition;
  targetId: string | null; // The file/folder ID right-clicked
}
