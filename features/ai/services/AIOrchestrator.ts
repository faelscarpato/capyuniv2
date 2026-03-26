import { GeminiProviderAdapter } from '../providers/adapters/GeminiProviderAdapter';
import { GroqProviderAdapter } from '../providers/adapters/GroqProviderAdapter';
import { LLM7ProviderAdapter } from '../providers/adapters/LLM7ProviderAdapter';
import { LocalProviderStub } from '../providers/adapters/LocalProviderStub';
import type { AIProviderAdapter } from '../providers/AIProviderAdapter';
import type { CodeFixInput } from '../../../shared/types/ai';

export type LegacyProvider = 'gemini' | 'groq' | 'llm7';

export interface ProviderApiKeys {
  geminiApiKey: string;
  groqApiKey: string;
  llm7ApiKey: string;
}

const selectProvider = (provider: LegacyProvider, apiKeys: ProviderApiKeys): AIProviderAdapter => {
  if (provider === 'gemini') return new GeminiProviderAdapter(apiKeys.geminiApiKey);
  if (provider === 'groq') return new GroqProviderAdapter(apiKeys.groqApiKey);
  if (provider === 'llm7') return new LLM7ProviderAdapter(apiKeys.llm7ApiKey);
  return new LocalProviderStub();
};

export const aiOrchestrator = {
  generateText: async (provider: LegacyProvider, apiKeys: ProviderApiKeys, params: {
    model?: string;
    prompt: string;
    systemInstruction?: string;
  }): Promise<string> => {
    const adapter = selectProvider(provider, apiKeys);
    const output = await adapter.chat({
      model: params.model,
      messages: [
        ...(params.systemInstruction ? [{ role: 'system' as const, content: params.systemInstruction }] : []),
        { role: 'user', content: params.prompt }
      ]
    });
    return output.text;
  },

  generateCodeFix: async (provider: LegacyProvider, apiKeys: ProviderApiKeys, params: CodeFixInput): Promise<string> => {
    const adapter = selectProvider(provider, apiKeys);
    return adapter.codeFix(params);
  },

  analyzeHover: async (
    provider: LegacyProvider,
    apiKeys: ProviderApiKeys,
    snippet: string,
    language: string
  ): Promise<string> => {
    const adapter = selectProvider(provider, apiKeys);
    return adapter.hoverAnalysis({ snippet, language });
  }
};

