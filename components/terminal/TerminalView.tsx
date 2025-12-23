import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { executeCommand } from '../../lib/terminalEngine';
import { useUIStore } from '../../stores/uiStore';

export const TerminalView: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandRef = useRef('');
  
  const { currentTheme, isPanelOpen } = useUIStore();

  const getXtermTheme = (themeId: string) => {
      if (themeId === 'github-light') {
          return {
              background: '#ffffff',
              foreground: '#24292f',
              cursor: '#000000',
              selectionBackground: 'rgba(0,0,0,0.1)',
              cursorAccent: '#ffffff'
          };
      } else if (themeId === 'capy-dark') {
          return {
              background: '#0F172A',
              foreground: '#E2E8F0',
              cursor: '#8B5CF6',
              selectionBackground: 'rgba(139, 92, 246, 0.3)',
          };
      }
      return {
        background: '#1e1e1e', 
        foreground: '#cccccc',
        cursor: '#A0D468',
        selectionBackground: 'rgba(255, 255, 255, 0.1)',
      };
  };

  // Helper to safely fit
  const safeFit = () => {
      // CRITICAL: Do not try to fit if the container is hidden or collapsed.
      // Fitting to 0x0 breaks xterm internal state.
      if (!terminalRef.current || terminalRef.current.clientHeight < 10 || terminalRef.current.clientWidth < 10) {
          return;
      }

      if (fitAddonRef.current && xtermRef.current) {
          try {
              fitAddonRef.current.fit();
              // Force a refresh of the viewport to ensure text renders
              xtermRef.current.refresh(0, xtermRef.current.rows - 1);
          } catch (e) {
              console.warn("Terminal fit failed", e);
          }
      }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: getXtermTheme(currentTheme),
      convertEol: true, 
      allowProposedApi: true,
      cursorStyle: 'block',
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initial safe fit
    requestAnimationFrame(() => {
        safeFit();
        term.focus();
    });

    // 2. Prompt Logic
    const prompt = () => {
        const isLight = currentTheme === 'github-light';
        const userColor = '\x1b[1;32m'; // Green
        const hostColor = '\x1b[1;34m'; // Blue
        const reset = '\x1b[0m';
        term.write(`\r\n${userColor}capy@uni${reset}:${hostColor}~${reset}$ `);
    };

    term.writeln(`Welcome to CapyUNI Terminal`);
    term.writeln('Type "help" for a list of commands.');
    prompt();

    // 3. Input Handling
    term.onKey(({ key, domEvent }) => {
        const ev = domEvent;
        const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

        if (ev.keyCode === 13) { // Enter
            const cmd = commandRef.current;
            commandRef.current = '';
            
            if (cmd.trim() === 'clear') {
                term.clear();
                prompt();
                return;
            }

            term.write('\r\n');
            if (cmd.length > 0) {
                const output = executeCommand(cmd);
                if (output) term.writeln(output);
            }
            prompt();
        } else if (ev.keyCode === 8) { // Backspace
            if (commandRef.current.length > 0) {
                commandRef.current = commandRef.current.slice(0, -1);
                term.write('\b \b');
            }
        } else if (printable) {
            commandRef.current += key;
            term.write(key);
        }
    });

    // CRITICAL FIX: Only trigger safeFit via ResizeObserver if the element actually has size
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            // Ignore resize events when panel is collapsing/closed (height 0)
            if (entry.contentRect.height > 0 && entry.contentRect.width > 0) {
                // Debounce slightly to avoid thrashing during animation
                window.requestAnimationFrame(() => safeFit());
            }
        }
    });
    
    resizeObserver.observe(terminalRef.current);

    return () => {
        term.dispose();
        resizeObserver.disconnect();
    };
  }, []);

  // Theme Update Effect
  useEffect(() => {
      if (xtermRef.current) {
          xtermRef.current.options.theme = getXtermTheme(currentTheme);
          // Don't call fit here immediately, let resize observer handle layout changes
      }
  }, [currentTheme]);

  // Panel Open/Close Effect
  useEffect(() => {
      if (isPanelOpen) {
          // The panel just opened. We need to wait for the CSS transition to finish
          // and then force a fit and focus.
          
          // 1. Immediate try (might fail if transition just started)
          safeFit();

          // 2. Mid-transition update
          const t1 = setTimeout(safeFit, 150);

          // 3. Post-transition (350ms) - This is the most important one
          const t2 = setTimeout(() => {
              safeFit();
              // Force focus so user can type immediately
              if (xtermRef.current) {
                  xtermRef.current.focus();
                  xtermRef.current.scrollToBottom();
              }
          }, 350);
          
          return () => { clearTimeout(t1); clearTimeout(t2); };
      }
  }, [isPanelOpen]);

  // Handle click on container to focus terminal
  const handleContainerClick = () => {
      if (xtermRef.current) {
          xtermRef.current.focus();
      }
  };

  return (
    <div 
        ref={terminalRef} 
        className="h-full w-full overflow-hidden cursor-text pl-2 pt-1" 
        onClick={handleContainerClick}
    />
  );
};