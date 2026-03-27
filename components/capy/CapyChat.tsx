import React, { useEffect, useRef, useState } from 'react';
import type { AIProvider } from '../../lib/aiProvider';
import { useAIStore } from '../../features/ai/store/aiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { triggerChatSkill, type ChatContext } from '../../lib/extensions';
import { emitTerminalSendCommand } from '../../lib/terminalBridge';
import { useTerminalStore } from '../../core/terminal/store/terminalStore';
import { Icon } from '../ui/Icon';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { runChatAgent } from '../../features/ai/services/chatAgentService';

const PROVIDER_OPTIONS: Array<{
  id: AIProvider;
  label: string;
  apiLink: string;
  keyPlaceholder: string;
}> = [
  {
    id: 'gemini',
    label: 'Gemini',
    apiLink: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIza...'
  },
  {
    id: 'groq',
    label: 'Groq',
    apiLink: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...'
  },
  {
    id: 'llm7',
    label: 'LLM7.io',
    apiLink: 'https://llm7.io',
    keyPlaceholder: 'Cole sua chave LLM7...'
  }
];

const getProviderApiKey = (
  provider: AIProvider,
  keys: { geminiApiKey: string; groqApiKey: string; llm7ApiKey: string }
): string => {
  if (provider === 'gemini') return keys.geminiApiKey;
  if (provider === 'groq') return keys.groqApiKey;
  return keys.llm7ApiKey;
};

export const CapyChat: React.FC = () => {
  const {
    messages,
    addMessage,
    isLoading,
    setLoading,
    clearHistory,
    geminiApiKey,
    groqApiKey,
    llm7ApiKey,
    preferredProvider,
    setProviderApiKey,
    setPreferredProvider
  } = useAIStore();
  const { activeTabId, files, createFileByPath, deleteFileByPath, getFileByPath } = useWorkspaceStore();
  const { addNotification } = useNotificationStore();

  const [input, setInput] = useState('');
  const [tempKey, setTempKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const providerInfo =
    PROVIDER_OPTIONS.find((provider) => provider.id === preferredProvider) || PROVIDER_OPTIONS[0];

  const activeApiKey = getProviderApiKey(preferredProvider, {
    geminiApiKey,
    groqApiKey,
    llm7ApiKey
  });

  useEffect(() => {
    setTempKey(activeApiKey || '');
  }, [activeApiKey, preferredProvider]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (manualMessage?: string) => {
    const userMsg = typeof manualMessage === 'string' ? manualMessage : input;
    if (!userMsg.trim() || isLoading || !activeApiKey) return;

    if (!manualMessage) setInput('');
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);

    try {
      const skillContext: ChatContext = {
        runTerminalCommand: (command: string) => {
          const terminalState = useTerminalStore.getState();
          const terminalId = terminalState.activeSessionId || terminalState.ensureSession();
          emitTerminalSendCommand({ terminalId, command: `${command}\r` });
        },
        getActiveFilePath: () => {
          if (!activeTabId) return null;
          return useWorkspaceStore.getState().getPathForId(activeTabId) || null;
        }
      };

      const skill = triggerChatSkill(userMsg, skillContext);
      if (skill) {
        addNotification('info', `Skill ativada: ${skill.name}`);
        const skillResponse = await skill.onTrigger(userMsg, skillContext);
        addMessage({ role: 'model', content: skillResponse || `Skill ${skill.name} executada.` });
        return;
      }

      await runChatAgent({
        provider: preferredProvider,
        apiKey: activeApiKey,
        userMessage: userMsg,
        history: messages.map((message) => ({
          role: message.role === 'user' ? 'user' : 'model',
          content: message.content
        })),
        workspace: {
          files,
          activeTabId,
          createFileByPath,
          deleteFileByPath,
          getFileByPath
        },
        onAssistantMessage: (content) => {
          addMessage({ role: 'model', content });
        },
        onToolActivity: (toolName) => {
          addNotification('info', `Agent (${providerInfo.label}): ${toolName}...`);
        }
      });
    } catch (error: unknown) {
      console.error('Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
      addMessage({ role: 'model', content: `Agent Error: ${errorMessage}` });
      addNotification('error', 'Agent failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    const cleanKey = tempKey.trim();

    if (!cleanKey) {
      setProviderApiKey(preferredProvider, '');
      addNotification('info', `API Key (${providerInfo.label}) removida.`);
      return;
    }

    if (preferredProvider === 'gemini' && !cleanKey.startsWith('AIza')) {
      addNotification('warning', 'Formato de chave parece inválido para Gemini (esperado: AIza...).');
    }

    setProviderApiKey(preferredProvider, cleanKey);
    addNotification('success', `API Key (${providerInfo.label}) salva!`);
  };

  if (!activeApiKey) {
    return (
      <div className="flex flex-col h-full bg-ide-sidebar p-6 text-ide-text border-l border-ide-border">
        <div className="flex flex-col items-center text-center mt-10">
          <div className="w-16 h-16 bg-ide-activity rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/5">
            <Icon name="Key" size={32} className="text-ide-accent" />
          </div>
          <h2 className="text-xl font-bold mb-2">Set Up Capy Agent</h2>
          <p className="text-sm text-ide-muted mb-8 leading-relaxed">
            Selecione o provedor e configure a API key para usar o chat.
          </p>

          <div className="w-full space-y-4">
            <div className="text-left">
              <label className="block text-xs text-ide-muted mb-2 uppercase tracking-wide">Provider</label>
              <select
                value={preferredProvider}
                onChange={(event) => setPreferredProvider(event.target.value as AIProvider)}
                className="w-full bg-ide-input border border-ide-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ide-accent transition-colors"
              >
                <option value="gemini">Gemini</option>
                <option value="groq">Groq</option>
                <option value="llm7">LLM7.io</option>
              </select>
            </div>

            <div className="relative">
              <input
                type="password"
                value={tempKey}
                onChange={(event) => setTempKey(event.target.value)}
                placeholder={providerInfo.keyPlaceholder}
                className="w-full bg-ide-input border border-ide-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ide-accent transition-colors pr-10"
              />
              <Icon name="Lock" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" />
            </div>

            <button
              onClick={handleSaveKey}
              className="w-full bg-ide-accent hover:bg-opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-ide-accent/20 flex items-center justify-center gap-2"
            >
              <Icon name="Check" size={18} />
              Save API Key
            </button>
            <a
              href={providerInfo.apiLink}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-ide-muted hover:text-ide-accent transition-colors underline"
            >
              Obter API Key ({providerInfo.label})
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-ide-sidebar text-ide-text text-sm overflow-hidden border-l border-ide-border">
      <div className="flex-shrink-0 px-4 py-3 border-b border-ide-activity bg-ide-sidebar space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-ide-accent animate-pulse' : 'bg-green-500'}`} />
            <span className="font-bold tracking-tight uppercase text-[11px] opacity-70">Agent Mode</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setProviderApiKey(preferredProvider, '');
                setTempKey('');
                addNotification('info', `API Key (${providerInfo.label}) removida.`);
              }}
              className="text-ide-muted hover:text-white transition-colors"
              title="Remove Current API Key"
            >
              <Icon name="Key" size={14} />
            </button>
            <button
              onClick={clearHistory}
              className="text-ide-muted hover:text-white transition-colors"
              title="Reset Agent Context"
            >
              <Icon name="RefreshCcw" size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-ide-muted">Provider</span>
          <select
            value={preferredProvider}
            onChange={(event) => setPreferredProvider(event.target.value as AIProvider)}
            className="bg-ide-input border border-ide-border rounded px-2 py-1 text-xs focus:outline-none focus:border-ide-accent"
          >
            <option value="gemini">Gemini</option>
            <option value="groq">Groq</option>
            <option value="llm7">LLM7.io</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl p-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-ide-accent/20 border border-ide-accent/30 text-white'
                  : 'bg-ide-activity/50 border border-white/5 text-gray-300'
              }`}
            >
              <div
                className="prose prose-invert prose-xs max-w-none break-words"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(message.content) as string)
                }}
              />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-ide-activity/30 rounded-full px-4 py-2 text-[11px] text-ide-muted flex items-center gap-2 border border-white/5">
              <div className="w-1 h-1 bg-ide-accent rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-ide-accent rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-ide-accent rounded-full animate-bounce [animation-delay:0.4s]" />
              Capy is building...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-ide-sidebar border-t border-ide-activity">
        <div className="relative group bg-ide-input rounded-xl border border-white/10 p-2 transition-all focus-within:border-ide-accent/50 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.1)]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            className="w-full bg-transparent text-white text-sm resize-none focus:outline-none px-2 py-1 h-12 max-h-32 placeholder-ide-muted"
            placeholder="Peça para criar ou editar algo..."
          />
          <div className="flex justify-between items-center mt-2 px-1">
            <div className="text-[10px] text-ide-muted">Shift+Enter para pular linha</div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-ide-accent hover:bg-opacity-80 rounded-lg text-white disabled:opacity-30 transition-all"
            >
              <Icon name="ArrowUp" size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
