export interface CommandHandlerContext {
  source: 'keyboard' | 'palette' | 'menu' | 'api';
}

export type CommandHandler = (ctx: CommandHandlerContext) => void | Promise<void>;

const handlers = new Map<string, CommandHandler>();

export const commandRegistry = {
  register: (id: string, handler: CommandHandler) => {
    handlers.set(id, handler);
  },
  unregister: (id: string) => {
    handlers.delete(id);
  },
  execute: async (id: string, ctx: CommandHandlerContext) => {
    const handler = handlers.get(id);
    if (!handler) throw new Error(`Command not found: ${id}`);
    await handler(ctx);
  },
  list: () => Array.from(handlers.keys())
};

