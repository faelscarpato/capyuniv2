import { LLM7_MODELS } from '../../../../lib/llm7Client';
import { OpenAICompatibleProviderAdapter } from './OpenAICompatibleProviderAdapter';

export class LLM7ProviderAdapter extends OpenAICompatibleProviderAdapter {
  constructor(apiKey: string) {
    super({
      id: 'llm7',
      apiKey,
      baseURL: (import.meta as any).env?.VITE_LLM7_BASE_URL || 'https://api.llm7.io/v1',
      defaultModel: LLM7_MODELS.fast,
      codeModel: LLM7_MODELS.coder
    });
  }
}

