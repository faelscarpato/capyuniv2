import { analyzeCodeHover, generateCodeFix, generateText } from '../../../../lib/geminiClient';
import type { ChatInput, CodeFixInput, HoverAnalysisInput } from '../../../../shared/types/ai';
import type { AIProviderAdapter } from '../AIProviderAdapter';

export class GeminiProviderAdapter implements AIProviderAdapter {
  public readonly id = 'gemini';

  constructor(private readonly apiKey: string) {}

  public async chat(input: ChatInput) {
    const userPrompt = input.messages.map((msg) => `[${msg.role}] ${msg.content}`).join('\n');
    const text = await generateText({
      apiKey: this.apiKey,
      model: input.model,
      prompt: userPrompt
    });
    return { text };
  }

  public async codeFix(input: CodeFixInput): Promise<string> {
    return generateCodeFix({
      apiKey: this.apiKey,
      code: input.code,
      instruction: input.instruction,
      fileName: input.fileName
    });
  }

  public async hoverAnalysis(input: HoverAnalysisInput): Promise<string> {
    return analyzeCodeHover(this.apiKey, input.snippet, input.language);
  }
}
