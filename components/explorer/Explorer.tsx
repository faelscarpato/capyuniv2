import React, { useState } from 'react';
import { FileTree } from './FileTree';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { Icon } from '../ui/Icon';
import { executeAppCommand, executeContextCommand } from '../../core/commands/handlers/registerDefaultCommands';

export const Explorer: React.FC = () => {
  const { files, moveNode } = useWorkspaceStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null; isOpen: boolean }>(
    {
      x: 0,
      y: 0,
      targetId: null,
      isOpen: false
    }
  );

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetId: id,
      isOpen: true
    });
  };

  const getParentForCreation = (): string => {
    if (!contextMenu.targetId) return 'root';
    const node = files[contextMenu.targetId];
    if (!node) return 'root';
    if (node.type === 'folder') return node.id;
    return node.parentId || 'root';
  };

  const handleCreateFile = () => {
    executeContextCommand('workspace.createFileInParent', { parentId: getParentForCreation() });
  };

  const handleCreateFolder = () => {
    executeContextCommand('workspace.createFolderInParent', { parentId: getParentForCreation() });
  };

  const handleRename = () => {
    if (!contextMenu.targetId) return;
    executeContextCommand('workspace.renameNode', { nodeId: contextMenu.targetId });
  };

  const handleDelete = () => {
    if (!contextMenu.targetId) return;
    executeContextCommand('workspace.deleteNode', { nodeId: contextMenu.targetId });
  };

  const handleOpenTerminal = () => {
    executeContextCommand('workspace.openInTerminal', { nodeId: contextMenu.targetId || 'root' });
  };

  const handlePreview = () => {
    if (!contextMenu.targetId) return;
    executeContextCommand('workspace.previewNode', { nodeId: contextMenu.targetId });
  };

  const handleBgContextMenu = (e: React.MouseEvent) => {
    if (contextMenu.isOpen) return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetId: 'root',
      isOpen: true
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId) {
      moveNode(draggedId, 'root');
    }
  };

  const getMenuItems = (): ContextMenuItem[] => {
    const node = contextMenu.targetId ? files[contextMenu.targetId] : null;
    const isFolder = node?.type === 'folder';
    const isRoot = !node || contextMenu.targetId === 'root';

    if (isRoot) {
      return [
        { label: 'Novo Arquivo', onClick: handleCreateFile },
        { label: 'Nova Pasta', onClick: handleCreateFolder },
        { label: '', onClick: () => {}, separator: true },
        { label: 'Abrir no Terminal Integrado', onClick: handleOpenTerminal },
        { label: 'Sincronizar Repositório', onClick: () => executeAppCommand('workspace.syncFromPTY') }
      ];
    }

    const items: ContextMenuItem[] = [];

    if (isFolder) {
      items.push(
        { label: 'Novo Arquivo', onClick: handleCreateFile },
        { label: 'Nova Pasta', onClick: handleCreateFolder },
        { label: '', onClick: () => {}, separator: true }
      );
    } else {
      items.push(
        { label: 'Abrir', onClick: () => executeContextCommand('workspace.openNode', { nodeId: node?.id }) },
        { label: 'Mostrar Versão Prévia', onClick: handlePreview },
        { label: '', onClick: () => {}, separator: true }
      );
    }

    items.push(
      { label: 'Recortar', onClick: () => {}, shortcut: 'Ctrl+X' },
      { label: 'Copiar', onClick: () => {}, shortcut: 'Ctrl+C' },
      { label: 'Colar', onClick: () => {}, shortcut: 'Ctrl+V' },
      { label: '', onClick: () => {}, separator: true },
      { label: 'Renomear', onClick: handleRename, shortcut: 'F2' },
      { label: 'Excluir', onClick: handleDelete, danger: true },
      { label: '', onClick: () => {}, separator: true },
      { label: 'Copiar Caminho', onClick: () => node && navigator.clipboard.writeText(node.name) },
      { label: 'Abrir no Terminal Integrado', onClick: handleOpenTerminal }
    );

    return items;
  };

  return (
    <div
      className="h-full flex flex-col bg-ide-sidebar text-ide-text select-none border-r border-ide-border/50"
      onContextMenu={handleBgContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-5 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-ide-muted">
        <span>Explorer</span>
        <div className="flex gap-3">
          <button
            type="button"
            title="Sincronizar"
            className="text-ide-muted hover:text-white transition-colors active:scale-90"
            onClick={() => executeAppCommand('workspace.syncFromPTY')}
          >
            <Icon name="RefreshCw" size={14} />
          </button>
          <button
            type="button"
            title="Novo Arquivo"
            className="text-ide-muted hover:text-white transition-colors active:scale-90"
            onClick={() => {
              setContextMenu({ x: 0, y: 0, targetId: 'root', isOpen: false });
              handleCreateFile();
            }}
          >
            <Icon name="FilePlus" size={16} />
          </button>
          <button
            type="button"
            title="Nova Pasta"
            className="text-ide-muted hover:text-white transition-colors active:scale-90"
            onClick={() => {
              setContextMenu({ x: 0, y: 0, targetId: 'root', isOpen: false });
              handleCreateFolder();
            }}
          >
            <Icon name="FolderPlus" size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6 px-2">
        <div className="px-3 py-2 flex items-center gap-2 font-bold text-xs cursor-pointer text-white/90 hover:bg-ide-hover rounded-lg transition-all mb-2 group">
          <div className="w-5 h-5 flex items-center justify-center rounded-md bg-ide-accent/10 text-ide-accent group-hover:bg-ide-accent group-hover:text-white transition-all">
            <Icon name="Layers" size={12} />
          </div>
          <span className="tracking-wide">CAPYUNI_V2</span>
          <Icon name="ChevronDown" size={12} className="ml-auto text-ide-muted" />
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

