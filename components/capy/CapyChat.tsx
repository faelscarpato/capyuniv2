import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration, Content } from '@google/genai';
import { useChatStore } from '../../stores/chatStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Icon } from '../ui/Icon';
import { marked } from 'marked';
import { FileNode } from '../../types';

export const CapyChat: React.FC = () => {
  const { messages, addMessage, isLoading, setLoading, clearHistory, apiKey, setApiKey } = useChatStore();
  const { activeTabId, files, createFileByPath, deleteFileByPath, getFileByPath } = useWorkspaceStore();
  const { addNotification } = useNotificationStore();
  
  const [input, setInput] = useState('');
  const [tempKey, setTempKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
      description: 'Creates or OVERWRITES a file at the given path with specified content. Use this to write code.',
      properties: {
        path: { type: Type.STRING, description: 'Relative path (e.g., src/App.tsx)' },
        content: { type: Type.STRING, description: 'The FULL content of the file.' },
      },
      required: ['path', 'content'],
    },
  };

  const readFileTool: FunctionDeclaration = {
    name: 'read_file',
    parameters: {
      type: Type.OBJECT,
      description: 'Reads the content of a file.',
      properties: {
        path: { type: Type.STRING, description: 'Relative path.' },
      },
      required: ['path'],
    },
  };

  const listFilesTool: FunctionDeclaration = {
    name: 'list_files',
    parameters: {
      type: Type.OBJECT,
      description: 'Lists all files in the project.',
      properties: {},
    },
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
      const all = Object.values(files);
      const tree: string[] = [];
      const traverse = (id: string, path: string) => {
          const node = files[id];
          if (!node || node.id === 'root' && id !== 'root') return;
          const currentPath = id === 'root' ? '' : (path ? `${path}/${node.name}` : node.name);
          if (id !== 'root') tree.push(`${currentPath}`); // Just path for clearer context
          if (node.type === 'folder') {
              node.childrenIds.forEach(cid => traverse(cid, currentPath));
          }
      };
      traverse('root', '');
      return tree.join('\n');
  };

  // Scan user message for filenames to auto-inject content
  const getRelevantFileContext = (userMsg: string): string => {
      let context = "";
      const allFiles = Object.values(files) as FileNode[];
      
      // 1. Always inject Active Tab content
      if (activeTabId && files[activeTabId] && files[activeTabId].type === 'file') {
          context += `\n[CURRENTLY OPEN FILE]: ${files[activeTabId].name}\n\`\`\`\n${files[activeTabId].content}\n\`\`\`\n`;
      }

      // 2. Scan for other mentioned files
      const mentionedFiles = allFiles.filter(f => 
          f.type === 'file' && 
          f.id !== activeTabId && 
          userMsg.includes(f.name)
      );

      if (mentionedFiles.length > 0) {
          context += `\n[REFERENCED FILES]:\n`;
          mentionedFiles.forEach(f => {
              context += `File: ${f.name}\n\`\`\`\n${f.content}\n\`\`\`\n`;
          });
      }
      return context;
  };

  // --- MAIN HANDLER ---
  const handleSend = async (manualMessage?: string) => {
    const userMsg = typeof manualMessage === 'string' ? manualMessage : input;
    if (!userMsg.trim() || isLoading || !apiKey) return;

    if (!manualMessage) setInput('');
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const model = 'gemini-2.0-flash'; 
        
        // 1. Build Context
        // We do NOT rely on previous chat history for file state, as files change.
        // We construct a fresh "System State" block.
        const fileStructure = getWorkspaceSummary();
        const fileContext = getRelevantFileContext(userMsg);

        const dynamicSystemPrompt = `
        You are Capy, an expert Senior Software Engineer embedded in a Web IDE.

        --- PROTOCOLS ---

        1. **LANGUAGE ADAPTATION (CRITICAL)**: 
           - Detect the language used by the user in the prompt below.
           - If user writes in PORTUGUESE -> Respond in PORTUGUESE.
           - If user writes in ENGLISH -> Respond in ENGLISH.
           - If user writes in SPANISH -> Respond in SPANISH.
           - **NEVER** fail this check. Match the user's language 100%.

        2. **AUTONOMY & TOOLS**:
           - You have FULL ACCESS to the file system.
           - **NEVER** ask the user for file code. I have injected the relevant file contents below.
           - **NEVER** say "I will update the file". JUST CALL THE TOOL \`write_file\`.
           - To edit a file, you must rewrite the ENTIRE file content using \`write_file\`.

        3. **NO CHAT CODE**:
           - Do NOT output code blocks (like \`\`\`js) in your text response.
           - Code belongs ONLY inside the \`write_file\` tool arguments.
           - In the chat, just say "Criando arquivo X..." or "Atualizando estilo...".

        4. **FILE SYSTEM STATE**:
           The current project structure is:
           ${fileStructure}

           ${fileContext ? "RELEVANT FILE CONTENTS (Use these to edit):" + fileContext : ""}
        `;

        // 2. Prepare History
        // We clean history to simple text parts to avoid complex SDK types issues, 
        // but we keep the conversation flow.
        const cleanHistory: Content[] = messages.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'model' as any,
            parts: [{ text: m.content }]
        }));

        // Add current prompt
        cleanHistory.push({ role: 'user', parts: [{ text: userMsg }] });

        let turnCount = 0;
        const MAX_TURNS = 15; 

        // --- AGENT LOOP ---
        while (turnCount < MAX_TURNS) {
            turnCount++;

            const response = await ai.models.generateContent({
                model: model,
                contents: cleanHistory, // We send the full history + new prompt
                config: {
                    systemInstruction: dynamicSystemPrompt, // Dynamic prompt with fresh file state
                    tools: [{ functionDeclarations: [writeFileTool, readFileTool, listFilesTool, deleteFileTool] }],
                    temperature: 0.1, // Zero creativity for tool usage, high precision
                },
            });

            // Parse Response
            let responseText = "";
            if (response.candidates?.[0]?.content?.parts) {
                responseText = response.candidates[0].content.parts
                    .filter(p => 'text' in p && p.text)
                    .map(p => p.text)
                    .join('\n');
            }

            const hasToolCalls = response.functionCalls && response.functionCalls.length > 0;
            const hasCodeBlock = responseText.includes('```');

            // --- GUARDRAIL: CATCH "LAZY" AGENT ---
            // If AI wrote code blocks in chat but didn't call write_file, force retry.
            if (hasCodeBlock && !hasToolCalls) {
                console.warn("GUARDRAIL: Intercepted code in chat.");
                // Inject a fake system error to force the model to correct itself
                cleanHistory.push({ role: 'model', parts: [{ text: responseText }] });
                cleanHistory.push({ 
                    role: 'user', 
                    parts: [{ text: "SYSTEM ERROR: You wrote code in the chat but DID NOT call the 'write_file' tool. I cannot save this code. CALL THE TOOL NOW with the content." }] 
                });
                continue;
            }

            // Display text response to user
            if (responseText.trim()) {
                addMessage({ role: 'model', content: responseText });
            }

            if (hasToolCalls) {
                // Register model's intent in history
                cleanHistory.push({ 
                    role: 'model', 
                    parts: [...(responseText ? [{text: responseText}] : []), ...response.functionCalls!.map(fc => ({ functionCall: fc }))] 
                });

                const functionResponses = [];
                for (const fc of response.functionCalls!) {
                    let toolResult: any = "Success";
                    addNotification('info', `Agent: ${fc.name}...`); // Brief notification
                    
                    try {
                        if (fc.name === 'write_file') {
                            const { path, content } = fc.args as any;
                            const newId = createFileByPath(path, content);
                            toolResult = { status: "success", message: `File ${path} written/updated. ID: ${newId}` };
                        } else if (fc.name === 'read_file') {
                            const { path } = fc.args as any;
                            const file = getFileByPath(path);
                            toolResult = file ? { content: file.content } : { error: "File not found" };
                        } else if (fc.name === 'list_files') {
                            toolResult = { structure: getWorkspaceSummary() };
                        } else if (fc.name === 'delete_file') {
                            const { path } = fc.args as any;
                            deleteFileByPath(path);
                            toolResult = { status: "success" };
                        }
                    } catch (err: any) {
                        toolResult = { error: err.message };
                    }

                    functionResponses.push({
                        functionResponse: {
                            name: fc.name,
                            response: toolResult,
                            id: fc.id
                        }
                    });
                }

                // Feed results back to model
                cleanHistory.push({ role: 'user', parts: functionResponses });
                
                // Continue loop so model can do more actions or confirm completion
                continue; 

            } else {
                // Stop if no more tools called
                break;
            }
        }

    } catch (error: any) {
        console.error("Agent Error:", error);
        addMessage({ role: 'model', content: `Agent Error: ${error.message || 'Unknown error.'}` });
        addNotification('error', 'Agent failed.');
    } finally {
        setLoading(false);
    }
  };

  const handleSaveKey = () => {
      if (tempKey.trim().startsWith('AIza')) {
          setApiKey(tempKey.trim());
          addNotification('success', 'API Key saved!');
      } else {
          addNotification('error', 'Invalid API Key format.');
      }
  };

  // --- RENDER ---
  if (!apiKey) {
      return (
          <div className="flex flex-col h-full bg-ide-sidebar p-6 text-ide-text border-l border-ide-border">
              <div className="flex flex-col items-center text-center mt-10">
                  <div className="w-16 h-16 bg-ide-activity rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/5">
                      <Icon name="Key" size={32} className="text-ide-accent" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Set Up Capy Agent</h2>
                  <p className="text-sm text-ide-muted mb-8 leading-relaxed">
                      To use Agent Mode, you need a Google Gemini API Key.
                  </p>
                  
                  <div className="w-full space-y-4">
                      <div className="relative">
                          <input 
                              type="password"
                              value={tempKey}
                              onChange={(e) => setTempKey(e.target.value)}
                              placeholder="AIza..."
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
                          href="https://aistudio.google.com/app/apikey" 
                          target="_blank" 
                          rel="noreferrer"
                          className="block text-xs text-ide-muted hover:text-ide-accent transition-colors underline"
                      >
                          Get a free API Key
                      </a>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-ide-sidebar text-ide-text text-sm overflow-hidden border-l border-ide-border">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-ide-activity bg-ide-sidebar">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-ide-accent animate-pulse' : 'bg-green-500'}`} />
            <span className="font-bold tracking-tight uppercase text-[11px] opacity-70">Agent Mode</span>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setApiKey('')} className="text-ide-muted hover:text-white transition-colors" title="Change API Key">
                <Icon name="Key" size={14} />
            </button>
            <button onClick={clearHistory} className="text-ide-muted hover:text-white transition-colors" title="Reset Agent Context">
                <Icon name="RefreshCcw" size={14} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
        {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 shadow-sm ${
                    msg.role === 'user' 
                        ? 'bg-ide-accent/20 border border-ide-accent/30 text-white' 
                        : 'bg-ide-activity/50 border border-white/5 text-gray-300'
                }`}>
                    <div 
                        className="prose prose-invert prose-xs max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} 
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
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