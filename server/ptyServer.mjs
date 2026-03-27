import http from 'node:http';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';

const PORT = Number(process.env.PTY_PORT || 8787);
const LISTEN_HOST = process.env.PTY_HOST || '127.0.0.1';
const MAX_MESSAGE_BYTES = 1024 * 512;
const MAX_INPUT_LENGTH = 8192;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_SCAN_NODES = 12000;

const WORKSPACE_DIR = path.join(process.cwd(), '.workspace');
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const isLoopbackAddress = (address = '') => {
  const normalized = address.replace('::ffff:', '');
  return normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost';
};

const withCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const isAbsoluteLike = (value) => path.isAbsolute(value) || /^[a-zA-Z]:[\\/]/.test(value);

const normalizeRelativeWorkspacePath = (rawPath) => {
  let candidate = String(rawPath || '').replace(/\0/g, '').trim();
  if (candidate.startsWith('/')) candidate = candidate.replace(/^\/+/, '');
  if (!candidate) return '';
  if (isAbsoluteLike(candidate)) {
    throw new Error('Absolute path is not allowed in online mode.');
  }

  const normalized = path.normalize(candidate);
  if (normalized.startsWith('..') || normalized.includes(`${path.sep}..${path.sep}`) || normalized === '..') {
    throw new Error('Path traversal is not allowed in online mode.');
  }

  return normalized;
};

const runGit = (args, cwd) =>
  new Promise((resolve, reject) => {
    execFile('git', args, { cwd, windowsHide: true, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || stdout || error.message || 'Git command failed.').trim()));
        return;
      }
      resolve({ stdout: String(stdout || '').trim() });
    });
  });

const server = http.createServer((req, res) => {
  withCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, service: 'capy-pty', mode: 'dual-runtime', listenHost: LISTEN_HOST }));
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket, req) => {
  const remoteIp = req.socket.remoteAddress || '';
  if (!isLoopbackAddress(remoteIp)) {
    socket.close();
    return;
  }

  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const shellArgs = process.platform === 'win32' ? ['-NoLogo'] : [];

  let runtimeMode = 'online';
  let currentCwd = WORKSPACE_DIR;
  let fsRoot = WORKSPACE_DIR;

  const sendJson = (payload) => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(payload));
    }
  };

  const sendSocketError = (message, requestId) => {
    if (requestId) {
      sendJson({ type: 'requestResult', requestId, success: false, error: message });
      return;
    }
    sendJson({ type: 'error', message });
  };

  const resolvePathForMode = (rawPath, options = {}) => {
    const { allowRoot = false, relativeBase = fsRoot } = options;
    const incoming = String(rawPath || '').replace(/\0/g, '').trim();

    if (!incoming) {
      if (allowRoot) return runtimeMode === 'online' ? WORKSPACE_DIR : relativeBase;
      throw new Error('Path cannot be empty.');
    }

    if (runtimeMode === 'online') {
      const normalized = normalizeRelativeWorkspacePath(incoming);
      if (!normalized) return WORKSPACE_DIR;
      const resolved = path.resolve(WORKSPACE_DIR, normalized);
      if (resolved !== WORKSPACE_DIR && !resolved.startsWith(`${WORKSPACE_DIR}${path.sep}`)) {
        throw new Error('Path escapes online workspace.');
      }
      return resolved;
    }

    if (incoming === '/') {
      return path.parse(currentCwd).root || currentCwd;
    }

    if (isAbsoluteLike(incoming)) {
      return path.resolve(incoming);
    }

    return path.resolve(relativeBase, incoming);
  };

  const resolveGitCwd = (cwdInput) => {
    if (!cwdInput) return currentCwd;
    return resolvePathForMode(cwdInput, { allowRoot: true, relativeBase: currentCwd });
  };

  const readJsonMessage = (raw) => {
    if (raw.length > MAX_MESSAGE_BYTES) {
      throw new Error('Message too large.');
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      throw new Error('Invalid JSON payload.');
    }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
      throw new Error('Invalid message format.');
    }
    return parsed;
  };

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

    socket.on('message', async (raw) => {
      let msg = null;
      try {
        msg = readJsonMessage(raw);
      } catch (error) {
        sendSocketError(error instanceof Error ? error.message : 'Invalid message.');
        return;
      }

      const requestId = typeof msg.requestId === 'string' ? msg.requestId : undefined;

      if (msg.type === 'input' && typeof msg.data === 'string') {
        if (msg.data.length > MAX_INPUT_LENGTH) {
          sendSocketError('Input exceeds maximum size.', requestId);
          return;
        }
        ptyProcess.write(msg.data);
        return;
      }

      if (msg.type === 'interrupt') {
        ptyProcess.write('\u0003');
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

      if (msg.type === 'setRuntimeMode' && (msg.mode === 'online' || msg.mode === 'local-runtime')) {
        runtimeMode = msg.mode;
        if (runtimeMode === 'online') {
          currentCwd = WORKSPACE_DIR;
          fsRoot = WORKSPACE_DIR;
          if (process.platform === 'win32') {
            ptyProcess.write(`cd "${currentCwd.replace(/"/g, '\\"')}"\r`);
          } else {
            ptyProcess.write(`cd "${currentCwd.replace(/"/g, '\\"')}"\n`);
          }
        }
        sendJson({ type: 'cwdChanged', cwd: currentCwd });
        return;
      }

      if (msg.type === 'setCwd' && typeof msg.cwd === 'string') {
        try {
          const targetPath = resolvePathForMode(msg.cwd, { allowRoot: true, relativeBase: currentCwd });
          if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
            throw new Error('Target directory does not exist.');
          }

          currentCwd = targetPath;
          fsRoot = targetPath;

          const escaped = targetPath.replace(/"/g, '\\"');
          if (process.platform === 'win32') {
            ptyProcess.write(`cd "${escaped}"\r`);
          } else {
            ptyProcess.write(`cd "${escaped}"\n`);
          }

          sendJson({ type: 'cwdChanged', cwd: currentCwd });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Invalid cwd.', requestId);
        }
        return;
      }

      if (msg.type === 'setFsRoot' && typeof msg.path === 'string') {
        try {
          const targetRoot = resolvePathForMode(msg.path, { allowRoot: true, relativeBase: currentCwd });
          if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
            throw new Error('File-system root does not exist.');
          }
          fsRoot = targetRoot;
          sendJson({ type: 'cwdChanged', cwd: fsRoot });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Invalid file-system root.', requestId);
        }
        return;
      }

      if (msg.type === 'writeFile' && typeof msg.path === 'string' && typeof msg.content === 'string') {
        try {
          const contentBytes = Buffer.byteLength(msg.content, 'utf8');
          if (contentBytes > MAX_FILE_BYTES) {
            throw new Error('File write exceeds maximum size.');
          }

          const fullPath = resolvePathForMode(msg.path, { relativeBase: fsRoot });
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(fullPath, msg.content, 'utf8');
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Failed to write file.', requestId);
        }
        return;
      }

      if (msg.type === 'deleteFile' && typeof msg.path === 'string') {
        try {
          const fullPath = resolvePathForMode(msg.path, { relativeBase: fsRoot });
          if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
          }
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Failed to delete path.', requestId);
        }
        return;
      }

      if (msg.type === 'readFile' && typeof msg.path === 'string') {
        try {
          const fullPath = resolvePathForMode(msg.path, { relativeBase: fsRoot });
          if (!fs.existsSync(fullPath)) {
            throw new Error('File not found.');
          }

          const stat = fs.statSync(fullPath);
          if (stat.size > MAX_FILE_BYTES) {
            throw new Error('File exceeds read size limit.');
          }

          const content = fs.readFileSync(fullPath, 'utf8');
          sendJson({ type: 'fileContent', path: msg.path, content });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Read failed.', requestId);
        }
        return;
      }

      if (msg.type === 'scan') {
        try {
          let scannedNodes = 0;
          const scan = (dir, parentPath = '') => {
            const results = [];
            const items = fs.readdirSync(dir);
            for (const item of items) {
              if (item === 'node_modules') continue;
              if (runtimeMode === 'online' && item === '.git') continue;

              scannedNodes += 1;
              if (scannedNodes > MAX_SCAN_NODES) {
                throw new Error('Scan limit exceeded.');
              }

              const fullPath = path.join(dir, item);
              let stat = null;
              try {
                stat = fs.statSync(fullPath);
              } catch {
                continue;
              }
              const relPath = parentPath ? `${parentPath}/${item}` : item;

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

          const structure = scan(fsRoot);
          sendJson({ type: 'scanResult', structure });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Scan failed.', requestId);
        }
        return;
      }

      if (msg.type === 'gitStatus') {
        try {
          const cwd = resolveGitCwd(msg.cwd);
          const { stdout } = await runGit(['status', '--porcelain=1', '-b'], cwd);
          sendJson({ type: 'requestResult', requestId, success: true, payload: { stdout } });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Git status failed.', requestId);
        }
        return;
      }

      if (msg.type === 'gitInit') {
        try {
          const cwd = resolveGitCwd(msg.cwd);
          const { stdout } = await runGit(['init'], cwd);
          sendJson({ type: 'requestResult', requestId, success: true, payload: { stdout } });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Git init failed.', requestId);
        }
        return;
      }

      if (msg.type === 'gitStage') {
        try {
          const cwd = resolveGitCwd(msg.cwd);
          const paths = Array.isArray(msg.paths) ? msg.paths.filter((item) => typeof item === 'string' && item.trim()) : [];
          const args = paths.length > 0 ? ['add', '--', ...paths] : ['add', '-A'];
          const { stdout } = await runGit(args, cwd);
          sendJson({ type: 'requestResult', requestId, success: true, payload: { stdout } });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Git stage failed.', requestId);
        }
        return;
      }

      if (msg.type === 'gitUnstage') {
        try {
          const cwd = resolveGitCwd(msg.cwd);
          const paths = Array.isArray(msg.paths) ? msg.paths.filter((item) => typeof item === 'string' && item.trim()) : [];
          const args = paths.length > 0 ? ['restore', '--staged', '--', ...paths] : ['reset'];
          const { stdout } = await runGit(args, cwd);
          sendJson({ type: 'requestResult', requestId, success: true, payload: { stdout } });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Git unstage failed.', requestId);
        }
        return;
      }

      if (msg.type === 'gitCommit' && typeof msg.message === 'string') {
        try {
          const cwd = resolveGitCwd(msg.cwd);
          const commitMessage = msg.message.trim();
          if (!commitMessage) throw new Error('Commit message is required.');
          const { stdout } = await runGit(['commit', '-m', commitMessage], cwd);
          sendJson({ type: 'requestResult', requestId, success: true, payload: { stdout } });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Git commit failed.', requestId);
        }
        return;
      }

      if (msg.type === 'gitClone' && typeof msg.repoUrl === 'string') {
        try {
          const repoUrl = msg.repoUrl.trim();
          if (!repoUrl) throw new Error('Repository URL is required.');

          const destinationInput = typeof msg.destination === 'string' ? msg.destination.trim() : '';
          const cloneParent = destinationInput
            ? resolvePathForMode(destinationInput, { allowRoot: true, relativeBase: currentCwd })
            : currentCwd;

          if (!fs.existsSync(cloneParent)) {
            fs.mkdirSync(cloneParent, { recursive: true });
          }

          const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'repository';
          const clonePath = path.join(cloneParent, repoName);
          const { stdout } = await runGit(['clone', repoUrl], cloneParent);
          sendJson({ type: 'requestResult', requestId, success: true, payload: { stdout, clonePath } });
        } catch (error) {
          sendSocketError(error instanceof Error ? error.message : 'Git clone failed.', requestId);
        }
        return;
      }

      sendSocketError(`Unsupported message type: ${msg.type}`, requestId);
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
  if (url.pathname !== '/pty' || !isLoopbackAddress(remote)) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(PORT, LISTEN_HOST, () => {
  console.log(`[capy-pty] listening on ${LISTEN_HOST}:${PORT}`);
});

