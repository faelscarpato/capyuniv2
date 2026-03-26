import { aiOrchestrator, type ProviderApiKeys } from '../features/ai/services/AIOrchestrator';

export type AIProvider = 'gemini' | 'groq' | 'llm7';

export type AIApiKeys = ProviderApiKeys;

interface GenerateTextParams {
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

export interface GenerateCodeFixParams {
  model?: string;
  code: string;
  instruction: string;
  fileName: string;
}

interface GenerateCodeFixRequest {
  provider: AIProvider;
  apiKeys: AIApiKeys;
  params: GenerateCodeFixParams;
}

export const generateText = async (
  provider: AIProvider,
  apiKeys: AIApiKeys,
  params: GenerateTextParams
): Promise<string> => {
  return aiOrchestrator.generateText(provider, apiKeys, params);
};

export const generateCodeFix = async (...args: [GenerateCodeFixRequest] | [AIProvider, AIApiKeys, GenerateCodeFixParams]): Promise<string> => {
  if (args.length === 1) {
    const request = args[0];
    return aiOrchestrator.generateCodeFix(request.provider, request.apiKeys, request.params);
  }

  const [provider, apiKeys, params] = args;
  return aiOrchestrator.generateCodeFix(provider, apiKeys, params);
};

export const analyzeHover = async (
  provider: AIProvider,
  apiKeys: AIApiKeys,
  snippet: string,
  lang: string
): Promise<string> => {
  return aiOrchestrator.analyzeHover(provider, apiKeys, snippet, lang);
};
