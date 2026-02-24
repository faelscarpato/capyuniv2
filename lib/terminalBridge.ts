type TerminalBridgeHandler = (cwd: string) => void;
type TerminalCommandHandler = (command: string) => void;

const cwdHandlers = new Set<TerminalBridgeHandler>();
const commandHandlers = new Set<TerminalCommandHandler>();

export const onTerminalSetCwd = (handler: TerminalBridgeHandler) => {
  cwdHandlers.add(handler);
  return () => cwdHandlers.delete(handler);
};

export const emitTerminalSetCwd = (cwd: string) => {
  cwdHandlers.forEach((handler) => handler(cwd));
};

export const onTerminalSendCommand = (handler: TerminalCommandHandler) => {
  commandHandlers.add(handler);
  return () => commandHandlers.delete(handler);
};

export const emitTerminalSendCommand = (command: string) => {
  commandHandlers.forEach((handler) => handler(command));
};
