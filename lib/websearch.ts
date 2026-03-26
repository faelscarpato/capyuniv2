import { llm7Websearch } from './llm7Client';

export type WebsearchResult = {
  text: string;
  chunks: { title: string; url: string; snippet: string }[];
};

export const websearch = async (params: { llm7ApiKey: string; prompt: string }): Promise<WebsearchResult> => {
  const { llm7ApiKey, prompt } = params;

  if (!llm7ApiKey) {
    throw new Error('Configure sua API Key do LLM7 para usar Websearch.');
  }

  return llm7Websearch(llm7ApiKey, prompt);
};
