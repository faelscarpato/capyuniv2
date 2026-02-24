import http from 'node:http';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';

const PORT = Number(process.env.PTY_PORT || 8787);
const WORKSPACE_DIR = path.join(process.cwd(), '.workspace');

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const isLoopback = (address) =>
  address === '127.0.0.1' ||
  address === '::1' ||
  address === '::ffff:127.0.0.1' ||
  address === '::ffff:localhost' ||
  address.startsWith('192.168.') || // Allow local network
  address.startsWith('10.') ||
  address.startsWith('172.');

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  // Allow any local origin for dev
  return true;
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, service: 'capy-pty' }));
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket, req) => {
  const remoteIp = req.socket.remoteAddress;
  console.log(`[capy-pty] New connection from ${remoteIp}`);

  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const shellArgs = process.platform === 'win32' ? ['-NoLogo'] : [];

  try {
    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: WORKSPACE_DIR,
      env: process.env
    });

    const writeSafe = (data) => {
      if (socket.readyState === 1) socket.send(data);
    };

    const disposable = ptyProcess.onData((data) => writeSafe(data));

    ptyProcess.onExit(() => {
      console.log(`[capy-pty] PTY Process exited`);
      try { socket.close(); } catch { }
    });

    socket.on('message', (raw) => {
      let msg = null;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'input' && typeof msg.data === 'string') {
        ptyProcess.write(msg.data);
        return;
      }

      if (msg.type === 'resize') {
        const cols = Number(msg.cols);
        const rows = Number(msg.rows);
        if (Number.isFinite(cols) && Number.isFinite(rows) && cols > 0 && rows > 0) {
          ptyProcess.resize(cols, rows);
        }
        return;
      }

      // File Sync Actions
      if (msg.type === 'writeFile' && typeof msg.path === 'string' && typeof msg.content === 'string') {
        const fullPath = path.join(WORKSPACE_DIR, msg.path);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, msg.content);
        console.log(`[capy-pty] File synced: ${msg.path}`);
        return;
      }

      if (msg.type === 'deleteFile' && typeof msg.path === 'string') {
        const fullPath = path.join(WORKSPACE_DIR, msg.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`[capy-pty] File deleted: ${msg.path}`);
        }
        return;
      }

      if (msg.type === 'scan') {
        const scan = (dir, parentPath = '') => {
          const results = [];
          const items = fs.readdirSync(dir);
          for (const item of items) {
            // IGNORE .git folder and other heavy stuff
            if (item === '.git' || item === 'node_modules') continue;

            const fullPath = path.join(dir, item);
            const relPath = parentPath ? `${parentPath}/${item}` : item;
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              results.push({ name: item, type: 'folder', path: relPath, children: scan(fullPath, relPath) });
            } else {
              // Only send metadata, don't read content yet to avoid heavy messages
              results.push({ name: item, type: 'file', path: relPath });
            }
          }
          return results;
        };

        try {
          const structure = scan(WORKSPACE_DIR);
          socket.send(JSON.stringify({ type: 'scanResult', structure }));
        } catch (err) {
          console.error(`[capy-pty] Scan failed:`, err);
        }
        return;
      }

      if (msg.type === 'readFile' && typeof msg.path === 'string') {
        try {
          const fullPath = path.join(WORKSPACE_DIR, msg.path);
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            socket.send(JSON.stringify({ type: 'fileContent', path: msg.path, content }));
          }
        } catch (err) {
          console.error(`[capy-pty] Read failed:`, err);
        }
        return;
      }

      if (msg.type === 'setCwd' && typeof msg.cwd === 'string' && msg.cwd.trim()) {
        const cwd = msg.cwd.replace(/"/g, '\\"');
        if (process.platform === 'win32') {
          ptyProcess.write(`cd "${cwd}"\r`);
        } else {
          ptyProcess.write(`cd "${cwd}"\n`);
        }
      }
    });

    socket.on('close', () => {
      console.log(`[capy-pty] Connection closed`);
      disposable.dispose();
      try { ptyProcess.kill(); } catch { }
    });

  } catch (err) {
    console.error(`[capy-pty] Failed to spawn PTY:`, err);
    socket.close();
  }
});

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const remote = req.socket.remoteAddress || '';
  const origin = req.headers.origin || '';

  console.log(`[capy-pty] Upgrade request: ${url.pathname} from ${remote} (Origin: ${origin})`);

  if (url.pathname !== '/pty') {
    socket.destroy();
    return;
  }

  // Permissive check for dev/local network
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[capy-pty] listening on port ${PORT} (All interfaces)`);
});
