import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import type { FileNode, FileSystem } from '../../../types';
import type { AIProvider } from '../../../lib/aiProvider';
import { GROQ_MODELS } from '../../../lib/groqClient';
import { LLM7_MODELS } from '../../../lib/llm7Client';
import { collectWorkspaceContext } from '../context/WorkspaceContextCollector';
import { buildAgentSystemPrompt } from '../prompts/promptBuilders';
import { executeWorkspaceToolCall, type WorkspaceToolApi } from '../tools/ToolCallExecutor';

const OPENAI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Creates or overwrites a file at the given path.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path (e.g. src/App.tsx)' },
          content: { type: 'string', description: 'Full file content.' }
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

const buildGeminiToolDeclarations = (Type: any): any[] => [
  {
    name: 'write_file',
    parameters: {
      type: Type.OBJECT,
      description: 'Creates or overwrites a file at the given path.',
      properties: {
        path: { type: Type.STRING, description: 'Relative path (e.g. src/App.tsx)' },
        content: { type: Type.STRING, description: 'Full file content.' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'read_file',
    parameters: {
      type: Type.OBJECT,
      description: 'Reads file content.',
      properties: {
        path: { type: Type.STRING, description: 'Relative path.' }
      },
      required: ['path']
    }
  },
  {
    name: 'list_files',
    parameters: {
      type: Type.OBJECT,
      description: 'Lists all files in the project.',
      properties: {}
    }
  },
  {
    name: 'delete_file',
    parameters: {
      type: Type.OBJECT,
      description: 'Deletes a file.',
      properties: {
        path: { type: Type.STRING }
      },
      required: ['path']
    }
  }
];

interface ChatHistoryMessage {
  role: 'user' | 'model';
  content: string;
}

interface WorkspaceAgentPort {
  files: FileSystem;
  activeTabId: string | null;
  createFileByPath: (path: string, content: string) => string;
  deleteFileByPath: (path: string) => void;
  getFileByPath: (path: string) => FileNode | undefined;
}

interface RunChatAgentParams {
  provider: AIProvider;
  apiKey: string;
  history: ChatHistoryMessage[];
  userMessage: string;
  workspace: WorkspaceAgentPort;
  onAssistantMessage: (content: string) => void;
  onToolActivity?: (toolName: string) => void;
}

const buildSystemPrompt = (workspace: WorkspaceAgentPort, userMessage: string): string => {
  const context = collectWorkspaceContext({
    files: workspace.files,
    activeTabId: workspace.activeTabId,
    userMessage
  });

  return [
    buildAgentSystemPrompt(context),
    '',
    'Operational protocol:',
    '- Use tool calls for filesystem edits.',
    '- Match the user language in responses.',
    '- Keep responses concise and product-focused.'
  ].join('\n');
};

const createWorkspaceToolApi = (workspace: WorkspaceAgentPort, userMessage: string): WorkspaceToolApi => ({
  writeFile: (path, content) => {
    workspace.createFileByPath(path, content);
  },
  readFile: (path) => {
    const file = workspace.getFileByPath(path);
    return file ? file.content || '' : null;
  },
  listFiles: () => {
    return collectWorkspaceContext({
      files: workspace.files,
      activeTabId: workspace.activeTabId,
      userMessage
    }).structure;
  },
  deleteFile: (path) => {
    workspace.deleteFileByPath(path);
  }
});

const runGeminiAgent = async (
  params: RunChatAgentParams,
  systemPrompt: string,
  workspaceToolApi: WorkspaceToolApi
): Promise<void> => {
  const { GoogleGenAI, Type } = await import('@google/genai');
  const geminiToolDeclarations = buildGeminiToolDeclarations(Type);
  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  const cleanHistory: any[] = params.history.slice(-10).map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.content }]
  }));
  cleanHistory.push({ role: 'user', parts: [{ text: params.userMessage }] });

  const MAX_TURNS = 12;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanHistory,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: geminiToolDeclarations }],
        temperature: 0.1
      }
    });

    const responseParts = response.candidates?.[0]?.content?.parts || [];
    const responseText = responseParts
      .filter((part): part is { text: string } => 'text' in part && typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n')
      .trim();

    if (responseText) {
      params.onAssistantMessage(responseText);
    }

    const functionCalls = (response as any).functionCalls as Array<{
      id?: string;
      name: string;
      args?: Record<string, unknown>;
    }> | undefined;

    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    cleanHistory.push({
      role: 'model',
      parts: [
        ...(responseText ? [{ text: responseText }] : []),
        ...functionCalls.map((functionCall) => ({ functionCall }))
      ]
    });

    const functionResponses = functionCalls.map((functionCall) => {
      params.onToolActivity?.(functionCall.name);
      const toolResult = executeWorkspaceToolCall(
        {
          id: functionCall.id,
          name: functionCall.name,
          args: functionCall.args || {}
        },
        workspaceToolApi
      );
      return {
        functionResponse: {
          name: functionCall.name,
          id: functionCall.id,
          response: toolResult
        }
      };
    });

    cleanHistory.push({ role: 'user', parts: functionResponses as any });
  }
};

const runOpenAIAgent = async (
  params: RunChatAgentParams,
  systemPrompt: string,
  workspaceToolApi: WorkspaceToolApi
): Promise<void> => {
  const OpenAI = (await import('openai')).default;
  const providerModel = params.provider === 'groq' ? GROQ_MODELS.fast : LLM7_MODELS.smart;
  const baseURL = params.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.llm7.io/v1';

  const client = new OpenAI({
    apiKey: params.apiKey,
    baseURL,
    dangerouslyAllowBrowser: true
  });

  const history: ChatCompletionMessageParam[] = params.history.slice(-4).map((message) => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: message.content.slice(0, 1200)
  }));

  const loopMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: params.userMessage.slice(0, 1200) }
  ];

  const MAX_TURNS = 8;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const completion = await client.chat.completions.create({
      model: providerModel,
      messages: loopMessages,
      tools: OPENAI_TOOLS,
      tool_choice: 'auto',
      temperature: 0.1
    });

    const assistantMessage = completion.choices[0]?.message;
    if (!assistantMessage) break;

    const responseText = typeof assistantMessage.content === 'string' ? assistantMessage.content.trim() : '';
    if (responseText) {
      params.onAssistantMessage(responseText);
    }

    loopMessages.push(assistantMessage as ChatCompletionMessageParam);
    const toolCalls = assistantMessage.tool_calls || [];
    if (!toolCalls.length) break;

    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') continue;
      params.onToolActivity?.(toolCall.function.name);

      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
      } catch {
        parsedArgs = {};
      }

      const toolResult = executeWorkspaceToolCall(
        {
          id: toolCall.id,
          name: toolCall.function.name,
          args: parsedArgs
        },
        workspaceToolApi
      );

      loopMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult)
      });
    }
  }
};

export const runChatAgent = async (params: RunChatAgentParams): Promise<void> => {
  const systemPrompt = buildSystemPrompt(params.workspace, params.userMessage);
  const workspaceToolApi = createWorkspaceToolApi(params.workspace, params.userMessage);

  if (params.provider === 'gemini') {
    await runGeminiAgent(params, systemPrompt, workspaceToolApi);
    return;
  }

  await runOpenAIAgent(params, systemPrompt, workspaceToolApi);
};
