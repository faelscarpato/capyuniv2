import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { executeCommand, getTerminalCwdPath } from '../../lib/terminalEngine';
import { onTerminalSetCwd, onTerminalSendCommand } from '../../lib/terminalBridge';
import { useUIStore } from '../../stores/uiStore';
import { useOnboardingStore } from '../../features/onboarding/store/onboardingStore';
import { TerminalTransport } from '../../core/terminal/services/terminalTransport';
import { useTerminalStore } from '../../core/terminal/store/terminalStore';
import { useRuntimeModeStore } from '../../features/local-runtime/store/runtimeModeStore';
import { useLocalRuntimeStore } from '../../features/local-runtime/store/localRuntimeStore';
import { localRuntimeAdapter } from '../../features/local-runtime/adapters/LocalRuntimeAdapter';

type TerminalMode = 'real' | 'simulated';
const PTY_WS_URL = (import.meta as any).env?.VITE_PTY_WS_URL || `ws://${window.location.hostname || '127.0.0.1'}:8787/pty`;
const SIMULATED_COMMANDS = new Set(['help', 'ls', 'cd', 'pwd', 'cat', 'touch', 'mkdir', 'rm', 'echo', 'clear']);
const LOCAL_RUNTIME_COMMANDS = new Set([
  'node',
  'npm',
  'pnpm',
  'yarn',
  'npx',
  'git',
  'vite',
  'next',
  'python',
  'pip',
  'bash',
  'sh',
  'pwsh',
  'powershell'
]);


interface TerminalViewProps {
  terminalId: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ terminalId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandRef = useRef('');
  const realCommandRef = useRef('');
  const transportRef = useRef<TerminalTransport | null>(null);
  const modeRef = useRef<TerminalMode>('simulated');
  const hasTrackedUsageRef = useRef(false);

  const { currentTheme, isPanelOpen, language } = useUIStore();
  const { markTerminalUsed } = useOnboardingStore();
  const { setSessionMode, setSessionCwd } = useTerminalStore();
  const { mode } = useRuntimeModeStore();
  const tt = (pt: string, en: string) => (language === 'pt' ? pt : en);

  const getXtermTheme = (themeId: string) => {
    if (themeId === 'midnight-pro') {
      return {
        background: '#000000',
        foreground: '#F5F5F7',
        cursor: '#3b82f6',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        cursorAccent: '#000000',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#3b82f6',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#F5F5F7'
      };
    }

    if (themeId === 'capy-dark') {
      return {
        background: '#0F172A',
        foreground: '#E2E8F0',
        cursor: '#8B5CF6',
        selectionBackground: 'rgba(139, 92, 246, 0.3)',
        black: '#020617',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#F8FAFC'
      };
    }

    return {
      background: '#1e1e1e',
      foreground: '#cccccc',
      cursor: '#A0D468',
      selectionBackground: 'rgba(255, 255, 255, 0.1)'
    };
  };

  const normalizeShellCommand = (raw: string): string => raw.trim().replace(/\s+/g, ' ');

  const shouldRequireLocalRuntime = (raw: string): boolean => {
    const normalized = normalizeShellCommand(raw);
    if (!normalized) return false;
    const token = (normalized.split(' ')[0] || '').toLowerCase();
    if (SIMULATED_COMMANDS.has(token)) return false;
    if (LOCAL_RUNTIME_COMMANDS.has(token)) return true;
    return !SIMULATED_COMMANDS.has(token);
  };

  const requestLocalRuntimeActivationForCommand = (command: string, term: Terminal) => {
    const cleaned = normalizeShellCommand(command);
    if (!cleaned) return;

    useRuntimeModeStore.getState().ensureLocalRuntime({
      requestedBy: 'Terminal',
      actionLabel: tt(`Executar comando local: ${cleaned}`, `Run local command: ${cleaned}`),
      onActivated: () => {
        let tries = 0;
        const sendWhenReady = () => {
          const runtimeState = useLocalRuntimeStore.getState();
          if (runtimeState.bridgeStatus === 'connected') {
            localRuntimeAdapter.runCommand(terminalId, cleaned);
            return;
          }
          if (runtimeState.bridgeStatus === 'connecting' && tries < 12) {
            tries += 1;
            window.setTimeout(sendWhenReady, 250);
            return;
          }
          useRuntimeModeStore
            .getState()
            .appendBridgeLog(
              tt(
                `Não foi possível enviar o comando "${cleaned}" porque a ponte do runtime local não estava conectada.`,
                `Could not dispatch command "${cleaned}" because local runtime bridge was not connected.`
              )
            );
        };
        sendWhenReady();
      }
    });

    term.writeln(
      `\r\n[Capy Runtime] ${tt(
        'Ative o Runtime Local para executar este comando no seu ambiente local real.',
        'Activate Local Runtime to run this command in your real local environment.'
      )}`
    );
    prompt(term);
  };

  const safeFit = () => {
    if (!terminalRef.current || terminalRef.current.clientHeight < 10 || terminalRef.current.clientWidth < 10) {
      return;
    }

    if (fitAddonRef.current && xtermRef.current) {
      try {
        fitAddonRef.current.fit();
        xtermRef.current.refresh(0, xtermRef.current.rows - 1);

        if (transportRef.current?.isConnected()) {
          transportRef.current.send({ type: 'resize', cols: xtermRef.current.cols, rows: xtermRef.current.rows });
        }
      } catch {
        // noop
      }
    }
  };

  const prompt = (term: Terminal) => {
    const user = '\x1b[1;36mcapy\x1b[0m';
    const at = '\x1b[1;30m@\x1b[0m';
    const machine = '\x1b[1;34muni\x1b[0m';
    const arrow = '\x1b[1;32m ➜ \x1b[0m';
    const pathColor = '\x1b[1;35m';
    const reset = '\x1b[0m';
    const cwd = getTerminalCwdPath(terminalId);

    // Warp-style fancy prompt
    term.write(`\r\n${user}${at}${machine}${arrow}${pathColor}${cwd}${reset} `);
  };

  const setMode = (term: Terminal, mode: TerminalMode) => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    setSessionMode(terminalId, mode);

    if (mode === 'real') {
      useLocalRuntimeStore.getState().markSessionConnected(terminalId);
      useRuntimeModeStore.getState().setAvailability('available');
      term.writeln(`\r\n\x1b[1;32m[Capy PTY]\x1b[0m ${tt('Conectado à instância', 'Connected to instance')} ${terminalId}`);
    } else {
      useLocalRuntimeStore.getState().markSessionDisconnected(terminalId);
      term.writeln(`\r\n\x1b[1;33m[Capy Terminal]\x1b[0m ${tt('Usando fallback simulado.', 'Using simulated fallback.')}`);
      prompt(term);
    }
  };

  const tryConnectRealTerminal = (term: Terminal) => {
    let resolved = false;
    let fallbackTimer: number | null = null;
    const announceFallback = (reason: string) => {
      if (modeRef.current === 'simulated') {
        term.writeln(
          `\r\n[Capy Runtime] ${tt(
            'Ponte do runtime local indisponível. Mantendo modo simulado.',
            'Local runtime bridge unavailable. Staying in simulated mode.'
          )}`
        );
        return;
      }
      useRuntimeModeStore.getState().setAvailability('unavailable');
      useRuntimeModeStore.getState().appendBridgeLog(reason);
      setMode(term, 'simulated');
    };

    try {
      const transport = new TerminalTransport();
      transportRef.current = transport;
      useLocalRuntimeStore.getState().setBridgeStatus('connecting');

      fallbackTimer = window.setTimeout(() => {
        if (resolved) return;
        resolved = true;
        transport.disconnect();
        announceFallback(
          tt(
            'Tempo esgotado ao conectar na ponte do runtime local.',
            'Timed out connecting to local runtime bridge.'
          )
        );
      }, 1200);

      transport.connect(PTY_WS_URL, {
        onOpen: () => {
          if (resolved) return;
          resolved = true;
          if (fallbackTimer) window.clearTimeout(fallbackTimer);

          useLocalRuntimeStore.getState().setBridgeStatus('connected');
          setMode(term, 'real');
          transport.send({ type: 'setRuntimeMode', mode: 'local-runtime' });
          if (xtermRef.current) {
            transport.send({ type: 'resize', cols: xtermRef.current.cols, rows: xtermRef.current.rows });
          }
          const initialCwd = getTerminalCwdPath(terminalId);
          if (initialCwd && initialCwd !== '/') {
            transport.send({ type: 'setCwd', cwd: initialCwd });
          }
        },
        onPtyData: (data) => {
          if (!xtermRef.current) return;
          useLocalRuntimeStore.getState().consumeTerminalOutput(terminalId, data);
          xtermRef.current.write(data);
        },
        onClose: () => {
          if (!resolved) {
            resolved = true;
            if (fallbackTimer) window.clearTimeout(fallbackTimer);
            announceFallback(
              tt(
                'A ponte do runtime local foi fechada antes da ativação.',
                'Local runtime bridge closed before activation.'
              )
            );
            return;
          }

          if (modeRef.current === 'real') {
            useRuntimeModeStore
              .getState()
              .appendBridgeLog(tt('Conexão com a ponte do runtime local encerrada.', 'Local runtime bridge connection closed.'));
            setMode(term, 'simulated');
          }
        },
        onError: (message) => {
          if (!resolved) {
            resolved = true;
            if (fallbackTimer) window.clearTimeout(fallbackTimer);
            announceFallback(
              message || tt('Falha de conexão com a ponte do runtime local.', 'Local runtime bridge connection failed.')
            );
          } else {
            useRuntimeModeStore
              .getState()
              .appendBridgeLog(message || tt('Erro na ponte do runtime local.', 'Local runtime bridge error.'));
          }
          useLocalRuntimeStore
            .getState()
            .setBridgeStatus('error', message || tt('Erro na ponte do runtime local.', 'Local runtime bridge error.'));
        }
      });
    } catch (error) {
      announceFallback(
        error instanceof Error
          ? error.message
          : tt('Falha ao inicializar a ponte do runtime local.', 'Failed to initialize local runtime bridge.')
      );
      useLocalRuntimeStore.getState().setBridgeStatus('error', String(error));
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    let isDisposed = false;
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let dataDisposable: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let unsubscribeSetCwd: any = null;
    let unsubscribeCommand: any = null;

    const runSimulatedCommand = (rawCommand: string) => {
      const command = rawCommand.trim();
      if (!command) {
        if (term) prompt(term);
        return;
      }

      if (mode === 'online' && shouldRequireLocalRuntime(command)) {
        if (term) requestLocalRuntimeActivationForCommand(command, term);
        return;
      }

      if (command === 'clear') {
        term?.clear();
        if (term) prompt(term);
        return;
      }

      if (command.length > 0) {
        const output = executeCommand(command, terminalId);
        if (output) term?.writeln(output);
      }

      if (term) prompt(term);
    };

    const initTerminal = () => {
      if (!terminalRef.current || isDisposed) return;

      // Ensure we have some dimensions or wait for them
      const { clientWidth, clientHeight } = terminalRef.current;
      if (clientWidth === 0 || clientHeight === 0) {
        // Wait for next frame if being mounted in hidden container
        requestAnimationFrame(initTerminal);
        return;
      }

      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        theme: getXtermTheme(currentTheme),
        convertEol: true,
        allowProposedApi: true,
        cursorStyle: 'block',
        scrollback: 2000
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      try {
        term.open(terminalRef.current);
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        requestAnimationFrame(() => {
          if (!isDisposed) {
            safeFit();
            term?.focus();
          }
        });

        term.writeln('\x1b[1;32mCapyUNI Terminal\x1b[0m v1.0');
        if (mode === 'local-runtime') {
          term.writeln(`\x1b[1;30m${tt('Conectando à ponte do runtime local...', 'Connecting to local runtime bridge...')}\x1b[0m`);
          useLocalRuntimeStore.getState().ensureSession(terminalId, getTerminalCwdPath(terminalId));
          useLocalRuntimeStore.getState().setActiveSession(terminalId);
          tryConnectRealTerminal(term);
        } else {
          term.writeln(`\x1b[1;30m${tt('Modo Online IDE ativo (terminal simulado).', 'Online IDE Mode active (simulated terminal).')}\x1b[0m`);
          setMode(term, 'simulated');
        }
        prompt(term);

        unsubscribeCommand = onTerminalSendCommand((event) => {
          const targetTerminalId = event.terminalId;
          if (targetTerminalId && targetTerminalId !== terminalId) return;
          const cmd = event.command;
          const sanitized = cmd.replace(/\r$/, '');

          if (mode === 'online' && shouldRequireLocalRuntime(sanitized)) {
            if (term) requestLocalRuntimeActivationForCommand(sanitized, term);
            return;
          }

          if (modeRef.current === 'real' && transportRef.current?.isConnected()) {
            transportRef.current.send({ type: 'input', data: cmd });
            if (sanitized.trim()) {
              useLocalRuntimeStore.getState().recordCommand(terminalId, sanitized);
            }
          } else if (modeRef.current === 'simulated' && term) {
            term.write(sanitized);
            term.write('\r\n');
            runSimulatedCommand(sanitized);
          }
        });

        dataDisposable = term.onData((data) => {
          if (!hasTrackedUsageRef.current) {
            markTerminalUsed();
            hasTrackedUsageRef.current = true;
          }

          if (modeRef.current === 'real') {
            if (transportRef.current?.isConnected()) {
              transportRef.current.send({ type: 'input', data });
            }

            if (data === '\r') {
              const entered = realCommandRef.current.trim();
              realCommandRef.current = '';
              if (entered) {
                useLocalRuntimeStore.getState().recordCommand(terminalId, entered);
              }
            } else if (data === '\u007f') {
              realCommandRef.current = realCommandRef.current.slice(0, -1);
            } else if (data >= ' ') {
              realCommandRef.current += data;
            }
            return;
          }

          if (data === '\x03') { // Ctrl+C
            commandRef.current = '';
            term?.write('^C\r\n');
            prompt(term!);
            return;
          }

          if (data === '\r') {
            const cmd = commandRef.current;
            commandRef.current = '';
            term?.write('\r\n');
            runSimulatedCommand(cmd);
            return;
          }

          if (data === '\u007f') {
            if (commandRef.current.length > 0) {
              commandRef.current = commandRef.current.slice(0, -1);
              term?.write('\b \b');
            }
            return;
          }

          if (data >= ' ') {
            commandRef.current += data;
            term?.write(data);
          }
        });

        unsubscribeSetCwd = onTerminalSetCwd((event) => {
          const targetTerminalId = event.terminalId;
          if (targetTerminalId && targetTerminalId !== terminalId) return;
          const cwd = event.cwd;

          setSessionCwd(terminalId, cwd);
          useLocalRuntimeStore.getState().setSessionCwd(terminalId, cwd);
          if (transportRef.current?.isConnected() && modeRef.current === 'real' && cwd !== '/') {
            transportRef.current.send({ type: 'setCwd', cwd });
          }
        });

        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.height > 0 && entry.contentRect.width > 0) {
              window.requestAnimationFrame(() => safeFit());
            }
          }
        });

        resizeObserver.observe(terminalRef.current);

      } catch (err) {
        console.error('Xterm initialization failed:', err);
      }
    };

    // Delay start slightly to allow layout to settle
    const initTimeout = setTimeout(initTerminal, 100);

    return () => {
      isDisposed = true;
      clearTimeout(initTimeout);
      dataDisposable?.dispose();
      unsubscribeSetCwd?.();
      unsubscribeCommand?.();
      resizeObserver?.disconnect();
      transportRef.current?.disconnect();
      transportRef.current = null;
      useLocalRuntimeStore.getState().markSessionDisconnected(terminalId);
      term?.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [mode, terminalId]);

  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = getXtermTheme(currentTheme);
    }
  }, [currentTheme]);

  useEffect(() => {
    if (isPanelOpen) {
      // Multiple attempts to fit as layout animation progresses
      const timers = [0, 100, 300, 600].map(ms =>
        setTimeout(() => {
          safeFit();
          if (xtermRef.current) {
            xtermRef.current.scrollToBottom();
          }
        }, ms)
      );

      return () => timers.forEach(clearTimeout);
    }
  }, [isPanelOpen]);

  // Handle data arrival scrolling
  useEffect(() => {
    if (xtermRef.current && modeRef.current === 'real') {
      // Auto-scroll is usually default, but we can reinforce it if needed
    }
  }, []);

  const handleContainerClick = () => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  };

  return (
    <div className="h-full w-full relative bg-black/20">
      <div
        ref={terminalRef}
        className="absolute inset-0 cursor-text overflow-hidden"
        style={{ padding: '8px 0 0 8px' }}
        onClick={handleContainerClick}
      />
    </div>
  );
};
