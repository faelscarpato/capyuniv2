import http from 'node:http';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';

const PORT = Number(process.env.PTY_PORT || 8787);
const TERMINAL_MODE = process.env.CAPY_TERMINAL_MODE === 'hardened' ? 'hardened' : 'dev';
const LISTEN_HOST = TERMINAL_MODE === 'hardened' ? '127.0.0.1' : '0.0.0.0';

const MAX_MESSAGE_BYTES = 1024 * 512;
const MAX_INPUT_LENGTH = 8192;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_SCAN_NODES = 5000;

const WORKSPACE_DIR = path.join(process.cwd(), '.workspace');
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const ALLOWED_ORIGINS = (process.env.CAPY_ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const isLoopbackAddress = (address = '') =>
  address === '127.0.0.1' ||
  address === '::1' ||
  address === '::ffff:127.0.0.1';

const isPrivateAddress = (address = '') => {
  const ip = address.replace('::ffff:', '');
  if (/^10\./.test(ip) || /^192\.168\./.test(ip)) return true;

  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const second = Number(match172[1]);
    return second >= 16 && second <= 31;
  }
  return false;
};

const isAllowedRemote = (remoteAddress = '') => {
  if (TERMINAL_MODE === 'hardened') {
    return isLoopbackAddress(remoteAddress);
  }
  return isLoopbackAddress(remoteAddress) || isPrivateAddress(remoteAddress);
};

const isLocalOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;
    return hostname === 'localhost' || isLoopbackAddress(hostname) || isPrivateAddress(hostname);
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return TERMINAL_MODE === 'dev';

  if (TERMINAL_MODE === 'hardened') {
    return ALLOWED_ORIGINS.includes(origin);
  }

  return isLocalOrigin(origin) || ALLOWED_ORIGINS.includes(origin);
};

const toSafeWorkspacePath = (rawPath, options = {}) => {
  const { allowRoot = false, absoluteFromWorkspaceRoot = false } = options;

  if (typeof rawPath !== 'string') {
    throw new Error('Path must be a string.');
  }

  let candidate = rawPath.replace(/\0/g, '').trim();
  if (absoluteFromWorkspaceRoot && candidate.startsWith('/')) {
    candidate = candidate.replace(/^\/+/, '');
  }

  if (!candidate) {
    if (allowRoot) return WORKSPACE_DIR;
    throw new Error('Path cannot be empty.');
  }

  if (path.isAbsolute(candidate)) {
    throw new Error('Absolute path is not allowed.');
  }

  const normalized = path.normalize(candidate);
  if (normalized.startsWith('..') || normalized.includes(`${path.sep}..${path.sep}`) || normalized === '..') {
    throw new Error('Path traversal is not allowed.');
  }

  const resolved = path.resolve(WORKSPACE_DIR, normalized);
  if (resolved !== WORKSPACE_DIR && !resolved.startsWith(`${WORKSPACE_DIR}${path.sep}`)) {
    throw new Error('Path escapes workspace boundary.');
  }

  return resolved;
};

const sendSocketError = (socket, message) => {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify({ type: 'error', message }));
  }
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, service: 'capy-pty', mode: TERMINAL_MODE }));
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket, req) => {
  const remoteIp = req.socket.remoteAddress || '';
  console.log(`[capy-pty] Connection accepted from ${remoteIp} (mode=${TERMINAL_MODE})`);

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

    const disposable = ptyProcess.onData((data) => {
      if (socket.readyState === 1) {
        socket.send(data);
      }
    });

    ptyProcess.onExit(() => {
      try {
        socket.close();
      } catch {
        // noop
      }
    });

    socket.on('message', (raw) => {
      if (raw.length > MAX_MESSAGE_BYTES) {
        sendSocketError(socket, 'Message too large.');
        return;
      }

      let msg = null;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        sendSocketError(socket, 'Invalid JSON payload.');
        return;
      }

      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
        sendSocketError(socket, 'Invalid message format.');
        return;
      }

      if (msg.type === 'input' && typeof msg.data === 'string') {
        if (msg.data.length > MAX_INPUT_LENGTH) {
          sendSocketError(socket, 'Input exceeds maximum size.');
          return;
        }
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

      if (msg.type === 'writeFile' && typeof msg.path === 'string' && typeof msg.content === 'string') {
        try {
          const contentBytes = Buffer.byteLength(msg.content, 'utf8');
          if (contentBytes > MAX_FILE_BYTES) {
            sendSocketError(socket, 'File write exceeds maximum size.');
            return;
          }

          const fullPath = toSafeWorkspacePath(msg.path);
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(fullPath, msg.content, 'utf8');
        } catch (error) {
          sendSocketError(socket, error instanceof Error ? error.message : 'Failed to write file.');
        }
        return;
      }

      if (msg.type === 'deleteFile' && typeof msg.path === 'string') {
        try {
          const fullPath = toSafeWorkspacePath(msg.path);
          if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
          }
        } catch (error) {
          sendSocketError(socket, error instanceof Error ? error.message : 'Failed to delete path.');
        }
        return;
      }

      if (msg.type === 'scan') {
        let scannedNodes = 0;

        const scan = (dir, parentPath = '') => {
          const results = [];
          const items = fs.readdirSync(dir);
          for (const item of items) {
            if (item === '.git' || item === 'node_modules') continue;

            scannedNodes += 1;
            if (scannedNodes > MAX_SCAN_NODES) {
              throw new Error('Scan limit exceeded.');
            }

            const fullPath = path.join(dir, item);
            const relPath = parentPath ? `${parentPath}/${item}` : item;
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              results.push({
                name: item,
                type: 'folder',
                path: relPath,
                children: scan(fullPath, relPath)
              });
            } else {
              results.push({ name: item, type: 'file', path: relPath });
            }
          }
          return results;
        };

        try {
          const structure = scan(WORKSPACE_DIR);
          socket.send(JSON.stringify({ type: 'scanResult', structure }));
        } catch (error) {
          sendSocketError(socket, error instanceof Error ? error.message : 'Scan failed.');
        }
        return;
      }

      if (msg.type === 'readFile' && typeof msg.path === 'string') {
        try {
          const fullPath = toSafeWorkspacePath(msg.path);
          if (!fs.existsSync(fullPath)) {
            sendSocketError(socket, 'File not found.');
            return;
          }

          const stat = fs.statSync(fullPath);
          if (stat.size > MAX_FILE_BYTES) {
            sendSocketError(socket, 'File exceeds read size limit.');
            return;
          }

          const content = fs.readFileSync(fullPath, 'utf8');
          socket.send(JSON.stringify({ type: 'fileContent', path: msg.path, content }));
        } catch (error) {
          sendSocketError(socket, error instanceof Error ? error.message : 'Read failed.');
        }
        return;
      }

      if (msg.type === 'setCwd' && typeof msg.cwd === 'string') {
        try {
          const targetPath = msg.cwd.trim() === '/' ? WORKSPACE_DIR : toSafeWorkspacePath(msg.cwd, {
            absoluteFromWorkspaceRoot: true,
            allowRoot: true
          });
          const escaped = targetPath.replace(/"/g, '\\"');
          if (process.platform === 'win32') {
            ptyProcess.write(`cd "${escaped}"\r`);
          } else {
            ptyProcess.write(`cd "${escaped}"\n`);
          }
        } catch (error) {
          sendSocketError(socket, error instanceof Error ? error.message : 'Invalid cwd.');
        }
      }
    });

    socket.on('close', () => {
      disposable.dispose();
      try {
        ptyProcess.kill();
      } catch {
        // noop
      }
    });
  } catch (error) {
    console.error('[capy-pty] Failed to spawn PTY:', error);
    socket.close();
  }
});

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const remote = req.socket.remoteAddress || '';
  const origin = req.headers.origin || '';

  if (url.pathname !== '/pty') {
    socket.destroy();
    return;
  }

  if (!isAllowedRemote(remote)) {
    socket.destroy();
    return;
  }

  if (!isAllowedOrigin(origin)) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(PORT, LISTEN_HOST, () => {
  console.log(`[capy-pty] listening on ${LISTEN_HOST}:${PORT} (mode=${TERMINAL_MODE})`);
});

