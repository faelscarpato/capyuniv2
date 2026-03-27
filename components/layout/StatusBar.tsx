import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Icon } from '../ui/Icon';
import { useRuntimeModeStore } from '../../features/local-runtime/store/runtimeModeStore';
import { executeAppCommand } from '../../core/commands/handlers/registerDefaultCommands';
import { useSourceControlStore } from '../../features/source-control/store/sourceControlStore';
import { useUIStore } from '../../stores/uiStore';

export const StatusBar: React.FC = () => {
  const { activeTabId, files, unsavedChanges } = useWorkspaceStore();
  const { notifications } = useNotificationStore();
  const { language } = useUIStore();
  const { mode, availability, bridgeLogs } = useRuntimeModeStore();
  const { branch, isRepository } = useSourceControlStore();
  const activeFile = activeTabId ? files[activeTabId] : null;

  const isDirty = activeTabId && unsavedChanges.has(activeTabId);
  const errorCount = notifications.filter(n => n.type === 'error').length;
  const warningCount = notifications.filter(n => n.type === 'warning').length;
  const tt = (pt: string, en: string) => (language === 'pt' ? pt : en);

  return (
    <div className="h-6 bg-ide-accent text-white flex items-center justify-between px-3 text-xs select-none z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer">
          <Icon name="GitBranch" size={12} />
          <span>{isRepository && branch ? branch : tt('sem-repo', 'no-repo')}</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
                <Icon name="XCircle" size={12} /> {errorCount}
            </div>
            <div className="flex items-center gap-1">
                <Icon name="AlertTriangle" size={12} /> {warningCount}
            </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {mode === 'local-runtime' ? (
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-200 text-[10px] font-bold tracking-wide">
              {tt('RUNTIME LOCAL ON', 'LOCAL RUNTIME ON')}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-white/15 text-white text-[10px] font-bold tracking-wide">
              {tt('IDE ONLINE', 'ONLINE IDE')}
            </span>
          )}
          {mode === 'local-runtime' && (
            <>
              {availability === 'unavailable' && (
                <button
                  type="button"
                  onClick={() => window.alert(bridgeLogs.join('\n') || tt('Sem logs da ponte disponíveis.', 'No bridge logs available.'))}
                  className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-100 text-[10px] font-semibold"
                >
                  {tt('Logs da Ponte', 'Bridge Logs')}
                </button>
              )}
              <button
                type="button"
                onClick={() => executeAppCommand('runtime.stopCurrentProcess')}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold"
              >
                {tt('Parar Atual', 'Stop Current')}
              </button>
              <button
                type="button"
                onClick={() => executeAppCommand('runtime.stopAllProcesses')}
                className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-100 text-[10px] font-semibold"
              >
                {tt('Parar Tudo', 'Stop All')}
              </button>
              <button
                type="button"
                onClick={() => executeAppCommand('runtime.disconnect')}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[10px] font-semibold"
              >
                {tt('Desconectar', 'Disconnect')}
              </button>
            </>
          )}
        </div>
        {activeFile && (
          <>
            <span>Ln 1, Col 1</span>
            <span>UTF-8</span>
            <span className="uppercase">{activeFile.language || 'Plain Text'}</span>
            <span className="font-bold flex items-center gap-1">
                {isDirty ? (
                    <>
                         <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                         Unsaved
                    </>
                ) : (
                    <>
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        Saved
                    </>
                )}
            </span>
          </>
        )}
        <div className="relative cursor-pointer hover:text-gray-200">
            <Icon name="Bell" size={12} />
            {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
        </div>
      </div>
    </div>
  );
};
