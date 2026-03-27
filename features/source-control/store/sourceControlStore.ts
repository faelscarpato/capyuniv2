import { create } from 'zustand';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import { useUIStore } from '../../../stores/uiStore';
import { useRuntimeModeStore } from '../../local-runtime/store/runtimeModeStore';
import { useLocalRuntimeStore } from '../../local-runtime/store/localRuntimeStore';
import { sourceControlService } from '../services/sourceControlService';
import { localRuntimeAdapter } from '../../local-runtime/adapters/LocalRuntimeAdapter';
import type { GitStatusEntry } from '../types';
import { useTerminalStore } from '../../../core/terminal/store/terminalStore';

interface SourceControlState {
  isLoading: boolean;
  isRepository: boolean;
  repositoryRoot: string;
  branch: string;
  entries: GitStatusEntry[];
  commitMessage: string;
  lastError: string | null;
  refreshStatus: (cwd?: string, skipModeGuard?: boolean) => Promise<void>;
  initializeRepository: (cwd?: string) => Promise<void>;
  stage: (path?: string, cwd?: string) => Promise<void>;
  unstage: (path?: string, cwd?: string) => Promise<void>;
  commit: (cwd?: string) => Promise<void>;
  cloneRepository: (repoUrl: string, destination?: string) => Promise<void>;
  setCommitMessage: (message: string) => void;
  resolveDefaultCwd: () => string;
}

const txt = (pt: string, en: string): string => (useUIStore.getState().language === 'pt' ? pt : en);

const runWithLocalRuntime = (actionLabel: string, action: () => void): boolean => {
  const runtime = useRuntimeModeStore.getState();
  if (runtime.mode === 'local-runtime') {
    action();
    return true;
  }
  runtime.ensureLocalRuntime({
    requestedBy: txt('Controle de Código-Fonte', 'Source Control'),
    actionLabel,
    onActivated: action
  });
  return false;
};

export const useSourceControlStore = create<SourceControlState>((set, get) => ({
  isLoading: false,
  isRepository: false,
  repositoryRoot: '/',
  branch: '',
  entries: [],
  commitMessage: '',
  lastError: null,

  resolveDefaultCwd: () => {
    const localRuntimeCwd = useLocalRuntimeStore.getState().getActiveSessionCwd();
    return localRuntimeCwd || '/';
  },

  refreshStatus: async (cwd, skipModeGuard = false) => {
    const execute = async () => {
      const targetCwd = cwd || get().resolveDefaultCwd();
      set({ isLoading: true, lastError: null });
      try {
        const snapshot = await sourceControlService.status(targetCwd);
        set({
          isRepository: snapshot.isRepository,
          branch: snapshot.branch,
          entries: snapshot.entries,
          repositoryRoot: targetCwd,
          isLoading: false
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ isLoading: false, lastError: message });
        useNotificationStore
          .getState()
          .addNotification('error', `${txt('Falha no status do Git', 'Git status failed')}: ${message}`);
      }
    };

    if (skipModeGuard) {
      await execute();
      return;
    }

    runWithLocalRuntime(
      txt(
        'Ative o Runtime Local para consultar o status do Git.',
        'Enable Local Runtime to read Git status.'
      ),
      () => {
      void execute();
      }
    );
  },

  initializeRepository: async (cwd) => {
    runWithLocalRuntime(
      txt(
        'Ative o Runtime Local para inicializar um repositório Git.',
        'Enable Local Runtime to initialize a Git repository.'
      ),
      () => {
      const targetCwd = cwd || get().resolveDefaultCwd();
      set({ isLoading: true, lastError: null });
      sourceControlService
        .initializeRepository(targetCwd)
        .then(() => {
          useNotificationStore
            .getState()
            .addNotification('success', txt('Repositório Git inicializado.', 'Git repository initialized.'));
          return get().refreshStatus(targetCwd, true);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          set({ lastError: message, isLoading: false });
          useNotificationStore
            .getState()
            .addNotification('error', `${txt('Falha ao inicializar Git', 'Git init failed')}: ${message}`);
        });
      }
    );
  },

  stage: async (path, cwd) => {
    runWithLocalRuntime(
      txt(
        'Ative o Runtime Local para adicionar arquivos ao stage.',
        'Enable Local Runtime to stage files.'
      ),
      () => {
      const targetCwd = cwd || get().resolveDefaultCwd();
      set({ isLoading: true, lastError: null });
      sourceControlService
        .stage(path ? [path] : undefined, targetCwd)
        .then(() => get().refreshStatus(targetCwd, true))
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          set({ lastError: message, isLoading: false });
          useNotificationStore
            .getState()
            .addNotification('error', `${txt('Falha ao adicionar ao stage', 'Git stage failed')}: ${message}`);
        });
      }
    );
  },

  unstage: async (path, cwd) => {
    runWithLocalRuntime(
      txt(
        'Ative o Runtime Local para remover arquivos do stage.',
        'Enable Local Runtime to unstage files.'
      ),
      () => {
      const targetCwd = cwd || get().resolveDefaultCwd();
      set({ isLoading: true, lastError: null });
      sourceControlService
        .unstage(path ? [path] : undefined, targetCwd)
        .then(() => get().refreshStatus(targetCwd, true))
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          set({ lastError: message, isLoading: false });
          useNotificationStore
            .getState()
            .addNotification('error', `${txt('Falha ao remover do stage', 'Git unstage failed')}: ${message}`);
        });
      }
    );
  },

  commit: async (cwd) => {
    runWithLocalRuntime(
      txt(
        'Ative o Runtime Local para criar commits.',
        'Enable Local Runtime to commit changes.'
      ),
      () => {
      const message = get().commitMessage.trim();
      if (!message) {
        useNotificationStore
          .getState()
          .addNotification('warning', txt('Mensagem de commit é obrigatória.', 'Commit message is required.'));
        return;
      }

      const targetCwd = cwd || get().resolveDefaultCwd();
      set({ isLoading: true, lastError: null });
      sourceControlService
        .commit(message, targetCwd)
        .then(() => {
          useNotificationStore.getState().addNotification('success', txt('Commit criado.', 'Commit created.'));
          set({ commitMessage: '' });
          return get().refreshStatus(targetCwd, true);
        })
        .catch((error) => {
          const messageText = error instanceof Error ? error.message : String(error);
          set({ lastError: messageText, isLoading: false });
          useNotificationStore
            .getState()
            .addNotification('error', `${txt('Falha no commit', 'Git commit failed')}: ${messageText}`);
        });
      }
    );
  },

  cloneRepository: async (repoUrl, destination) => {
    runWithLocalRuntime(
      txt(
        'Ative o Runtime Local para clonar repositórios no seu ambiente local.',
        'Enable Local Runtime to clone repositories into your local environment.'
      ),
      () => {
      const repo = repoUrl.trim();
      if (!repo) {
        useNotificationStore
          .getState()
          .addNotification('warning', txt('A URL do repositório é obrigatória.', 'Repository URL is required.'));
        return;
      }

      set({ isLoading: true, lastError: null });
      sourceControlService
        .cloneRepository(repo, destination?.trim() || undefined)
        .then(async ({ clonePath }) => {
          const terminalStore = useTerminalStore.getState();
          const terminalId = terminalStore.activeSessionId || terminalStore.ensureSession();
          localRuntimeAdapter.setSessionCwd(terminalId, clonePath);
          useLocalRuntimeStore.getState().setSessionCwd(terminalId, clonePath);
          useWorkspaceStore.getState().refreshFromPTY();
          await get().refreshStatus(clonePath, true);
          useNotificationStore
            .getState()
            .addNotification(
              'success',
              txt(`Repositório clonado localmente em ${clonePath}.`, `Repository cloned locally at ${clonePath}.`)
            );
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          set({ lastError: message, isLoading: false });
          useNotificationStore
            .getState()
            .addNotification('error', `${txt('Falha ao clonar repositório', 'Git clone failed')}: ${message}`);
        });
      }
    );
  },

  setCommitMessage: (message) => {
    set({ commitMessage: message });
  }
}));
