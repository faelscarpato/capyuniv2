import React, { useEffect, useMemo, useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Icon } from '../ui/Icon';
import { useWorkspaceActionDialogStore } from '../../features/productivity/workspace-actions/store/workspaceActionDialogStore';

export const WorkspaceActionDialogModal: React.FC = () => {
  const { isOpen, mode, parentId, targetId, nodeName, close } = useWorkspaceActionDialogStore();
  const { createFile, createFolder, deleteNode, renameNode } = useWorkspaceStore();
  const { addNotification } = useNotificationStore();
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'rename-node') {
      setNameInput(nodeName);
      return;
    }
    setNameInput('');
  }, [isOpen, mode]);

  const dialogMeta = useMemo(() => {
    if (mode === 'create-file') {
      return {
        title: 'Novo Arquivo',
        description: 'Defina o nome do arquivo.',
        confirmLabel: 'Criar Arquivo',
        placeholder: 'ex: App.tsx'
      };
    }

    if (mode === 'create-folder') {
      return {
        title: 'Nova Pasta',
        description: 'Defina o nome da pasta.',
        confirmLabel: 'Criar Pasta',
        placeholder: 'ex: components'
      };
    }

    if (mode === 'delete-node') {
      return {
        title: 'Excluir Item',
        description: `Deseja realmente excluir "${nodeName}"?`,
        confirmLabel: 'Excluir',
        placeholder: ''
      };
    }

    if (mode === 'rename-node') {
      return {
        title: 'Renomear Item',
        description: `Defina o novo nome para "${nodeName}".`,
        confirmLabel: 'Renomear',
        placeholder: 'Novo nome'
      };
    }

    return null;
  }, [mode, nodeName]);

  if (!isOpen || !mode || !dialogMeta) return null;

  const handleConfirm = () => {
    if (mode === 'create-file') {
      const value = nameInput.trim();
      if (!value) {
        addNotification('warning', 'Informe um nome de arquivo.');
        return;
      }
      createFile(parentId || 'root', value);
      addNotification('success', 'Arquivo criado.');
      close();
      return;
    }

    if (mode === 'create-folder') {
      const value = nameInput.trim();
      if (!value) {
        addNotification('warning', 'Informe um nome de pasta.');
        return;
      }
      createFolder(parentId || 'root', value);
      addNotification('success', 'Pasta criada.');
      close();
      return;
    }

    if (mode === 'delete-node' && targetId) {
      deleteNode(targetId);
      addNotification('success', 'Item removido.');
      close();
    }

    if (mode === 'rename-node' && targetId) {
      const value = nameInput.trim();
      if (!value) {
        addNotification('warning', 'Informe o novo nome.');
        return;
      }
      if (value === nodeName) {
        close();
        return;
      }
      renameNode(targetId, value);
      addNotification('success', 'Item renomeado.');
      close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-[420px] bg-ide-activity border border-ide-border rounded-2xl p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">{dialogMeta.title}</h3>
          <button onClick={close} className="text-ide-muted hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <p className="text-sm text-ide-muted mb-4">{dialogMeta.description}</p>

        {mode !== 'delete-node' && (
          <input
            autoFocus
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder={dialogMeta.placeholder}
            className="w-full bg-ide-input border border-ide-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-ide-accent"
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleConfirm();
            }}
          />
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={close}
            className="px-3 py-2 text-sm rounded-lg border border-ide-border text-ide-muted hover:text-white hover:border-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className={`px-3 py-2 text-sm rounded-lg font-semibold transition-colors ${
              mode === 'delete-node'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-ide-accent hover:bg-opacity-90 text-white'
            }`}
          >
            {dialogMeta.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
