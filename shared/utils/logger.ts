export const logger = {
  info: (...args: unknown[]) => console.info('[CapyUNI]', ...args),
  warn: (...args: unknown[]) => console.warn('[CapyUNI]', ...args),
  error: (...args: unknown[]) => console.error('[CapyUNI]', ...args)
};

