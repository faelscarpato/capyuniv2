const PREVIEW_URL_PATTERN = /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/[^\s"'<>]*)?/gi;

const normalizeCommand = (raw: string): string => raw.trim().replace(/\s+/g, ' ');

const getCommandToken = (raw: string): string => {
  const normalized = normalizeCommand(raw);
  if (!normalized) return '';
  const token = normalized.split(' ')[0] || '';
  return token.toLowerCase();
};

const FILE_SYSTEM_MUTATION_COMMANDS = new Set([
  'cd',
  'touch',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'npm',
  'pnpm',
  'yarn',
  'npx',
  'node',
  'vite',
  'next',
  'git'
]);

export const runtimeSessionService = {
  normalizeCommand,

  shouldRescanWorkspaceAfterCommand: (raw: string): boolean => {
    const token = getCommandToken(raw);
    if (!token) return false;
    return FILE_SYSTEM_MUTATION_COMMANDS.has(token);
  },

  shouldRefreshSourceControl: (raw: string): boolean => {
    const normalized = normalizeCommand(raw).toLowerCase();
    if (!normalized) return false;
    if (normalized.startsWith('git ')) return true;
    return ['touch ', 'mkdir ', 'rm ', 'cp ', 'mv '].some((prefix) => normalized.startsWith(prefix));
  },

  extractLocalPreviewUrls: (chunk: string): string[] => {
    const input = chunk || '';
    const matches = input.match(PREVIEW_URL_PATTERN) || [];
    return Array.from(new Set(matches.map((url) => url.replace(/[),.;]+$/, ''))));
  }
};

