import type { RuntimeMode, TerminalClientMessage } from '../shared/contracts/terminal';

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';
const resolvePtyWsUrl = () => {
  const fallbackUrl = `${WS_PROTOCOL}://${window.location.hostname || '127.0.0.1'}:8787/pty`;
  const configuredUrl = (import.meta as any).env?.VITE_PTY_WS_URL as string | undefined;
  if (!configuredUrl) return fallbackUrl;
  if (window.location.protocol === 'https:' && configuredUrl.startsWith('ws://')) {
    return `wss://${configuredUrl.slice('ws://'.length)}`;
  }
  return configuredUrl;
};
const PTY_WS_URL = resolvePtyWsUrl();

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeout: number;
}

class TerminalSyncManager {
  private socket: WebSocket | null = null;
  private queue: TerminalClientMessage[] = [];
  private isConnected = false;
  private requestCounter = 0;
  private pendingRequests = new Map<string, PendingRequest>();

  public onScanSuccess: ((structure: unknown[]) => void) | null = null;
  public onFileContent: ((path: string, content: string) => void) | null = null;
  public onError: ((message: string) => void) | null = null;
  public onCwdChanged: ((cwd: string) => void) | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = new WebSocket(PTY_WS_URL);
      this.socket.onopen = () => {
        this.isConnected = true;
        this.processQueue();
      };
      this.socket.onmessage = (event) => {
        if (typeof event.data !== 'string') return;

        try {
          const msg = JSON.parse(event.data) as Record<string, unknown>;
          if (msg.type === 'scanResult' && this.onScanSuccess) {
            this.onScanSuccess(Array.isArray(msg.structure) ? msg.structure : []);
            return;
          }
          if (msg.type === 'fileContent' && this.onFileContent) {
            this.onFileContent(String(msg.path || ''), String(msg.content || ''));
            return;
          }
          if (msg.type === 'cwdChanged' && this.onCwdChanged) {
            this.onCwdChanged(String(msg.cwd || ''));
            return;
          }
          if (msg.type === 'requestResult' && typeof msg.requestId === 'string') {
            this.resolveRequest(msg.requestId, Boolean(msg.success), msg.payload, msg.error);
            return;
          }
          if (msg.type === 'error' && this.onError) {
            this.onError(String(msg.message || 'Terminal sync error'));
          }
        } catch {
          // Ignore raw PTY stream messages.
        }
      };
      this.socket.onclose = () => {
        this.isConnected = false;
        this.rejectAllPending('Terminal sync disconnected.');
        setTimeout(() => this.connect(), 3000);
      };
      this.socket.onerror = () => {
        this.isConnected = false;
      };
    } catch (error) {
      console.error('[TerminalSync] Connection failed', error);
    }
  }

  private resolveRequest(requestId: string, success: boolean, payload: unknown, error?: unknown) {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) return;
    this.pendingRequests.delete(requestId);
    window.clearTimeout(pending.timeout);
    if (success) pending.resolve(payload);
    else pending.reject(new Error(String(error || 'Runtime bridge request failed.')));
  }

  private rejectAllPending(message: string) {
    this.pendingRequests.forEach((pending) => {
      window.clearTimeout(pending.timeout);
      pending.reject(new Error(message));
    });
    this.pendingRequests.clear();
  }

  private processQueue() {
    while (this.queue.length > 0 && this.isConnected) {
      const msg = this.queue.shift();
      if (!msg) continue;
      this.socket?.send(JSON.stringify(msg));
    }
  }

  private send(msg: TerminalClientMessage) {
    if (this.isConnected) {
      this.socket?.send(JSON.stringify(msg));
      return;
    }
    this.queue.push(msg);
  }

  private sendRequest<T>(msg: TerminalClientMessage & { requestId?: string }, timeoutMs = 15000): Promise<T> {
    const requestId = `req-${Date.now()}-${this.requestCounter++}`;
    const message = { ...msg, requestId } as TerminalClientMessage & { requestId: string };
    return new Promise<T>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Runtime bridge request timeout.'));
      }, timeoutMs);
      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      this.send(message as TerminalClientMessage);
    });
  }

  public syncFile(path: string, content: string) {
    this.send({ type: 'writeFile', path, content });
  }

  public readFile(path: string) {
    this.send({ type: 'readFile', path });
  }

  public deleteFile(path: string) {
    this.send({ type: 'deleteFile', path });
  }

  public requestScan() {
    this.send({ type: 'scan' });
  }

  public setCwd(cwd: string) {
    this.send({ type: 'setCwd', cwd });
  }

  public setFsRoot(path: string) {
    this.send({ type: 'setFsRoot', path });
  }

  public setRuntimeMode(mode: RuntimeMode) {
    this.send({ type: 'setRuntimeMode', mode });
  }

  public interrupt() {
    this.send({ type: 'interrupt' });
  }

  public gitStatus(cwd?: string): Promise<{ stdout: string }> {
    return this.sendRequest<{ stdout: string }>({ type: 'gitStatus', cwd });
  }

  public gitInit(cwd?: string): Promise<{ stdout: string }> {
    return this.sendRequest<{ stdout: string }>({ type: 'gitInit', cwd });
  }

  public gitStage(paths?: string[], cwd?: string): Promise<{ stdout: string }> {
    return this.sendRequest<{ stdout: string }>({ type: 'gitStage', paths, cwd });
  }

  public gitUnstage(paths?: string[], cwd?: string): Promise<{ stdout: string }> {
    return this.sendRequest<{ stdout: string }>({ type: 'gitUnstage', paths, cwd });
  }

  public gitCommit(message: string, cwd?: string): Promise<{ stdout: string }> {
    return this.sendRequest<{ stdout: string }>({ type: 'gitCommit', cwd, message });
  }

  public gitClone(repoUrl: string, destination?: string): Promise<{ stdout: string; clonePath: string }> {
    return this.sendRequest<{ stdout: string; clonePath: string }>({ type: 'gitClone', repoUrl, destination }, 60000);
  }
}

export const terminalSync = new TerminalSyncManager();
