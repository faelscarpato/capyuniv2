import React, { useState, useEffect, useRef } from 'react';
import { FileNode } from '../../types';
import { Icon } from '../ui/Icon';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { getFileIconInfo } from '../../lib/fileUtils';

interface Props {
  node: FileNode;
  depth: number;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export const FileNodeItem: React.FC<Props> = ({ node, depth, onContextMenu }) => {
  const {
    expandedFolders, toggleFolder, openFile, activeTabId, moveNode,
    renamingNodeId, setRenamingNodeId, renameNode
  } = useWorkspaceStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = expandedFolders.includes(node.id);
  const isActive = activeTabId === node.id;
  const isFolder = node.type === 'folder';
  const isRenaming = renamingNodeId === node.id;

  // Determine icon
  const fileIconInfo = !isFolder ? getFileIconInfo(node.name) : null;

  useEffect(() => {
    if (isRenaming) {
      setEditName(node.name);
      // Slight delay to allow render before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (!isFolder && node.name.includes('.')) {
            const lastDotIndex = node.name.lastIndexOf('.');
            inputRef.current.setSelectionRange(0, lastDotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isRenaming, node.name, isFolder]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRenaming) return;
    if (isFolder) {
      toggleFolder(node.id);
    } else {
      openFile(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isRenaming) return;
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.id);
  };

  // Drag Events
  const handleDragStart = (e: React.DragEvent) => {
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder && !isDragOver && !isRenaming) {
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
    if (draggedId && isFolder && !isRenaming) {
      moveNode(draggedId, node.id);
      if (!expandedFolders.includes(node.id)) {
        toggleFolder(node.id);
      }
    }
  };

  // Renaming Logic
  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== node.name) {
      renameNode(node.id, editName.trim());
    }
    setRenamingNodeId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setRenamingNodeId(null);
      setEditName(node.name);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.stopPropagation();
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
      draggable={!isRenaming}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex items-center py-1.5 px-2 cursor-pointer text-[13px] md:text-sm select-none rounded-lg transition-all duration-200 group
        ${isActive && !isRenaming
          ? 'bg-ide-accent/10 text-white font-medium'
          : 'text-ide-muted hover:bg-ide-hover hover:text-white'
        }
        ${isDragOver ? 'bg-ide-accent/20 ring-2 ring-inset ring-ide-accent' : ''}
        ${isRenaming ? 'bg-ide-input border border-ide-accent shadow-lg shadow-ide-accent/10' : ''}
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

      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-ide-bg text-white border border-ide-accent px-1 py-0.5 outline-none text-xs min-w-0"
        />
      ) : (
        <span className="truncate">{node.name}</span>
      )}
    </div>
  );
};