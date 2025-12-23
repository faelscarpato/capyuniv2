import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Icon } from '../ui/Icon';

export const StatusBar: React.FC = () => {
  const { activeTabId, files, unsavedChanges } = useWorkspaceStore();
  const { notifications } = useNotificationStore();
  const activeFile = activeTabId ? files[activeTabId] : null;

  const isDirty = activeTabId && unsavedChanges.has(activeTabId);
  const errorCount = notifications.filter(n => n.type === 'error').length;
  const warningCount = notifications.filter(n => n.type === 'warning').length;

  return (
    <div className="h-6 bg-ide-accent text-white flex items-center justify-between px-3 text-xs select-none z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer">
          <Icon name="GitBranch" size={12} />
          <span>main</span>
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