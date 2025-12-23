import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { FileNodeItem } from './FileNodeItem';
import { sortNodes } from '../../lib/fileUtils';
import { FileNode } from '../../types';

interface Props {
  parentId: string | null;
  depth?: number;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export const FileTree: React.FC<Props> = ({ parentId, depth = 0, onContextMenu }) => {
  const { files, expandedFolders } = useWorkspaceStore();
  
  // Find children of parentId
  const childrenIds = parentId 
    ? files[parentId]?.childrenIds || []
    : Object.values(files).filter((f: FileNode) => f.parentId === null).map((f: FileNode) => f.id);

  const sortedChildrenIds = sortNodes(childrenIds, files);

  if (childrenIds.length === 0) return null;

  return (
    // If not root, apply left border for indentation guide look
    // 'ml-3' pushes it right, 'pl-1' adds space inside.
    // The visual effect mimics VS Code tree lines.
    <div className={depth > 0 ? "ml-3 pl-1 border-l border-white/10" : ""}>
      {sortedChildrenIds.map(childId => {
        const node = files[childId];
        if (!node) return null;

        const isExpanded = node.type === 'folder' && expandedFolders.includes(node.id);

        return (
          <div key={node.id}>
            <FileNodeItem 
                node={node} 
                depth={depth} 
                onContextMenu={onContextMenu}
            />
            {isExpanded && (
              <FileTree 
                parentId={node.id} 
                depth={depth + 1} 
                onContextMenu={onContextMenu}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};