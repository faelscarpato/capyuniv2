import JSZip from 'jszip';
import saveAs from 'file-saver';
import { FileNode, FileSystem } from '../types';
import { generateId } from './ids';
import { getLanguageFromFilename } from './fileUtils';

export const exportWorkspaceToZip = async (files: FileSystem) => {
  const zip = new JSZip();

  // Helper to traverse
  const addFolderToZip = (folderId: string, currentZipFolder: JSZip) => {
    const folder = files[folderId];
    if (!folder) return;

    folder.childrenIds.forEach(childId => {
      const child = files[childId];
      if (!child) return;

      if (child.type === 'folder') {
        const newZipFolder = currentZipFolder.folder(child.name);
        if (newZipFolder) {
          addFolderToZip(child.id, newZipFolder);
        }
      } else {
        // It's a file
        currentZipFolder.file(child.name, child.content || '');
      }
    });
  };

  // Start from root children
  addFolderToZip('root', zip);

  // Add metadata
  zip.file('.capy/metadata.json', JSON.stringify({
    exportedAt: Date.now(),
    appName: 'CapyUNI Codium'
  }));

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'capy-workspace.zip');
};

export const importWorkspaceFromZip = async (file: File): Promise<FileSystem | null> => {
  try {
    // Robust reading for mobile compatibility: Read as ArrayBuffer first
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) resolve(e.target.result as ArrayBuffer);
            else reject(new Error("Failed to read file"));
        };
        reader.onerror = () => reject(new Error("File reading error"));
        reader.readAsArrayBuffer(file);
    });

    const zip = await JSZip.loadAsync(arrayBuffer);
    const newFiles: FileSystem = {};
    
    // 1. Initialize root
    newFiles['root'] = {
      id: 'root',
      name: 'root',
      type: 'folder',
      parentId: null,
      childrenIds: [],
      createdAt: Date.now()
    };

    // Helper to find or create a folder path
    const ensurePathExists = (pathParts: string[]): string => {
        let currentParentId = 'root';

        for (const part of pathParts) {
            if (!part || part.trim() === '') continue;

            // Check if this folder already exists in the current parent
            const parentNode = newFiles[currentParentId];
            if (!parentNode) break; // Safety check

            const existingFolderId = parentNode.childrenIds.find(childId => {
                const child = newFiles[childId];
                return child && child.name === part && child.type === 'folder';
            });

            if (existingFolderId) {
                currentParentId = existingFolderId;
            } else {
                // Create new folder
                const newFolderId = generateId();
                newFiles[newFolderId] = {
                    id: newFolderId,
                    name: part,
                    type: 'folder',
                    parentId: currentParentId,
                    childrenIds: [],
                    createdAt: Date.now()
                };
                
                // Link to parent
                newFiles[currentParentId].childrenIds.push(newFolderId);
                currentParentId = newFolderId;
            }
        }
        return currentParentId;
    };

    // 2. Process all files in the zip
    const filenames = Object.keys(zip.files).filter(name => {
         return !name.startsWith('__MACOSX/') && !name.startsWith('.capy/') && !name.endsWith('.DS_Store');
    });

    for (const filename of filenames) {
        const zipObj = zip.files[filename];
        const parts = filename.split('/').filter(p => p !== '');

        if (zipObj.dir) {
            // It's an explicit folder entry
            ensurePathExists(parts);
        } else {
            // It's a file
            const fileName = parts.pop(); // Remove filename from path
            if (!fileName) continue;

            // Ensure directory structure exists (handle implicit folders)
            const parentId = ensurePathExists(parts);
            
            // Read content
            const content = await zipObj.async('string');
            const newFileId = generateId();

            newFiles[newFileId] = {
                id: newFileId,
                name: fileName,
                type: 'file',
                parentId: parentId,
                childrenIds: [],
                content: content,
                language: getLanguageFromFilename(fileName),
                createdAt: Date.now()
            };

            // Link to parent
            if (newFiles[parentId]) {
                newFiles[parentId].childrenIds.push(newFileId);
            }
        }
    }

    return newFiles;
  } catch (error) {
    console.error("Failed to import zip", error);
    return null;
  }
};