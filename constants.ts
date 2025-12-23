import { FileSystem } from './types';

export const INITIAL_FILES: FileSystem = {
  'root': {
    id: 'root',
    name: 'root',
    type: 'folder',
    parentId: null,
    childrenIds: ['folder-1', 'file-1', 'file-2'],
    createdAt: Date.now(),
  },
  'folder-1': {
    id: 'folder-1',
    name: 'src',
    type: 'folder',
    parentId: 'root',
    childrenIds: ['file-3'],
    createdAt: Date.now(),
  },
  'file-1': {
    id: 'file-1',
    name: 'welcome.md',
    type: 'file',
    parentId: 'root',
    childrenIds: [],
    content: '# Welcome to CapyUNI Codium\n\nThis is a persistent Web IDE.\n\n- Create files\n- Edit code\n- Your changes are saved to IndexedDB automatically.',
    language: 'markdown',
    createdAt: Date.now(),
  },
  'file-2': {
    id: 'file-2',
    name: 'index.ts',
    type: 'file',
    parentId: 'root',
    childrenIds: [],
    content: 'console.log("Hello CapyUNI!");',
    language: 'typescript',
    createdAt: Date.now(),
  },
  'file-3': {
    id: 'file-3',
    name: 'utils.js',
    type: 'file',
    parentId: 'folder-1',
    childrenIds: [],
    content: 'export const add = (a, b) => a + b;',
    language: 'javascript',
    createdAt: Date.now(),
  }
};
