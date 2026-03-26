export type AIProviderId = 'gemini' | 'groq' | 'openai-compatible' | 'llm7' | 'local';

export interface ChatInput {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

export interface ChatOutput {
  text: string;
  toolCalls?: ToolCall[];
  raw?: unknown;
}

export interface ToolDefinition {
  name: string;
  description?: string;
  schema: Record<string, unknown>;
}

export interface ToolCall {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

export interface HoverAnalysisInput {
  snippet: string;
  language: string;
}

export interface CodeFixInput {
  code: string;
  instruction: string;
  fileName: string;
  model?: string;
}

