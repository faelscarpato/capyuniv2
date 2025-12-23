export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    default:
      return 'plaintext';
  }
};

export const sortNodes = (nodes: any[], allFiles: any) => {
  return nodes.sort((aId, bId) => {
    const a = allFiles[aId];
    const b = allFiles[bId];
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'folder' ? -1 : 1;
  });
};

export const getFileIconInfo = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Special files
    if (filename === 'package.json') return { name: 'Package', color: 'text-red-400' };
    if (filename.startsWith('.git')) return { name: 'GitBranch', color: 'text-red-400' };
    if (filename.includes('config') || filename.startsWith('.')) return { name: 'Settings', color: 'text-gray-400' };
    
    switch (ext) {
      case 'ts':
      case 'tsx':
        return { name: 'FileCode', color: 'text-blue-500' };
      case 'js':
      case 'jsx':
        return { name: 'FileCode', color: 'text-yellow-400' };
      case 'css':
      case 'scss':
      case 'less':
        return { name: 'Hash', color: 'text-blue-300' };
      case 'html':
        return { name: 'Code', color: 'text-orange-500' };
      case 'json':
        return { name: 'FileJson', color: 'text-yellow-200' };
      case 'md':
      case 'txt':
        return { name: 'FileText', color: 'text-blue-200' };
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return { name: 'Image', color: 'text-purple-400' };
      case 'zip':
      case 'rar':
      case '7z':
        return { name: 'FileArchive', color: 'text-orange-300' };
      default:
        return { name: 'File', color: 'text-gray-400' };
    }
};