import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import { useSourceControlStore } from '../../features/source-control/store/sourceControlStore';
import { useRuntimeModeStore } from '../../features/local-runtime/store/runtimeModeStore';
import { executeAppCommand } from '../../core/commands/handlers/registerDefaultCommands';
import { useUIStore } from '../../stores/uiStore';

const statusColor: Record<string, string> = {
  M: 'text-yellow-300',
  A: 'text-green-300',
  U: 'text-blue-300',
  D: 'text-red-300',
  R: 'text-purple-300',
  C: 'text-cyan-300'
};

export const GitView: React.FC = () => {
  const { mode } = useRuntimeModeStore();
  const { language } = useUIStore();
  const tt = (pt: string, en: string) => (language === 'pt' ? pt : en);
  const {
    isLoading,
    isRepository,
    branch,
    entries,
    commitMessage,
    lastError,
    refreshStatus,
    initializeRepository,
    stage,
    unstage,
    commit,
    cloneRepository,
    setCommitMessage
  } = useSourceControlStore();

  const [repoUrl, setRepoUrl] = useState('');
  const [cloneDestination, setCloneDestination] = useState('');

  useEffect(() => {
    if (mode === 'local-runtime') {
      void refreshStatus(undefined, true);
    }
  }, [mode, refreshStatus]);

  const groupedEntries = useMemo(() => {
    const staged = entries.filter((entry) => entry.staged);
    const unstaged = entries.filter((entry) => !entry.staged);
    return { staged, unstaged };
  }, [entries]);

  return (
    <div className="h-full flex flex-col bg-ide-sidebar text-ide-text select-none border-r border-ide-border/50">
      <div className="flex items-center justify-between px-5 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-ide-muted">
        <div className="flex items-center gap-2">
          <Icon name="GitBranch" size={14} />
          <span>{tt('Controle de Código-Fonte', 'Source Control')}</span>
        </div>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          title={tt('Atualizar status do Git', 'Refresh Git status')}
        >
          <Icon name="RefreshCw" size={14} />
        </button>
      </div>

      <div className="px-4 pb-4 overflow-y-auto space-y-4">
        <div className="bg-ide-activity/30 border border-white/5 rounded-xl p-3 text-xs">
          {mode === 'local-runtime' ? (
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-green-300 font-bold tracking-wide">LOCAL RUNTIME ON</div>
                <div className="text-ide-muted mt-1">{tt('As operações Git usam seu ambiente local real.', 'Git operations use your real local environment.')}</div>
              </div>
              <button
                type="button"
                onClick={() => executeAppCommand('runtime.disconnect')}
                className="px-2 py-1 rounded border border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
              >
                {tt('Desconectar', 'Disconnect')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-white font-semibold">{tt('Modo Online IDE ativo.', 'Online IDE Mode is active.')}</div>
              <div className="text-ide-muted">
                {tt(
                  'Ative o Runtime Local para usar Git, terminal, sistema de arquivos e preview localhost reais.',
                  'Activate Local Runtime to use real local Git, terminal, file system and localhost preview.'
                )}
              </div>
              <button
                type="button"
                onClick={() => executeAppCommand('runtime.activateLocal')}
                className="px-2 py-1 rounded bg-ide-accent text-white font-semibold hover:bg-opacity-90"
              >
                {tt('Ativar Runtime Local', 'Activate Local Runtime')}
              </button>
            </div>
          )}
        </div>

        <div className="bg-ide-activity/30 border border-white/5 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-ide-muted">{tt('Repositório', 'Repository')}</div>
            <button
              type="button"
              onClick={() => void initializeRepository()}
              className="text-[11px] px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            >
              {tt('Inicializar', 'Init')}
            </button>
          </div>

          {isRepository ? (
            <div className="text-xs text-ide-muted">
              {tt('Branch', 'Branch')}: <span className="text-white font-semibold">{branch || tt('desconhecida', 'unknown')}</span>
            </div>
          ) : (
            <div className="text-xs text-ide-muted">{tt('Nenhum repositório Git detectado no workspace local atual.', 'No Git repository detected in the current local workspace.')}</div>
          )}

          {lastError && <div className="text-[11px] text-red-300 bg-red-900/20 border border-red-500/20 rounded p-2">{lastError}</div>}
        </div>

        <div className="bg-ide-activity/30 border border-white/5 rounded-xl p-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-ide-muted">{tt('Mudanças', 'Changes')}</div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void stage()}
              className="text-[11px] px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            >
              {tt('Stage de Tudo', 'Stage All')}
            </button>
            <button
              type="button"
              onClick={() => void unstage()}
              className="text-[11px] px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            >
              {tt('Remover Stage de Tudo', 'Unstage All')}
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="text-xs text-ide-muted">{tt('Sem mudanças pendentes.', 'No pending changes.')}</div>
          ) : (
            <div className="space-y-2">
              {[...groupedEntries.staged, ...groupedEntries.unstaged].map((entry) => (
                <div key={`${entry.path}-${entry.indexStatus}-${entry.workTreeStatus}`} className="flex items-center gap-2 text-xs">
                  <span className={`font-black w-4 text-center ${statusColor[entry.badge] || 'text-ide-muted'}`}>{entry.badge}</span>
                  <span className="truncate flex-1" title={entry.path}>
                    {entry.path}
                  </span>
                  {entry.staged ? (
                    <button
                      type="button"
                      onClick={() => void unstage(entry.path)}
                      className="px-2 py-0.5 rounded border border-white/10 hover:bg-white/10 text-[10px]"
                    >
                      {tt('Remover Stage', 'Unstage')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void stage(entry.path)}
                      className="px-2 py-0.5 rounded border border-white/10 hover:bg-white/10 text-[10px]"
                    >
                      {tt('Adicionar Stage', 'Stage')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-ide-activity/30 border border-white/5 rounded-xl p-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-ide-muted">Commit</div>
          <textarea
            value={commitMessage}
            onChange={(event) => setCommitMessage(event.target.value)}
            className="w-full min-h-[74px] bg-ide-input text-white text-xs p-2 rounded border border-ide-border focus:border-ide-accent/50 focus:outline-none"
            placeholder={tt('Mensagem do commit', 'Commit message')}
          />
          <button
            type="button"
            onClick={() => void commit()}
            disabled={isLoading}
            className="w-full bg-ide-accent hover:bg-opacity-90 disabled:opacity-40 text-white text-xs font-bold py-2 rounded-lg transition-all"
          >
            {tt('Commitar', 'Commit')}
          </button>
        </div>

        <div className="bg-ide-activity/30 border border-white/5 rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-2 text-ide-accent">
            <Icon name="Download" size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">{tt('Clonar para Workspace Local', 'Clone to Local Workspace')}</span>
          </div>
          <p className="text-[11px] text-ide-muted">
            {tt('Este repositório será clonado e salvo no seu ambiente local.', 'This repository will be cloned and saved in your local environment.')}
          </p>
          <input
            type="text"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/user/repo.git"
            className="w-full bg-ide-input text-white text-xs px-3 py-2 rounded border border-ide-border focus:border-ide-accent/50 focus:outline-none"
          />
          <input
            type="text"
            value={cloneDestination}
            onChange={(event) => setCloneDestination(event.target.value)}
            placeholder={tt('Caminho de destino (opcional)', 'Destination path (optional)')}
            className="w-full bg-ide-input text-white text-xs px-3 py-2 rounded border border-ide-border focus:border-ide-accent/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void cloneRepository(repoUrl, cloneDestination)}
            disabled={!repoUrl.trim() || isLoading}
            className="w-full bg-ide-accent hover:bg-opacity-90 disabled:opacity-40 text-white text-xs font-bold py-2 rounded-lg transition-all"
          >
            {tt('Clonar Repositório', 'Clone Repository')}
          </button>
        </div>
      </div>
    </div>
  );
};
