import { normalizeRelativePath } from '../../../shared/security/pathSafety';

export const terminalSessionService = {
  normalizeCwd: (cwd: string): string => {
    if (!cwd || cwd === '/') return '/';
    const normalized = normalizeRelativePath(cwd);
    if (!normalized.ok) return '/';
    return `/${normalized.normalized}`;
  }
};

