export type TerminalMode = 'real' | 'simulated';
export type TerminalServerMode = 'dev' | 'hardened';
export type RuntimeMode = 'online' | 'local-runtime';

export type TerminalClientMessage =
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number }
  | { type: 'setCwd'; cwd: string }
  | { type: 'setFsRoot'; path: string }
  | { type: 'setRuntimeMode'; mode: RuntimeMode }
  | { type: 'interrupt' }
  | { type: 'writeFile'; path: string; content: string }
  | { type: 'readFile'; path: string }
  | { type: 'deleteFile'; path: string }
  | { type: 'scan' }
  | { type: 'gitStatus'; cwd?: string; requestId?: string }
  | { type: 'gitInit'; cwd?: string; requestId?: string }
  | { type: 'gitStage'; cwd?: string; paths?: string[]; requestId?: string }
  | { type: 'gitUnstage'; cwd?: string; paths?: string[]; requestId?: string }
  | { type: 'gitCommit'; cwd?: string; message: string; requestId?: string }
  | { type: 'gitClone'; repoUrl: string; destination?: string; requestId?: string };

export type TerminalServerMessage =
  | { type: 'scanResult'; structure: unknown[] }
  | { type: 'fileContent'; path: string; content: string }
  | { type: 'cwdChanged'; cwd: string }
  | { type: 'error'; message: string }
  | { type: 'requestResult'; requestId: string; success: boolean; payload?: unknown; error?: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const isTerminalClientMessage = (value: unknown): value is TerminalClientMessage => {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  if (value.type === 'scan') return true;

  if (value.type === 'input') return typeof value.data === 'string';
  if (value.type === 'setCwd') return typeof value.cwd === 'string';
  if (value.type === 'setFsRoot') return typeof value.path === 'string';
  if (value.type === 'setRuntimeMode') return value.mode === 'online' || value.mode === 'local-runtime';
  if (value.type === 'interrupt') return true;
  if (value.type === 'readFile' || value.type === 'deleteFile') return typeof value.path === 'string';
  if (value.type === 'writeFile') return typeof value.path === 'string' && typeof value.content === 'string';
  if (value.type === 'resize') return typeof value.cols === 'number' && typeof value.rows === 'number';
  if (value.type === 'gitStatus' || value.type === 'gitInit') {
    return value.cwd === undefined || typeof value.cwd === 'string';
  }
  if (value.type === 'gitStage' || value.type === 'gitUnstage') {
    const validPaths = value.paths === undefined || (Array.isArray(value.paths) && value.paths.every((p) => typeof p === 'string'));
    return (value.cwd === undefined || typeof value.cwd === 'string') && validPaths;
  }
  if (value.type === 'gitCommit') {
    return (value.cwd === undefined || typeof value.cwd === 'string') && typeof value.message === 'string';
  }
  if (value.type === 'gitClone') {
    return typeof value.repoUrl === 'string' && (value.destination === undefined || typeof value.destination === 'string');
  }

  return false;
};
