const INVALID_PATH_SEGMENT = /(^|[\\/])\.\.([\\/]|$)/;

export interface SafePathResult {
  ok: boolean;
  normalized: string;
  reason?: string;
}

export const normalizeRelativePath = (inputPath: string): SafePathResult => {
  const raw = (inputPath || '').trim();
  if (!raw) return { ok: false, normalized: '', reason: 'Path is empty.' };
  if (raw.startsWith('/') || raw.startsWith('\\') || /^[a-zA-Z]:/.test(raw)) {
    return { ok: false, normalized: '', reason: 'Absolute paths are not allowed.' };
  }

  const slashNormalized = raw.replace(/\\/g, '/').replace(/\/+/g, '/');
  if (INVALID_PATH_SEGMENT.test(slashNormalized)) {
    return { ok: false, normalized: '', reason: 'Path traversal is not allowed.' };
  }

  const parts = slashNormalized
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== '.');

  if (parts.some((part) => part === '..')) {
    return { ok: false, normalized: '', reason: 'Path traversal is not allowed.' };
  }

  return { ok: true, normalized: parts.join('/') };
};

