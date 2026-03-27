import { localRuntimeAdapter } from '../../local-runtime/adapters/LocalRuntimeAdapter';
import type { GitFileBadge, GitStatusEntry, GitStatusSnapshot } from '../types';

const parseBranch = (line: string): string => {
  const normalized = line.replace(/^##\s*/, '').trim();
  if (!normalized) return '(detached)';
  return normalized.split('...')[0] || normalized;
};

const resolveBadge = (x: string, y: string): GitFileBadge => {
  if (x === '?' || y === '?') return 'U';
  if (x === 'A' || y === 'A') return 'A';
  if (x === 'D' || y === 'D') return 'D';
  if (x === 'R' || y === 'R') return 'R';
  if (x === 'C' || y === 'C') return 'C';
  return 'M';
};

const parseGitStatusPorcelain = (stdout: string): GitStatusSnapshot => {
  const lines = (stdout || '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  let branch = '(detached)';
  const entries: GitStatusEntry[] = [];

  lines.forEach((line) => {
    if (line.startsWith('##')) {
      branch = parseBranch(line);
      return;
    }

    if (line.length < 3) return;

    const indexStatus = line[0] || ' ';
    const workTreeStatus = line[1] || ' ';
    let filePath = line.slice(3).trim();
    if (!filePath) return;
    if (filePath.includes(' -> ')) {
      const parts = filePath.split(' -> ');
      filePath = parts[parts.length - 1] || filePath;
    }

    entries.push({
      path: filePath,
      indexStatus,
      workTreeStatus,
      badge: resolveBadge(indexStatus, workTreeStatus),
      staged: indexStatus !== ' ' && indexStatus !== '?'
    });
  });

  return {
    isRepository: true,
    branch,
    entries,
    raw: stdout
  };
};

const normalizeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error || 'Unknown Git error');
};

const isNotRepositoryError = (message: string): boolean => {
  const value = message.toLowerCase();
  return value.includes('not a git repository') || value.includes('fatal: this operation must be run in a work tree');
};

export const sourceControlService = {
  status: async (cwd?: string): Promise<GitStatusSnapshot> => {
    try {
      const { stdout } = await localRuntimeAdapter.gitStatus(cwd);
      return parseGitStatusPorcelain(stdout);
    } catch (error) {
      const message = normalizeError(error);
      if (isNotRepositoryError(message)) {
        return {
          isRepository: false,
          branch: '',
          entries: [],
          raw: ''
        };
      }
      throw new Error(message);
    }
  },

  initializeRepository: async (cwd?: string): Promise<void> => {
    await localRuntimeAdapter.gitInit(cwd);
  },

  stage: async (paths?: string[], cwd?: string): Promise<void> => {
    await localRuntimeAdapter.gitStage(paths, cwd);
  },

  unstage: async (paths?: string[], cwd?: string): Promise<void> => {
    await localRuntimeAdapter.gitUnstage(paths, cwd);
  },

  commit: async (message: string, cwd?: string): Promise<void> => {
    await localRuntimeAdapter.gitCommit(message, cwd);
  },

  cloneRepository: async (repoUrl: string, destination?: string): Promise<{ clonePath: string }> => {
    const result = await localRuntimeAdapter.gitClone(repoUrl, destination);
    return { clonePath: result.clonePath };
  }
};

