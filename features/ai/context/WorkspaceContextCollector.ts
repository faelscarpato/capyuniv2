import type { FileNode, FileSystem } from '../../../types';

const toPath = (files: FileSystem, id: string): string => {
  const node = files[id];
  if (!node || id === 'root') return '';

  const segments = [node.name];
  let cursor = node;
  while (cursor.parentId && cursor.parentId !== 'root') {
    cursor = files[cursor.parentId];
    if (!cursor) break;
    segments.unshift(cursor.name);
  }
  return segments.join('/');
};

export interface WorkspaceContext {
  structure: string[];
  activeFile?: { path: string; content: string };
  relatedFiles: Array<{ path: string; content: string }>;
}

export const collectWorkspaceContext = (params: {
  files: FileSystem;
  activeTabId: string | null;
  userMessage: string;
  maxRelatedFiles?: number;
}): WorkspaceContext => {
  const maxRelatedFiles = params.maxRelatedFiles || 4;
  const userMessage = params.userMessage.toLowerCase();
  const fileNodes = Object.values(params.files).filter((node): node is FileNode => node.type === 'file');

  const structure = fileNodes.map((node) => toPath(params.files, node.id)).filter(Boolean);
  const activeFileNode = params.activeTabId ? params.files[params.activeTabId] : undefined;
  const activeFile = activeFileNode && activeFileNode.type === 'file'
    ? {
        path: toPath(params.files, activeFileNode.id),
        content: activeFileNode.content || ''
      }
    : undefined;

  const relatedFiles = fileNodes
    .filter((node) => activeFileNode?.id !== node.id && userMessage.includes(node.name.toLowerCase()))
    .slice(0, maxRelatedFiles)
    .map((node) => ({
      path: toPath(params.files, node.id),
      content: node.content || ''
    }));

  return { structure, activeFile, relatedFiles };
};

