export type LocalRuntimeSessionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export interface LocalRuntimeSession {
  id: string;
  cwd: string;
  status: LocalRuntimeSessionStatus;
  lastCommand: string | null;
  lastOutputAt: number | null;
  bridgeError: string | null;
}

