import type { RuntimeMode } from '../../../shared/contracts/terminal';
import { emitTerminalSendCommand, emitTerminalSetCwd } from '../../../lib/terminalBridge';
import { terminalSync } from '../../../lib/terminalSync';

export interface GitCloneResult {
  stdout: string;
  clonePath: string;
}

export const localRuntimeAdapter = {
  setRuntimeMode: (mode: RuntimeMode): void => {
    terminalSync.setRuntimeMode(mode);
  },

  setFsRoot: (path: string): void => {
    terminalSync.setFsRoot(path);
  },

  setSessionCwd: (terminalId: string, cwd: string): void => {
    emitTerminalSetCwd({ terminalId, cwd });
    terminalSync.setCwd(cwd);
    terminalSync.setFsRoot(cwd);
  },

  runCommand: (terminalId: string, command: string): void => {
    const normalized = command.endsWith('\r') ? command : `${command}\r`;
    emitTerminalSendCommand({ terminalId, command: normalized });
  },

  interruptSession: (terminalId: string): void => {
    emitTerminalSendCommand({ terminalId, command: '\u0003' });
    terminalSync.interrupt();
  },

  interruptAllSessions: (terminalIds: string[]): void => {
    terminalIds.forEach((id) => emitTerminalSendCommand({ terminalId: id, command: '\u0003' }));
    terminalSync.interrupt();
  },

  requestWorkspaceScan: (): void => {
    terminalSync.requestScan();
  },

  gitStatus: (cwd?: string): Promise<{ stdout: string }> => {
    return terminalSync.gitStatus(cwd);
  },

  gitInit: (cwd?: string): Promise<{ stdout: string }> => {
    return terminalSync.gitInit(cwd);
  },

  gitStage: (paths?: string[], cwd?: string): Promise<{ stdout: string }> => {
    return terminalSync.gitStage(paths, cwd);
  },

  gitUnstage: (paths?: string[], cwd?: string): Promise<{ stdout: string }> => {
    return terminalSync.gitUnstage(paths, cwd);
  },

  gitCommit: (message: string, cwd?: string): Promise<{ stdout: string }> => {
    return terminalSync.gitCommit(message, cwd);
  },

  gitClone: (repoUrl: string, destination?: string): Promise<GitCloneResult> => {
    return terminalSync.gitClone(repoUrl, destination);
  }
};

