import { create } from 'zustand';
import { useTerminalStore } from '../../../core/terminal/store/terminalStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import type { LocalRuntimeSession } from '../models/LocalRuntimeSession';
import { localRuntimeAdapter } from '../adapters/LocalRuntimeAdapter';
import { runtimeSessionService } from '../services/runtimeSessionService';
import { localPreviewBridge } from '../services/localPreviewBridge';
import { useLocalPreviewStore } from './localPreviewStore';

export type LocalRuntimeBridgeStatus = 'idle' | 'connecting' | 'connected' | 'error';
export type LocalRuntimeDisconnectCleanup = 'keep-processes' | 'kill-current' | 'kill-all';

interface LocalRuntimeState {
  bridgeStatus: LocalRuntimeBridgeStatus;
  sessions: Record<string, LocalRuntimeSession>;
  activeSessionId: string | null;
  lastBridgeError: string | null;
  activateLocalRuntime: () => void;
  disconnect: (cleanup: LocalRuntimeDisconnectCleanup) => void;
  setBridgeStatus: (status: LocalRuntimeBridgeStatus, error?: string | null) => void;
  setActiveSession: (sessionId: string | null) => void;
  ensureSession: (sessionId: string, cwd?: string) => void;
  markSessionConnected: (sessionId: string) => void;
  markSessionDisconnected: (sessionId: string, error?: string | null) => void;
  setSessionCwd: (sessionId: string, cwd: string) => void;
  recordCommand: (sessionId: string, command: string) => void;
  consumeTerminalOutput: (sessionId: string, data: string) => void;
  stopCurrentProcess: (sessionId?: string | null) => void;
  stopAllProcesses: () => void;
  requestWorkspaceScan: () => void;
  getActiveSessionCwd: () => string;
}

let workspaceScanTimer: number | null = null;

const defaultSession = (sessionId: string, cwd = '/'): LocalRuntimeSession => ({
  id: sessionId,
  cwd,
  status: 'idle',
  lastCommand: null,
  lastOutputAt: null,
  bridgeError: null
});

const scheduleWorkspaceScan = () => {
  if (workspaceScanTimer) window.clearTimeout(workspaceScanTimer);
  workspaceScanTimer = window.setTimeout(() => {
    useWorkspaceStore.getState().refreshFromPTY();
  }, 450);
};

const scheduleSourceControlRefresh = () => {
  window.setTimeout(async () => {
    try {
      const module = await import('../../source-control/store/sourceControlStore');
      await module.useSourceControlStore.getState().refreshStatus(undefined, true);
    } catch {
      // noop
    }
  }, 650);
};

export const useLocalRuntimeStore = create<LocalRuntimeState>((set, get) => ({
  bridgeStatus: 'idle',
  sessions: {},
  activeSessionId: null,
  lastBridgeError: null,

  activateLocalRuntime: () => {
    set({ bridgeStatus: 'connecting', lastBridgeError: null });
    localRuntimeAdapter.setRuntimeMode('local-runtime');
    localRuntimeAdapter.requestWorkspaceScan();
  },

  disconnect: (cleanup) => {
    if (cleanup === 'kill-current') {
      get().stopCurrentProcess(get().activeSessionId);
    } else if (cleanup === 'kill-all') {
      get().stopAllProcesses();
    }

    localRuntimeAdapter.setRuntimeMode('online');

    const terminalState = useTerminalStore.getState();
    terminalState.sessions.forEach((session) => {
      terminalState.setSessionMode(session.id, 'simulated');
    });

    useLocalPreviewStore.getState().clear();

    set((state) => ({
      bridgeStatus: 'idle',
      lastBridgeError: null,
      sessions: Object.fromEntries(
        Object.entries(state.sessions).map(([id, session]) => [
          id,
          {
            ...session,
            status: 'disconnected',
            bridgeError: null
          }
        ])
      )
    }));
  },

  setBridgeStatus: (status, error = null) => {
    set({
      bridgeStatus: status,
      lastBridgeError: error || null
    });
  },

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId });
  },

  ensureSession: (sessionId, cwd = '/') => {
    set((state) => ({
      sessions: state.sessions[sessionId]
        ? state.sessions
        : {
            ...state.sessions,
            [sessionId]: defaultSession(sessionId, cwd)
          },
      activeSessionId: state.activeSessionId || sessionId
    }));
  },

  markSessionConnected: (sessionId) => {
    set((state) => {
      const existing = state.sessions[sessionId] || defaultSession(sessionId);
      return {
        bridgeStatus: 'connected',
        lastBridgeError: null,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            status: 'connected',
            bridgeError: null
          }
        }
      };
    });
  },

  markSessionDisconnected: (sessionId, error = null) => {
    set((state) => {
      const existing = state.sessions[sessionId] || defaultSession(sessionId);
      return {
        bridgeStatus: error ? 'error' : state.bridgeStatus,
        lastBridgeError: error || state.lastBridgeError,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            status: 'disconnected',
            bridgeError: error || null
          }
        }
      };
    });
  },

  setSessionCwd: (sessionId, cwd) => {
    set((state) => {
      const existing = state.sessions[sessionId] || defaultSession(sessionId);
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            cwd
          }
        }
      };
    });
  },

  recordCommand: (sessionId, command) => {
    const normalized = runtimeSessionService.normalizeCommand(command);
    set((state) => {
      const existing = state.sessions[sessionId] || defaultSession(sessionId);
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            lastCommand: normalized || existing.lastCommand
          }
        }
      };
    });

    if (runtimeSessionService.shouldRescanWorkspaceAfterCommand(normalized)) {
      scheduleWorkspaceScan();
    }
    if (runtimeSessionService.shouldRefreshSourceControl(normalized)) {
      scheduleSourceControlRefresh();
    }
  },

  consumeTerminalOutput: (sessionId, data) => {
    set((state) => {
      const existing = state.sessions[sessionId] || defaultSession(sessionId);
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            lastOutputAt: Date.now()
          }
        }
      };
    });
    localPreviewBridge.ingestTerminalOutput(data);
  },

  stopCurrentProcess: (sessionId) => {
    const targetId = sessionId || get().activeSessionId;
    if (!targetId) return;
    localRuntimeAdapter.interruptSession(targetId);
  },

  stopAllProcesses: () => {
    const allSessions = Object.keys(get().sessions);
    if (allSessions.length === 0) {
      const terminalSessions = useTerminalStore.getState().sessions.map((s) => s.id);
      localRuntimeAdapter.interruptAllSessions(terminalSessions);
      return;
    }
    localRuntimeAdapter.interruptAllSessions(allSessions);
  },

  requestWorkspaceScan: () => {
    localRuntimeAdapter.requestWorkspaceScan();
  },

  getActiveSessionCwd: () => {
    const state = get();
    const sessionId = state.activeSessionId;
    if (!sessionId) return '/';
    return state.sessions[sessionId]?.cwd || '/';
  }
}));
