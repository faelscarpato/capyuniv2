import OpenAI from 'openai';
import type { ChatInput, CodeFixInput, HoverAnalysisInput } from '../../../../shared/types/ai';
import type { AIProviderAdapter } from '../AIProviderAdapter';

interface OpenAICompatibleConfig {
  id: string;
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  codeModel?: string;
}

const readText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text || '') : ''))
      .join('\n');
  }
  return '';
};

export class OpenAICompatibleProviderAdapter implements AIProviderAdapter {
  public readonly id: string;
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly codeModel: string;

  constructor(config: OpenAICompatibleConfig) {
    this.id = config.id;
    this.defaultModel = config.defaultModel;
    this.codeModel = config.codeModel || config.defaultModel;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      dangerouslyAllowBrowser: true
    });
  }

  public async chat(input: ChatInput) {
    const response = await this.client.chat.completions.create({
      model: input.model || this.defaultModel,
      messages: input.messages.map((msg) => ({ role: msg.role, content: msg.content })),
      temperature: input.temperature
    });
    return {
      text: readText(response.choices[0]?.message?.content),
      raw: response
    };
  }

  public async codeFix(input: CodeFixInput): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: input.model || this.codeModel,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'Return only code. Do not include markdown fences. Preserve syntax validity and follow the user instruction.'
        },
        {
          role: 'user',
          content: `File: ${input.fileName}\nInstruction: ${input.instruction}\n\n${input.code}`
        }
      ]
    });

    return readText(response.choices[0]?.message?.content) || input.code;
  }

  public async hoverAnalysis(input: HoverAnalysisInput): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content:
            `Analise este trecho de código (${input.language}) brevemente em Português. ` +
            `Explique função e riscos em no máximo 3 frases.\n${input.snippet}`
        }
      ]
    });
    return readText(response.choices[0]?.message?.content) || 'Sem análise disponível.';
  }
}

