import type { FileNode, FileSystem } from '../../../types';

const normalizeParts = (path: string): string[] => {
  return path
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part !== '' && part !== '.');
};

export const workspacePathService = {
  splitPath: (path: string): string[] => normalizeParts(path),

  getPathForId: (files: FileSystem, id: string): string => {
    let current = files[id];
    if (!current || id === 'root') return '';
    const pathArr = [current.name];
    while (current.parentId && current.parentId !== 'root') {
      current = files[current.parentId];
      pathArr.unshift(current.name);
    }
    return pathArr.join('/');
  },

  getAbsolutePathForId: (files: FileSystem, id: string): string => {
    const relative = workspacePathService.getPathForId(files, id);
    return relative ? `/${relative}` : '/';
  },

  getFileByPath: (files: FileSystem, path: string): FileNode | undefined => {
    const parts = normalizeParts(path);
    let currentId = 'root';

    for (const part of parts) {
      const node = files[currentId];
      if (!node) return undefined;
      const nextId = node.childrenIds.find((childId) => files[childId]?.name === part);
      if (!nextId) return undefined;
      currentId = nextId;
    }

    return files[currentId];
  }
};

