import { create } from 'zustand';
import type { TerminalMode, TerminalServerMode } from '../../../shared/contracts/terminal';

interface TerminalSession {
  id: string;
  title: string;
  cwd: string;
  mode: TerminalMode;
}

interface TerminalState {
  serverMode: TerminalServerMode;
  activeSessionId: string | null;
  sessions: TerminalSession[];
  setServerMode: (mode: TerminalServerMode) => void;
  addSession: (title?: string) => string;
  ensureSession: () => string;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  setSessionMode: (id: string, mode: TerminalMode) => void;
  setSessionCwd: (id: string, cwd: string) => void;
}

const createSession = (title = 'Terminal'): TerminalSession => ({
  id: `term-${Math.random().toString(36).slice(2, 10)}`,
  title,
  cwd: '/',
  mode: 'simulated'
});

const firstSession = createSession('Terminal');

export const useTerminalStore = create<TerminalState>((set, get) => ({
  serverMode: 'dev',
  activeSessionId: firstSession.id,
  sessions: [firstSession],
  setServerMode: (mode) => set({ serverMode: mode }),
  addSession: (title) => {
    const session = createSession(title);
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id
    }));
    return session.id;
  },
  ensureSession: () => {
    const state = get();
    if (state.activeSessionId) return state.activeSessionId;
    if (state.sessions[0]) {
      set({ activeSessionId: state.sessions[0].id });
      return state.sessions[0].id;
    }
    return state.addSession('Terminal');
  },
  removeSession: (id) =>
    set((state) => {
      if (state.sessions.length <= 1) return state;
      const sessions = state.sessions.filter((session) => session.id !== id);
      return {
        sessions,
        activeSessionId: state.activeSessionId === id ? (sessions[0]?.id || null) : state.activeSessionId
      };
    }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  setSessionMode: (id, mode) =>
    set((state) => ({
      sessions: state.sessions.map((session) => (session.id === id ? { ...session, mode } : session))
    })),
  setSessionCwd: (id, cwd) =>
    set((state) => ({
      sessions: state.sessions.map((session) => (session.id === id ? { ...session, cwd } : session))
    }))
}));
