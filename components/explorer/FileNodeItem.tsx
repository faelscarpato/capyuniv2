import React, { useState } from 'react';
import { FileNode } from '../../types';
import { Icon } from '../ui/Icon';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { getFileIconInfo } from '../../lib/fileUtils';
import { executeContextCommand } from '../../core/commands/handlers/registerDefaultCommands';

interface Props {
  node: FileNode;
  depth: number;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export const FileNodeItem: React.FC<Props> = ({ node, depth, onContextMenu }) => {
  const {
    expandedFolders, activeTabId
  } = useWorkspaceStore();

  const [isDragOver, setIsDragOver] = useState(false);

  const isExpanded = expandedFolders.includes(node.id);
  const isActive = activeTabId === node.id;
  const isFolder = node.type === 'folder';

  // Determine icon
  const fileIconInfo = !isFolder ? getFileIconInfo(node.name) : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      executeContextCommand('workspace.toggleFolder', { nodeId: node.id });
    } else {
      executeContextCommand('workspace.openNode', { nodeId: node.id });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.id);
  };

  // Drag Events
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder && !isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && isFolder) {
      executeContextCommand('workspace.moveNode', { nodeId: draggedId, newParentId: node.id });
      if (!expandedFolders.includes(node.id)) {
        executeContextCommand('workspace.toggleFolder', { nodeId: node.id });
      }
    }
  };

  // IMPORTANT: Since we use nested borders in FileTree.tsx for indentation lines, 
  // we do NOT multiply padding by depth here anymore. We use a fixed small padding.
  // The indentation comes from the nested divs.
  const paddingLeft = `4px`;

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex items-center py-1.5 px-2 cursor-pointer text-[13px] md:text-sm select-none rounded-lg transition-all duration-200 group
        ${isActive
          ? 'bg-ide-accent/10 text-white font-medium'
          : 'text-ide-muted hover:bg-ide-hover hover:text-white'
        }
        ${isDragOver ? 'bg-ide-accent/20 ring-2 ring-inset ring-ide-accent' : ''}
      `}
      style={{ paddingLeft }}
    >
      <span className="mr-2 flex-shrink-0 text-ide-muted group-hover:text-white transition-colors">
        {isFolder ? (
          <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} size={14} />
        ) : (
          <div className="w-3.5" />
        )}
      </span>

      <span className="mr-1.5 flex-shrink-0">
        {isFolder ? (
          <Icon name={isExpanded ? 'FolderOpen' : 'Folder'} size={16} className="text-ide-secondary" />
        ) : (
          <Icon name={fileIconInfo?.name as any} size={16} className={fileIconInfo?.color} />
        )}
      </span>

      <span className="truncate">{node.name}</span>
    </div>
  );
};
