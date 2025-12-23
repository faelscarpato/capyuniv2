import { useWorkspaceStore } from '../stores/workspaceStore';
import { FileNode } from '../types';

// Simple virtual CWD tracker since we are single session
let cwdId = 'root'; 

// Allow external components to change CWD (e.g., from Explorer context menu)
export const setTerminalCwd = (id: string) => {
    // Validate that it's a folder or root, otherwise use root
    const store = useWorkspaceStore.getState();
    const node = store.files[id];
    if (node && node.type === 'folder') {
        cwdId = id;
    } else if (node && node.parentId) {
        // If file, set to parent folder
        cwdId = node.parentId;
    } else {
        cwdId = 'root';
    }
};

const getFullPath = (id: string, files: any): string => {
    if (id === 'root') return '/';
    let path = '';
    let current = files[id];
    while (current && current.id !== 'root') {
        path = '/' + current.name + path;
        current = files[current.parentId];
    }
    return path || '/';
};

export const executeCommand = (input: string): string => {
  const args = input.trim().split(/\s+/);
  const cmd = args[0];
  const params = args.slice(1);
  const store = useWorkspaceStore.getState();
  const currentDir = store.files[cwdId];

  // Safety check if CWD was deleted externally
  if (!currentDir) {
      cwdId = 'root';
      return 'Error: Current directory lost. Resetting to root.';
  }

  // Helper to resolve child node by name in current directory
  const resolveChild = (name: string): FileNode | undefined => {
    const childId = currentDir.childrenIds.find(id => store.files[id]?.name === name);
    return childId ? store.files[childId] : undefined;
  };

  switch (cmd) {
    case 'help':
      return [
        'Available commands:',
        '  ls             List directory contents',
        '  cd <dir>       Change directory',
        '  pwd            Print working directory',
        '  cat <file>     Display file content',
        '  touch <file>   Create new file',
        '  mkdir <dir>    Create new directory',
        '  rm [-r] <item> Remove file or directory',
        '  echo <text>    Print text',
        '  clear          Clear terminal',
      ].join('\r\n');

    case 'ls': {
      const children = currentDir.childrenIds
        .map(id => store.files[id])
        .filter(Boolean);
        
      if (children.length === 0) return '';
      
      return children.map(f => {
          // Color folders blue-ish, files white
          return f.type === 'folder' ? `\x1b[1;34m${f.name}/\x1b[0m` : f.name;
      }).join('  ');
    }

    case 'cd': {
        if (params.length === 0) {
            cwdId = 'root';
            return '';
        }
        const targetName = params[0];
        
        if (targetName === '/') {
            cwdId = 'root';
            return '';
        }
        if (targetName === '.') return '';
        if (targetName === '..') {
            if (currentDir.parentId) {
                cwdId = currentDir.parentId;
            }
            return '';
        }

        const target = resolveChild(targetName);
        if (!target) return `cd: no such file or directory: ${targetName}`;
        if (target.type !== 'folder') return `cd: not a directory: ${targetName}`;
        
        cwdId = target.id;
        return '';
    }

    case 'pwd':
        return getFullPath(cwdId, store.files);

    case 'touch': {
      if (params.length === 0) return 'usage: touch <filename>';
      if (resolveChild(params[0])) return `Error: '${params[0]}' already exists.`;
      store.createFile(cwdId, params[0]);
      return '';
    }

    case 'mkdir': {
      if (params.length === 0) return 'usage: mkdir <dirname>';
      if (resolveChild(params[0])) return `Error: '${params[0]}' already exists.`;
      store.createFolder(cwdId, params[0]);
      return '';
    }

    case 'rm': {
        const isRecursive = params.includes('-r') || params.includes('-rf');
        const targets = params.filter(p => !p.startsWith('-'));
        
        if (targets.length === 0) return 'usage: rm [-r] <filename>';
        const fileName = targets[0];

        const target = resolveChild(fileName);
        if (!target) return `rm: cannot remove '${fileName}': No such file or directory`;
        
        if (target.type === 'folder' && !isRecursive) {
            return `rm: cannot remove '${fileName}': Is a directory`;
        }
        
        store.deleteNode(target.id);
        return '';
    }

    case 'cat': {
        if (params.length === 0) return 'usage: cat <filename>';
        const fileToRead = resolveChild(params[0]);
        if (!fileToRead) return `cat: ${params[0]}: No such file or directory`;
        if (fileToRead.type === 'folder') return `cat: ${params[0]}: Is a directory`;
        return fileToRead.content || '';
    }

    case 'echo':
        return params.join(' ');

    case 'clear':
        return '';

    default:
      return `capysh: command not found: ${cmd}`;
  }
};