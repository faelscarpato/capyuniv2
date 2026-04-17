import { describe, it, expect, vi, beforeEach } from 'vitest';
import { localSnapshotService } from '../platform/snapshots/services/localSnapshotService';
import type { FileSystem } from '../types';

vi.mock('idb-keyval', () => ({
  get: vi.fn(() => Promise.resolve([])),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve())
}));

describe('localSnapshotService', () => {
  const mockFiles: FileSystem = {
    root: {
      id: 'root',
      name: 'root',
      type: 'folder',
      parentId: null,
      childrenIds: ['test.js'],
      createdAt: Date.now()
    },
    'test.js': {
      id: 'test.js',
      name: 'test.js',
      type: 'file',
      parentId: 'root',
      content: 'console.log("test")',
      createdAt: Date.now()
    }
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a snapshot with generated id', async () => {
    const snapshot = await localSnapshotService.create(mockFiles, 'manual');
    
    expect(snapshot.id).toMatch(/^snap-/);
    expect(snapshot.createdAt).toBeDefined();
    expect(snapshot.reason).toBe('manual');
    expect(snapshot.files).toEqual(mockFiles);
  });

  it('should create snapshot with custom name', async () => {
    const snapshot = await localSnapshotService.create(mockFiles, 'manual', 'My backup');
    
    expect(snapshot.name).toBe('My backup');
  });

  it('should create autosave snapshot', async () => {
    const snapshot = await localSnapshotService.create(mockFiles, 'autosave');
    
    expect(snapshot.reason).toBe('autosave');
  });

  it('should create import snapshot', async () => {
    const snapshot = await localSnapshotService.create(mockFiles, 'import');
    
    expect(snapshot.reason).toBe('import');
  });
});