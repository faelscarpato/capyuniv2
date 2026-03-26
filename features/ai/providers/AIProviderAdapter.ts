import type { ChatInput, ChatOutput, CodeFixInput, HoverAnalysisInput } from '../../../shared/types/ai';

export interface AIProviderAdapter {
  readonly id: string;
  chat: (input: ChatInput) => Promise<ChatOutput>;
  codeFix: (input: CodeFixInput) => Promise<string>;
  hoverAnalysis: (input: HoverAnalysisInput) => Promise<string>;
}

