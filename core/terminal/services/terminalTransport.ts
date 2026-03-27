import type { TerminalClientMessage } from '../../../shared/contracts/terminal';

interface TerminalTransportHandlers {
  onPtyData: (data: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (message: string) => void;
}

export class TerminalTransport {
  private socket: WebSocket | null = null;

  public connect(url: string, handlers: TerminalTransportHandlers): void {
    this.disconnect();

    const ws = new WebSocket(url);
    this.socket = ws;

    ws.addEventListener('open', () => handlers.onOpen?.());

    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;

      if (event.data.startsWith('{')) {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed?.type === 'error') {
            handlers.onError?.(String(parsed.message || 'Terminal transport error'));
            return;
          }
        } catch {
          // Non-JSON PTY data, continue.
        }
      }

      handlers.onPtyData(event.data);
    });

    ws.addEventListener('error', () => {
      handlers.onError?.('WebSocket connection failed.');
    });

    ws.addEventListener('close', () => {
      if (this.socket === ws) {
        this.socket = null;
      }
      handlers.onClose?.();
    });
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public send(message: TerminalClientMessage): void {
    if (!this.isConnected() || !this.socket) return;
    this.socket.send(JSON.stringify(message));
  }

  public disconnect(): void {
    if (!this.socket) return;
    try {
      this.socket.close();
    } catch {
      // noop
    } finally {
      this.socket = null;
    }
  }
}

