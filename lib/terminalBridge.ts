export interface TerminalSetCwdEvent {
  terminalId?: string;
  cwd: string;
}

export interface TerminalSendCommandEvent {
  terminalId?: string;
  command: string;
}

type TerminalBridgeHandler = (event: TerminalSetCwdEvent) => void;
type TerminalCommandHandler = (event: TerminalSendCommandEvent) => void;

const cwdHandlers = new Set<TerminalBridgeHandler>();
const commandHandlers = new Set<TerminalCommandHandler>();

export const onTerminalSetCwd = (handler: TerminalBridgeHandler) => {
  cwdHandlers.add(handler);
  return () => cwdHandlers.delete(handler);
};

export const emitTerminalSetCwd = (event: string | TerminalSetCwdEvent) => {
  const payload: TerminalSetCwdEvent = typeof event === 'string' ? { cwd: event } : event;
  cwdHandlers.forEach((handler) => handler(payload));
};

export const onTerminalSendCommand = (handler: TerminalCommandHandler) => {
  commandHandlers.add(handler);
  return () => commandHandlers.delete(handler);
};

export const emitTerminalSendCommand = (event: string | TerminalSendCommandEvent) => {
  const payload: TerminalSendCommandEvent = typeof event === 'string' ? { command: event } : event;
  commandHandlers.forEach((handler) => handler(payload));
};
