 import { llm7Websearch } from './llm7Client';

   export const websearch = async (params: {
     llm7ApiKey: string;
     prompt: string;
   }): Promise<{ text: string; chunks: { title: string; url: string; snippet: string }[] }> => {
     const { llm7ApiKey, prompt } = params;

     if (!llm7ApiKey) {
       throw new Error('Configure sua API Key do LLM7 para usar Websearch.');
     }

     return llm7Websearch(llm7ApiKey, prompt);
   };