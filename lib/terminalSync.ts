
const PTY_WS_URL = (import.meta as any).env?.VITE_PTY_WS_URL || `ws://${window.location.hostname}:8787/pty`;

class TerminalSyncManager {
    private socket: WebSocket | null = null;
    private queue: any[] = [];
    private isConnected = false;
    public onScanSuccess: ((structure: any) => void) | null = null;
    public onFileContent: ((path: string, content: string) => void) | null = null;

    constructor() {
        this.connect();
    }

    private connect() {
        try {
            this.socket = new WebSocket(PTY_WS_URL);
            this.socket.onopen = () => {
                this.isConnected = true;
                this.processQueue();
                console.log('[TerminalSync] Connected');
            };
            this.socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'scanResult' && this.onScanSuccess) {
                        this.onScanSuccess(msg.structure);
                    }
                    if (msg.type === 'fileContent' && this.onFileContent) {
                        this.onFileContent(msg.path, msg.content);
                    }
                } catch { /* noop */ }
            };
            this.socket.onclose = () => {
                this.isConnected = false;
                setTimeout(() => this.connect(), 3000);
            };
            this.socket.onerror = () => {
                this.isConnected = false;
            };
        } catch (e) {
            console.error('[TerminalSync] Connection failed', e);
        }
    }

    private processQueue() {
        while (this.queue.length > 0 && this.isConnected) {
            const msg = this.queue.shift();
            this.socket?.send(JSON.stringify(msg));
        }
    }

    public syncFile(path: string, content: string) {
        const msg = { type: 'writeFile', path, content };
        if (this.isConnected) {
            this.socket?.send(JSON.stringify(msg));
        } else {
            this.queue.push(msg);
        }
    }

    public readFile(path: string) {
        const msg = { type: 'readFile', path };
        if (this.isConnected) {
            this.socket?.send(JSON.stringify(msg));
        } else {
            this.queue.push(msg);
        }
    }

    public deleteFile(path: string) {
        const msg = { type: 'deleteFile', path };
        if (this.isConnected) {
            this.socket?.send(JSON.stringify(msg));
        } else {
            this.queue.push(msg);
        }
    }

    public requestScan() {
        const msg = { type: 'scan' };
        if (this.isConnected) {
            this.socket?.send(JSON.stringify(msg));
        } else {
            this.queue.push(msg);
        }
    }
}

export const terminalSync = new TerminalSyncManager();
