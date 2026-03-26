import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { GoogleGenAI, Type, FunctionDeclaration, Content } from '@google/genai';
import type { AIProvider } from '../../lib/aiProvider';
import { GROQ_MODELS } from '../../lib/groqClient';
import { LLM7_MODELS } from '../../lib/llm7Client';
import { useChatStore } from '../../stores/chatStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { triggerChatSkill, type ChatContext } from '../../lib/extensions';
import { emitTerminalSendCommand } from '../../lib/terminalBridge';
import { Icon } from '../ui/Icon';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FileNode } from '../../types';

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

const OPENAI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'write_file',
      description:
        'Creates or OVERWRITES a file at the given path with specified content. Use this to write code.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path (e.g., src/App.tsx)' },
          content: { type: 'string', description: 'The FULL content of the file.' }
        },
        required: ['path', 'content'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Reads the content of a file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path.' }
        },
        required: ['path'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'Lists all files in the project.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Deletes a file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' }
        },
        required: ['path'],
        additionalProperties: false
      }
    }
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
  } = useChatStore();
  const { activeTabId, files, createFileByPath, deleteFileByPath, getFileByPath } = useWorkspaceStore();
  const { addNotification } = useNotificationStore();

  const [input, setInput] = useState('');
  const [tempKey, setTempKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const providerInfo =
    PROVIDER_OPTIONS.find((provider) => provider.id === preferredProvider) || PROVIDER_OPTIONS;

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

  // --- TOOLS DEFINITION ---
  const writeFileTool: FunctionDeclaration = {
    name: 'write_file',
    parameters: {
      type: Type.OBJECT,
      description:
        'Creates or OVERWRITES a file at the given path with specified content. Use this to write code.',
      properties: {
        path: { type: Type.STRING, description: 'Relative path (e.g., src/App.tsx)' },
        content: { type: Type.STRING, description: 'The FULL content of the file.' }
      },
      required: ['path', 'content']
    }
  };

  const readFileTool: FunctionDeclaration = {
    name: 'read_file',
    parameters: {
      type: Type.OBJECT,
      description: 'Reads the content of a file.',
      properties: {
        path: { type: Type.STRING, description: 'Relative path.' }
      },
      required: ['path']
    }
  };

  const listFilesTool: FunctionDeclaration = {
    name: 'list_files',
    parameters: {
      type: Type.OBJECT,
      description: 'Lists all files in the project.',
      properties: {}
    }
  };

  const deleteFileTool: FunctionDeclaration = {
    name: 'delete_file',
    parameters: {
      type: Type.OBJECT,
      description: 'Deletes a file.',
      properties: { path: { type: Type.STRING } },
      required: ['path']
    }
  };

  // --- HELPERS ---
  const getWorkspaceSummary = () => {
    const tree: string[] = [];

    const traverse = (id: string, path: string) => {
      const node = files[id];
      if (!node || (node.id === 'root' && id !== 'root')) return;
      const currentPath = id === 'root' ? '' : path ? `${path}/${node.name}` : node.name;

      if (id !== 'root') tree.push(currentPath);
      if (node.type === 'folder') {
        node.childrenIds.forEach((childId) => traverse(childId, currentPath));
      }
    };

    traverse('root', '');
    return tree.join('\n');
  };

  const getRelevantFileContext = (userMsg: string): string => {
    let context = '';
    const allFiles = Object.values(files) as FileNode[];

    if (activeTabId && files[activeTabId] && files[activeTabId].type === 'file') {
      context += `\n[CURRENTLY OPEN FILE]: ${files[activeTabId].name}\n\`\`\`\n${files[activeTabId].content}\n\`\`\`\n`;
    }

    const mentionedFiles = allFiles.filter(
      (file) => file.type === 'file' && file.id !== activeTabId && userMsg.includes(file.name)
    );

    if (mentionedFiles.length > 0) {
      context += `\n[REFERENCED FILES]:\n`;
      mentionedFiles.forEach((file) => {
        context += `File: ${file.name}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      });
    }

    return context;
  };

  const buildDynamicSystemPrompt = (userMsg: string): string => {
    const fileStructure = getWorkspaceSummary();
    const fileContext = getRelevantFileContext(userMsg);

    const prompt = `
You are Capy, an expert Senior Software Engineer embedded in a Web IDE.

--- PROTOCOLS ---

1. LANGUAGE ADAPTATION (CRITICAL): 
   - Detect the language used by the user in the prompt below.
   - If user writes in PORTUGUESE -> Respond in PORTUGUESE.
   - If user writes in ENGLISH -> Respond in ENGLISH.
   - If user writes in SPANISH -> Respond in SPANISH.
   - NEVER fail this check. Match the user's language 100%.

2. AUTONOMY & TOOLS:
   - You have FULL ACCESS to the file system.
   - NEVER ask the user for file code. I have injected the relevant file contents below.
   - NEVER say "I will update the file". JUST CALL THE TOOL \`write_file\`.
   - To edit a file, you must rewrite the ENTIRE file content using \`write_file\`.

3. NO CHAT CODE:
   - Do NOT output code blocks (like \`\`\`js) in your text response.
   - Code belongs ONLY inside the tool arguments.
   - In the chat, just say "Criando arquivo X..." or "Atualizando estilo...".

4. FILE SYSTEM STATE:
   The current project structure is:
   ${fileStructure}

   ${fileContext ? `RELEVANT FILE CONTENTS (Use these to edit):${fileContext}` : ''}
`;

    // Limitar tamanho do system prompt para evitar estourar TPM
    const MAX_SYSTEM_CHARS = 3000;
    return prompt.length > MAX_SYSTEM_CHARS ? prompt.slice(0, MAX_SYSTEM_CHARS) : prompt;
  };

  const extractString = (args: Record<string, unknown>, key: string): string => {
    const value = args[key];
    return typeof value === 'string' ? value : '';
  };

  const executeWorkspaceTool = (toolName: string, rawArgs: unknown): Record<string, unknown> => {
    const args = typeof rawArgs === 'object' && rawArgs !== null ? (rawArgs as Record<string, unknown>) : {};

    try {
      if (toolName === 'write_file') {
        const path = extractString(args, 'path');
        const content = extractString(args, 'content');
        if (!path) return { error: 'Missing path argument.' };
        const newId = createFileByPath(path, content);
        return { status: 'success', message: `File ${path} written/updated. ID: ${newId}` };
      }

      if (toolName === 'read_file') {
        const path = extractString(args, 'path');
        if (!path) return { error: 'Missing path argument.' };
        const file = getFileByPath(path);
        return file ? { content: file.content || '' } : { error: 'File not found.' };
      }

      if (toolName === 'list_files') {
        return { structure: getWorkspaceSummary() };
      }

      if (toolName === 'delete_file') {
        const path = extractString(args, 'path');
        if (!path) return { error: 'Missing path argument.' };
        deleteFileByPath(path);
        return { status: 'success' };
      }

      return { error: `Unknown tool: ${toolName}` };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Tool execution failed.';
      return { error: message };
    }
  };

  const runGeminiAgent = async (
    userMsg: string,
    providerKey: string,
    dynamicSystemPrompt: string
  ): Promise<void> => {
    const ai = new GoogleGenAI({ apiKey: providerKey });
    const model = 'gemini-2.5-flash';
    const cleanHistory: Content[] = messages.slice(-10).map((message) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }]
    }));

    cleanHistory.push({ role: 'user', parts: [{ text: userMsg }] });

    let turnCount = 0;
    const MAX_TURNS = 15;

    while (turnCount < MAX_TURNS) {
      turnCount++;

      const response = await ai.models.generateContent({
        model,
        contents: cleanHistory,
        config: {
          systemInstruction: dynamicSystemPrompt,
          tools: [{ functionDeclarations: [writeFileTool, readFileTool, listFilesTool, deleteFileTool] }],
          temperature: 0.1
        }
      });

      let responseText = '';
       if (response.candidates?.[0]?.content?.parts) {  // ✅ CORRETO
        responseText = response.candidates.content.parts
          .filter((part) => 'text' in part && part.text)
          .map((part) => part.text || '')
          .join('\n');
      }

      const hasToolCalls = response.functionCalls && response.functionCalls.length > 0;
      const hasCodeBlock = responseText.includes('```');

      if (hasCodeBlock && !hasToolCalls) {
        console.warn('GUARDRAIL: Intercepted code in chat.');
        cleanHistory.push({ role: 'model', parts: [{ text: responseText }] });
        cleanHistory.push({
          role: 'user',
          parts: [
            {
              text: "SYSTEM ERROR: You wrote code in the chat but DID NOT call the 'write_file' tool. I cannot save this code. CALL THE TOOL NOW with the content."
            }
          ]
        });
        continue;
      }

      if (responseText.trim()) {
        addMessage({ role: 'model', content: responseText });
      }

      if (hasToolCalls) {
        cleanHistory.push({
          role: 'model',
          parts: [
            ...(responseText ? [{ text: responseText }] : []),
            ...response.functionCalls!.map((functionCall) => ({ functionCall }))
          ]
        });

        const functionResponses: Array<{
          functionResponse: {
            name: string;
            response: Record<string, unknown>;
            id?: string;
          };
        }> = [];

        for (const functionCall of response.functionCalls!) {
          addNotification('info', `Agent (${providerInfo.label}): ${functionCall.name}...`);
          const toolResult = executeWorkspaceTool(functionCall.name, functionCall.args);

          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: toolResult,
              id: functionCall.id
            }
          });
        }

        cleanHistory.push({ role: 'user', parts: functionResponses });
        continue;
      }

      break;
    }
  };

  const runOpenAIAgent = async (
    provider: Exclude<AIProvider, 'gemini'>,
    userMsg: string,
    providerKey: string,
    dynamicSystemPrompt: string
  ): Promise<void> => {
    const baseURL = provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.llm7.io/v1';
    // Para Groq, use um modelo mais leve (fast) para reduzir tokens
    const model = provider === 'groq' ? GROQ_MODELS.fast : LLM7_MODELS.smart;

    const client = new OpenAI({
      apiKey: providerKey,
      baseURL,
      dangerouslyAllowBrowser: true
    });

    const MAX_HISTORY_MESSAGES = 3;
    const MAX_MESSAGE_CHARS = 1000;

    const history: ChatCompletionMessageParam[] = messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content.slice(0, MAX_MESSAGE_CHARS)
    }));

    const trimmedUserMsg = userMsg.slice(0, MAX_MESSAGE_CHARS);

    const loopMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: dynamicSystemPrompt },
      ...history,
      { role: 'user', content: trimmedUserMsg }
    ];

    let turnCount = 0;
    const MAX_TURNS = 8;

    while (turnCount < MAX_TURNS) {
      turnCount++;

      const completion = await client.chat.completions.create({
        model,
        messages: loopMessages,
        tools: OPENAI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.1
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) break;

      const responseText =
        typeof assistantMessage.content === 'string'
          ? assistantMessage.content
          : Array.isArray(assistantMessage.content)
            ? assistantMessage.content
                .map((part) => (part.type === 'text' ? part.text : ''))
                .join('\n')
            : '';

      if (responseText.trim()) {
        addMessage({ role: 'model', content: responseText });
      }

      loopMessages.push(assistantMessage as ChatCompletionMessageParam);

      const toolCalls = assistantMessage.tool_calls || [];
      if (!toolCalls.length) {
        break;
      }

      for (const toolCall of toolCalls) {
        addNotification('info', `Agent (${providerInfo.label}): ${toolCall.function.name}...`);

        let parsedArgs: unknown = {};
        try {
          parsedArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
        } catch (error: unknown) {
          console.error('Tool argument parse error', error);
        }

        const toolResult = executeWorkspaceTool(toolCall.function.name, parsedArgs);

        loopMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }
    }
  };

  // --- MAIN HANDLER ---
  const handleSend = async (manualMessage?: string) => {
    const userMsg = typeof manualMessage === 'string' ? manualMessage : input;
    if (!userMsg.trim() || isLoading || !activeApiKey) return;

    if (!manualMessage) setInput('');
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);

    try {
      const skillContext: ChatContext = {
        runTerminalCommand: (command: string) => emitTerminalSendCommand(`${command}\r`),
        getActiveFilePath: () => {
          if (!activeTabId) return null;
          return useWorkspaceStore.getState().getPathForId(activeTabId) || null;
        }
      };

      const skill = triggerChatSkill(userMsg, skillContext);
      if (skill) {
        addNotification('info', `Skill ativada: ${skill.name}`);
        const skillResponse = await skill.onTrigger(userMsg, skillContext);

        if (skillResponse) {
          addMessage({ role: 'model', content: skillResponse });
        } else {
          addMessage({ role: 'model', content: `Skill ${skill.name} executada.` });
        }
        return;
      }

      const dynamicSystemPrompt = buildDynamicSystemPrompt(userMsg);

      if (preferredProvider === 'gemini') {
        await runGeminiAgent(userMsg, activeApiKey, dynamicSystemPrompt);
      } else {
        await runOpenAIAgent(preferredProvider, userMsg, activeApiKey, dynamicSystemPrompt);
      }
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

  // --- RENDER ---
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
      {/* Header */}
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

      {/* Messages */}
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

      {/* Input */}
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