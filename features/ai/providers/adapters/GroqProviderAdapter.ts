import { GROQ_MODELS } from '../../../../lib/groqClient';
import { OpenAICompatibleProviderAdapter } from './OpenAICompatibleProviderAdapter';

export class GroqProviderAdapter extends OpenAICompatibleProviderAdapter {
  constructor(apiKey: string) {
    super({
      id: 'groq',
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      defaultModel: GROQ_MODELS.fast,
      codeModel: GROQ_MODELS.coder
    });
  }
}

