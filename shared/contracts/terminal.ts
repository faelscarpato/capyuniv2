export type TerminalMode = 'real' | 'simulated';
export type TerminalServerMode = 'dev' | 'hardened';

export type TerminalClientMessage =
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number }
  | { type: 'setCwd'; cwd: string }
  | { type: 'writeFile'; path: string; content: string }
  | { type: 'readFile'; path: string }
  | { type: 'deleteFile'; path: string }
  | { type: 'scan' };

export type TerminalServerMessage =
  | { type: 'scanResult'; structure: unknown[] }
  | { type: 'fileContent'; path: string; content: string }
  | { type: 'error'; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const isTerminalClientMessage = (value: unknown): value is TerminalClientMessage => {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  if (value.type === 'scan') return true;

  if (value.type === 'input') return typeof value.data === 'string';
  if (value.type === 'setCwd') return typeof value.cwd === 'string';
  if (value.type === 'readFile' || value.type === 'deleteFile') return typeof value.path === 'string';
  if (value.type === 'writeFile') return typeof value.path === 'string' && typeof value.content === 'string';
  if (value.type === 'resize') return typeof value.cols === 'number' && typeof value.rows === 'number';

  return false;
};

