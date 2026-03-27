import type { FileNode, FileSystem } from '../../../types';
import { generateId } from '../../../lib/ids';
import { getLanguageFromFilename } from '../../../lib/fileUtils';
import { workspacePathService } from './workspacePathService';

const deleteRecursive = (files: FileSystem, id: string): FileSystem => {
  const node = files[id];
  if (!node) return files;
  let nextFiles = { ...files };

  if (node.type === 'folder') {
    node.childrenIds.forEach((childId) => {
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

const resolveParentId = (files: FileSystem, parentId: string): string => {
  return files[parentId] ? parentId : 'root';
};

export const workspaceTreeService = {
  createFile: (files: FileSystem, parentId: string, name: string): { files: FileSystem; fileId: string } => {
    const actualParentId = resolveParentId(files, parentId);
    const id = generateId();

    const newNode: FileNode = {
      id,
      name,
      type: 'file',
      parentId: actualParentId,
      childrenIds: [],
      content: '',
      language: getLanguageFromFilename(name),
      createdAt: Date.now()
    };

    return {
      fileId: id,
      files: {
        ...files,
        [id]: newNode,
        [actualParentId]: {
          ...files[actualParentId],
          childrenIds: [...files[actualParentId].childrenIds, id]
        }
      }
    };
  },

  createFolder: (files: FileSystem, parentId: string, name: string): { files: FileSystem; folderId: string } => {
    const actualParentId = resolveParentId(files, parentId);
    const id = generateId();

    const newNode: FileNode = {
      id,
      name,
      type: 'folder',
      parentId: actualParentId,
      childrenIds: [],
      createdAt: Date.now()
    };

    return {
      folderId: id,
      files: {
        ...files,
        [id]: newNode,
        [actualParentId]: {
          ...files[actualParentId],
          childrenIds: [...files[actualParentId].childrenIds, id]
        }
      }
    };
  },

  createFileByPath: (
    files: FileSystem,
    path: string,
    content: string
  ): { files: FileSystem; fileId: string; createdFolders: string[] } => {
    const parts = workspacePathService.splitPath(path);
    const fileName = parts.pop();
    if (!fileName) {
      return { files, fileId: '', createdFolders: [] };
    }

    let currentParentId = 'root';
    let nextFiles = { ...files };
    const createdFolders: string[] = [];

    for (const folderName of parts) {
      const parentNode = nextFiles[currentParentId];
      const existingFolderId = parentNode.childrenIds.find(
        (childId) => nextFiles[childId]?.name === folderName && nextFiles[childId]?.type === 'folder'
      );

      if (existingFolderId) {
        currentParentId = existingFolderId;
      } else {
        const newFolderId = generateId();
        nextFiles[newFolderId] = {
          id: newFolderId,
          name: folderName,
          type: 'folder',
          parentId: currentParentId,
          childrenIds: [],
          createdAt: Date.now()
        };
        nextFiles[currentParentId] = {
          ...nextFiles[currentParentId],
          childrenIds: [...nextFiles[currentParentId].childrenIds, newFolderId]
        };
        currentParentId = newFolderId;
        createdFolders.push(newFolderId);
      }
    }

    const parentNode = nextFiles[currentParentId];
    const existingFileId = parentNode.childrenIds.find(
      (childId) => nextFiles[childId]?.name === fileName && nextFiles[childId]?.type === 'file'
    );

    const fileId = existingFileId || generateId();
    nextFiles[fileId] = {
      id: fileId,
      name: fileName,
      type: 'file',
      parentId: currentParentId,
      childrenIds: [],
      content,
      language: getLanguageFromFilename(fileName),
      createdAt: Date.now()
    };

    if (!existingFileId) {
      nextFiles[currentParentId] = {
        ...nextFiles[currentParentId],
        childrenIds: [...nextFiles[currentParentId].childrenIds, fileId]
      };
    }

    return { files: nextFiles, fileId, createdFolders };
  },

  deleteNode: (files: FileSystem, id: string): { files: FileSystem } => {
    const node = files[id];
    if (!node || !node.parentId) return { files };

    const parent = files[node.parentId];
    const parentChildren = parent.childrenIds.filter((childId) => childId !== id);
    const nextFiles = deleteRecursive(files, id);
    nextFiles[node.parentId] = { ...parent, childrenIds: parentChildren };
    return { files: nextFiles };
  },

  renameNode: (files: FileSystem, id: string, newName: string): FileSystem => {
    return {
      ...files,
      [id]: {
        ...files[id],
        name: newName,
        language: files[id].type === 'file' ? getLanguageFromFilename(newName) : undefined
      }
    };
  },

  moveNode: (files: FileSystem, id: string, newParentId: string): FileSystem | null => {
    if (isDescendant(files, newParentId, id) || id === newParentId) return null;

    const node = files[id];
    if (!node?.parentId || !files[newParentId]) return null;

    const oldParentId = node.parentId;
    return {
      ...files,
      [oldParentId]: {
        ...files[oldParentId],
        childrenIds: files[oldParentId].childrenIds.filter((childId) => childId !== id)
      },
      [newParentId]: {
        ...files[newParentId],
        childrenIds: [...files[newParentId].childrenIds, id]
      },
      [id]: { ...node, parentId: newParentId }
    };
  }
};

