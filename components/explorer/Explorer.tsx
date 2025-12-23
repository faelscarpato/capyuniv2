import React, { useState } from 'react';
import { FileTree } from './FileTree';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { Icon } from '../ui/Icon';
import { setTerminalCwd } from '../../lib/terminalEngine';
import { useNotificationStore } from '../../stores/notificationStore';

export const Explorer: React.FC = () => {
  const { createFile, createFolder, deleteNode, setRenamingNodeId, files, moveNode, openFile } = useWorkspaceStore();
  const { setPanelOpen, setActivePanelTab, setPreviewFileId } = useUIStore();
  const { addNotification } = useNotificationStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null; isOpen: boolean }>({
    x: 0,
    y: 0,
    targetId: null,
    isOpen: false,
  });

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetId: id,
      isOpen: true,
    });
  };
  
  const getParentForCreation = () => {
      if (!contextMenu.targetId) return 'root';
      const node = files[contextMenu.targetId];
      if (!node) return 'root';
      if (node.type === 'folder') return node.id;
      return node.parentId || 'root';
  };

  const handleCreateFile = () => {
      const parentId = getParentForCreation();
      const name = prompt("Enter file name:");
      if (name) createFile(parentId, name);
  };

  const handleCreateFolder = () => {
      const parentId = getParentForCreation();
      const name = prompt("Enter folder name:");
      if (name) createFolder(parentId, name);
  };

  const handleRename = () => {
      if (!contextMenu.targetId) return;
      setRenamingNodeId(contextMenu.targetId);
  };

  const handleDelete = () => {
      if (!contextMenu.targetId) return;
      if (confirm("Are you sure you want to delete this?")) {
          deleteNode(contextMenu.targetId);
      }
  };

  const handleOpenTerminal = () => {
      let targetId = contextMenu.targetId || 'root';
      
      // If selected is a file, set CWD to its parent
      if (files[targetId] && files[targetId].type === 'file') {
          targetId = files[targetId].parentId || 'root';
      }

      setTerminalCwd(targetId);
      setActivePanelTab('TERMINAL');
      setPanelOpen(true);
  };

  const handlePreview = () => {
      // Set the specific file ID to be previewed
      setPreviewFileId(contextMenu.targetId);
      setActivePanelTab('PREVIEW');
      setPanelOpen(true);
  };

  const handleBgContextMenu = (e: React.MouseEvent) => {
      if(contextMenu.isOpen) return;
      e.preventDefault();
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          targetId: 'root',
          isOpen: true
      });
  }

  // Allow Dropping to Root
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId) {
          // If dropped on the empty area, move to root
          moveNode(draggedId, 'root');
      }
  };

  // Generate Menu Items based on selection type
  const getMenuItems = (): ContextMenuItem[] => {
      const node = contextMenu.targetId ? files[contextMenu.targetId] : null;
      const isFolder = node?.type === 'folder';
      const isRoot = !node || contextMenu.targetId === 'root';

      // 1. Background / Root Menu
      if (isRoot) {
          return [
            { label: 'Novo Arquivo', onClick: handleCreateFile },
            { label: 'Nova Pasta', onClick: handleCreateFolder },
            { label: '', onClick: () => {}, separator: true },
            { label: 'Abrir no Terminal Integrado', onClick: handleOpenTerminal },
          ];
      }

      const items: ContextMenuItem[] = [];

      // 2. Folder specific options
      if (isFolder) {
          items.push(
              { label: 'Novo Arquivo', onClick: handleCreateFile },
              { label: 'Nova Pasta', onClick: handleCreateFolder },
              { label: '', onClick: () => {}, separator: true },
          );
      } else {
          // 3. File specific options
          items.push(
              { label: 'Abrir', onClick: () => node && openFile(node.id) },
              { label: 'Abrir Lateralmente', onClick: () => addNotification('info', 'Split view not implemented yet') },
              { label: 'Mostrar Versão Prévia', onClick: handlePreview },
              { label: '', onClick: () => {}, separator: true },
          );
      }

      // Common Options
      items.push(
        { label: 'Recortar', onClick: () => {}, shortcut: 'Ctrl+X' },
        { label: 'Copiar', onClick: () => {}, shortcut: 'Ctrl+C' },
        { label: 'Colar', onClick: () => {}, shortcut: 'Ctrl+V' },
        { label: '', onClick: () => {}, separator: true },
        { label: 'Renomear', onClick: handleRename, shortcut: 'F2' },
        { label: 'Excluir', onClick: handleDelete, danger: true },
        { label: '', onClick: () => {}, separator: true },
        { label: 'Copiar Caminho', onClick: () => node && navigator.clipboard.writeText(node.name) },
        { label: 'Abrir no Terminal Integrado', onClick: handleOpenTerminal },
      );

      return items;
  };

  return (
    <div 
        className="h-full flex flex-col bg-ide-sidebar text-ide-text select-none" 
        onContextMenu={handleBgContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
        <span>Explorer</span>
        <div className="flex gap-2">
             <button className="hover:text-white" onClick={() => { setContextMenu({x:0, y:0, targetId: 'root', isOpen: false}); handleCreateFile() }}>
                 <Icon name="FilePlus" size={14} />
             </button>
             <button className="hover:text-white" onClick={() => { setContextMenu({x:0, y:0, targetId: 'root', isOpen: false}); handleCreateFolder() }}>
                 <Icon name="FolderPlus" size={14} />
             </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-4">
         <div className="px-4 py-1 flex items-center gap-1 font-bold text-sm cursor-pointer hover:text-white mb-1">
             <Icon name="ChevronDown" size={14} />
             <span>CAPYUNI-WORKSPACE</span>
         </div>
         <FileTree parentId="root" onContextMenu={handleContextMenu} />
      </div>

      {contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          items={getMenuItems()}
        />
      )}
    </div>
  );
};