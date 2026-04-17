import React, { useEffect, useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Icon } from '../ui/Icon';
import type { FileSystem } from '../../types';
import { localSnapshotService, type WorkspaceSnapshotRecord } from '../../platform/snapshots/services/localSnapshotService';

export const SnapshotsModal: React.FC = () => {
  const { isSnapshotsOpen, setSnapshotsOpen } = useUIStore();
  const { addNotification } = useNotificationStore();
  const workspace = useWorkspaceStore();
  
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshotRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSnapshotsOpen) {
      loadSnapshots();
    }
  }, [isSnapshotsOpen]);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const data = await localSnapshotService.list();
      setSnapshots(data);
    } catch {
      addNotification('error', 'Falha ao carregar snapshots');
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async () => {
    setLoading(true);
    try {
      await localSnapshotService.create(workspace.files, 'manual');
      addNotification('success', 'Snapshot criado');
      loadSnapshots();
    } catch {
      addNotification('error', 'Falha ao criar snapshot');
    } finally {
      setLoading(false);
    }
  };

  const restoreSnapshot = async (snapshot: WorkspaceSnapshotRecord) => {
    const confirm = window.confirm(
      `Restaurar snapshot de ${new Date(snapshot.createdAt).toLocaleString()}?\n\nIsso irá substituir o workspace atual.`
    );
    
    if (confirm) {
      workspace.importWorkspaceData(snapshot.files);
      addNotification('success', 'Workspace restaurado');
      setSnapshotsOpen(false);
    }
  };

  const deleteSnapshot = async (id: string) => {
    const confirm = window.confirm('Excluir este snapshot?');
    if (confirm) {
      try {
        await localSnapshotService.delete(id);
        addNotification('success', 'Snapshot excluído');
        loadSnapshots();
      } catch {
        addNotification('error', 'Falha ao excluir snapshot');
      }
    }
  };

  const clearAllSnapshots = async () => {
    const confirm = window.confirm('Excluir TODOS os snapshots? Esta ação não pode ser desfeita.');
    if (confirm) {
      try {
        await localSnapshotService.clear();
        addNotification('success', 'Snapshots excluídos');
        loadSnapshots();
      } catch {
        addNotification('error', 'Falha ao limpar snapshots');
      }
    }
  };

  if (!isSnapshotsOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4"
      onClick={() => setSnapshotsOpen(false)}
    >
      <div 
        className="w-full max-w-[600px] h-[70vh] bg-ide-activity border border-ide-border shadow-2xl rounded-lg flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ide-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="History" className="text-ide-secondary" />
            Snapshots
          </h2>
          <button 
            onClick={() => setSnapshotsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="flex items-center gap-2 p-3 border-b border-ide-border bg-ide-panel">
          <button
            onClick={createSnapshot}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-white text-sm transition-colors"
          >
            <Icon name="Plus" size={14} />
            Criar Snapshot
          </button>
          {snapshots.length > 0 && (
            <button
              onClick={clearAllSnapshots}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 hover:bg-red-900 disabled:opacity-50 rounded text-red-200 text-sm transition-colors"
            >
              <Icon name="Trash2" size={14} />
              Limpar Tudo
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Icon name="Loader" className="animate-spin mr-2" />
              Carregando...
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
              <Icon name="Archive" size={48} className="opacity-30" />
              <p>Nenhum snapshot encontrado</p>
              <p className="text-xs">Crie um snapshot para restaurar mais tarde</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-3 bg-ide-bg border border-ide-border rounded hover:border-ide-accent transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">
                        {snapshot.name || new Date(snapshot.createdAt).toLocaleString()}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        snapshot.reason === 'manual' ? 'bg-blue-900/50 text-blue-200' :
                        snapshot.reason === 'autosave' ? 'bg-yellow-900/50 text-yellow-200' :
                        'bg-green-900/50 text-green-200'
                      }`}>
                        {snapshot.reason}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {snapshot.id}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => restoreSnapshot(snapshot)}
                      className="p-1.5 hover:bg-green-600 rounded text-green-400 hover:text-white transition-colors"
                      title="Restaurar"
                    >
                      <Icon name="RotateCcw" size={16} />
                    </button>
                    <button
                      onClick={() => deleteSnapshot(snapshot.id)}
                      className="p-1.5 hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors"
                      title="Excluir"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-ide-border bg-ide-panel text-center text-xs text-gray-500 rounded-b-lg">
          {snapshots.length} snapshot(s) • Máx 20
        </div>
      </div>
    </div>
  );
};