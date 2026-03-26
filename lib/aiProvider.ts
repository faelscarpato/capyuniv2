import { analyzeCodeHover, generateCodeFix as geminiCodeFix, generateText as geminiGenerateText } from './geminiClient';
import { groqAnalyzeHover, groqCodeFix, groqGenerateText } from './groqClient';
import { llm7AnalyzeHover, llm7CodeFix, llm7GenerateText } from './llm7Client';

export type AIProvider = 'gemini' | 'groq' | 'llm7';

export type AIApiKeys = {
  geminiApiKey: string;
  groqApiKey: string;
  llm7ApiKey: string;
};

interface GenerateTextParams {
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

interface GenerateCodeFixParams {
  model?: string;
  code: string;
  instruction: string;
  fileName: string;
}

export const generateText = async (
  provider: AIProvider,
  apiKeys: AIApiKeys,
  params: GenerateTextParams
): Promise<string> => {
  switch (provider) {
    case 'gemini':
      return geminiGenerateText({ apiKey: apiKeys.geminiApiKey, ...params });
    case 'groq':
      return groqGenerateText({ apiKey: apiKeys.groqApiKey, ...params });
    case 'llm7':
      return llm7GenerateText({ apiKey: apiKeys.llm7ApiKey, ...params });
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

export const generateCodeFix = async (
  provider: AIProvider,
  apiKeys: AIApiKeys,
  params: GenerateCodeFixParams
): Promise<string> => {
  switch (provider) {
    case 'gemini':
      return geminiCodeFix({ apiKey: apiKeys.geminiApiKey, ...params });
    case 'groq':
      return groqCodeFix({ apiKey: apiKeys.groqApiKey, ...params });
    case 'llm7':
      return llm7CodeFix({ apiKey: apiKeys.llm7ApiKey, ...params });
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

export const analyzeHover = async (
  provider: AIProvider,
  apiKeys: AIApiKeys,
  snippet: string,
  lang: string
): Promise<string> => {
  switch (provider) {
    case 'gemini':
      return analyzeCodeHover(apiKeys.geminiApiKey, snippet, lang);
    case 'groq':
      return groqAnalyzeHover(apiKeys.groqApiKey, snippet, lang);
    case 'llm7':
      return llm7AnalyzeHover(apiKeys.llm7ApiKey, snippet, lang);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};
