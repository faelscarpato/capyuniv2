import type { ToolCall } from '../../../shared/types/ai';
import { normalizeRelativePath } from '../../../shared/security/pathSafety';

export interface WorkspaceToolApi {
  writeFile: (path: string, content: string) => void;
  readFile: (path: string) => string | null;
  listFiles: () => string[];
  deleteFile: (path: string) => void;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

export const executeWorkspaceToolCall = (
  call: ToolCall,
  api: WorkspaceToolApi
): Record<string, unknown> => {
  if (call.name === 'list_files') {
    return { files: api.listFiles() };
  }

  if (call.name === 'read_file') {
    const path = normalizeRelativePath(asString(call.args.path));
    if (!path.ok) return { error: path.reason };
    const content = api.readFile(path.normalized);
    return content === null ? { error: 'File not found.' } : { content };
  }

  if (call.name === 'write_file') {
    const path = normalizeRelativePath(asString(call.args.path));
    if (!path.ok) return { error: path.reason };
    api.writeFile(path.normalized, asString(call.args.content));
    return { ok: true };
  }

  if (call.name === 'delete_file') {
    const path = normalizeRelativePath(asString(call.args.path));
    if (!path.ok) return { error: path.reason };
    api.deleteFile(path.normalized);
    return { ok: true };
  }

  return { error: `Unknown tool: ${call.name}` };
};

