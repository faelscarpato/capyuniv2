import type { ChatInput, CodeFixInput, HoverAnalysisInput } from '../../../../shared/types/ai';
import type { AIProviderAdapter } from '../AIProviderAdapter';

export class LocalProviderStub implements AIProviderAdapter {
  public readonly id = 'local';

  public async chat(_input: ChatInput) {
    return {
      text:
        'Local provider ainda nao configurado. TODO: integrar runtime local (Ollama/LM Studio) com endpoint seguro.'
    };
  }

  public async codeFix(input: CodeFixInput): Promise<string> {
    return input.code;
  }

  public async hoverAnalysis(_input: HoverAnalysisInput): Promise<string> {
    return 'Local provider indisponivel no momento.';
  }
}

