import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Icon } from '../ui/Icon';
import { t } from '../../lib/i18n';
import { emitTerminalSendCommand } from '../../lib/terminalBridge';
import { useTerminalStore } from '../../core/terminal/store/terminalStore';

import { executeAppCommand } from '../../core/commands/handlers/registerDefaultCommands';

export const GitView: React.FC = () => {
    const { language } = useUIStore();
    const { addNotification } = useNotificationStore();
    const [repoUrl, setRepoUrl] = useState('');

    const handleClone = () => {
        if (!repoUrl.trim()) return;

        const url = repoUrl.trim();
        // Ensure it looks like a git url
        if (!url.includes('github.com') && !url.includes('.git') && !url.startsWith('git@')) {
            addNotification('error', 'URL Git inválida');
            return;
        }

        // Try to extract repo name for the notification
        const repoName = url.split('/').pop()?.replace('.git', '') || 'repository';

        addNotification('info', `Clonando ${repoName}...`);

        // Open terminal to execute git clone
        executeAppCommand('panel.openTerminal');

        // We'll give it a tiny delay to ensure terminal is ready/visible
        setTimeout(() => {
            const terminalState = useTerminalStore.getState();
            const terminalId = terminalState.activeSessionId || terminalState.ensureSession();
            // We remove the '.' to let git create a new folder and avoid "directory not empty" errors
            emitTerminalSendCommand({ terminalId, command: `git clone ${url}\r` });
            addNotification('success', 'Comando enviado ao terminal!');
        }, 500);
    };

    return (
        <div className="h-full flex flex-col bg-ide-sidebar text-ide-text select-none border-r border-ide-border/50">
            <div className="flex items-center justify-between px-5 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-ide-muted">
                <span>Source Control</span>
                <button
                    onClick={() => executeAppCommand('workspace.syncFromPTY')}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors group"
                    title="Sincronizar arquivos do servidor"
                >
                    <Icon name="RefreshCw" size={14} className="group-active:rotate-180 transition-transform duration-500" />
                </button>
            </div>

            <div className="px-5 space-y-4">
                <div className="bg-ide-activity/30 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 text-ide-accent">
                        <Icon name="GitBranch" size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Git Clone</span>
                    </div>

                    <p className="text-[11px] text-ide-muted mb-4 leading-relaxed">
                        Clone um repositório remoto diretamente para o seu workspace.
                    </p>

                    <div className="space-y-3">
                        <div className="relative group">
                            <input
                                type="text"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/user/repo.git"
                                className="w-full bg-ide-input text-white text-xs pl-4 pr-10 py-2.5 rounded-lg border border-ide-border focus:border-ide-accent/50 focus:outline-none transition-all placeholder:text-ide-muted"
                            />
                            <Icon name="Link" size={14} className="absolute right-3 top-2.5 text-ide-muted" />
                        </div>

                        <button
                            onClick={handleClone}
                            disabled={!repoUrl.trim()}
                            className="w-full bg-ide-accent hover:bg-opacity-90 disabled:opacity-30 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-ide-accent/10 flex items-center justify-center gap-2"
                        >
                            <Icon name="Download" size={14} />
                            {t('cloneGit', language)}
                        </button>
                    </div>
                </div>

                <div className="p-4 border border-dashed border-ide-border rounded-xl opacity-50">
                    <div className="flex items-center gap-2 text-ide-muted mb-2">
                        <Icon name="History" size={14} />
                        <span className="text-[10px] font-bold uppercase">Em breve: Commit & Push</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto p-6 text-center opacity-30 select-none">
                <Icon name="Github" size={48} className="mx-auto mb-2" />
                <p className="text-[10px] font-medium tracking-widest uppercase">Git Integration</p>
            </div>
        </div>
    );
};
