import OpenAI from 'openai';

interface GroqGenerateTextParams {
  apiKey: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

interface GroqFixCodeParams {
  apiKey: string;
  model?: string;
  code: string;
  instruction: string;
  fileName: string;
}

export const GROQ_MODELS = {
  fast: 'llama-3.1-8b-instant',
  smart: 'llama-3.3-70b-versatile',
  coder: 'llama-3.3-70b-versatile'
} as const;

class GroqClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      dangerouslyAllowBrowser: true
    });
  }

  public async chatCompletion(model: string, messages: any[]) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages
      });
      return response.choices[0]?.message?.content;
    } catch (error: unknown) {
      console.error('Groq Chat Completion Error', error);
      throw error;
    }
  }
}

const readCompletionText = (content: string | null | undefined): string => {
  return content || '';
};

const stripMarkdownCodeFence = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return text;
  }
  return trimmed.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
};

export const groqGenerateText = async ({
  apiKey,
  model = GROQ_MODELS.fast,
  prompt,
  systemInstruction
}: GroqGenerateTextParams): Promise<string> => {
  const client = new GroqClient(apiKey);
  const messages: any[] = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  messages.push({ role: 'user', content: prompt });

  const content = await client.chatCompletion(model, messages);
  return readCompletionText(content);
};

export const groqCodeFix = async ({
  apiKey,
  model = GROQ_MODELS.coder,
  code,
  instruction,
  fileName
}: GroqFixCodeParams): Promise<string> => {
  const client = new GroqClient(apiKey);
  const systemPrompt = `
    You are an expert Coding Assistant embedded in an IDE.
    Your task is to fix, refactor, or complete the code provided by the user.
    
    CONTEXT:
    - File Name: ${fileName}
    - Instruction: ${instruction}

    RULES:
    - Return ONLY the replaced code.
    - Do NOT wrap in markdown code blocks (\`\`\`).
    - Do NOT add conversational text like "Here is the fixed code".
    - If the instruction implies replacing a specific part, return only that part optimized.
    - If the user asks for a comment or explanation, you may add comments in the code, but stay within valid syntax.
  `;

  const response = await client.chatCompletion(model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: code }
  ]);

  let result = readCompletionText(response) || code;

  if (result.startsWith('```')) {
    result = stripMarkdownCodeFence(result);
  }

  return result;
};

export const groqAnalyzeHover = async (apiKey: string, codeSnippet: string, language: string): Promise<string> => {
  if (!apiKey) return 'Configure sua API Key para ver a análise.';

  const client = new GroqClient(apiKey);
  const prompt = `Analise este trecho de código (${language}) brevemente em Português.
    Explique a função e aponte bugs ou riscos de segurança se houver.
    Seja conciso (máximo 3 frases).
    Código:
    ${codeSnippet}`;

  const response = await client.chatCompletion(GROQ_MODELS.fast, [{ role: 'user', content: prompt }]);

  return readCompletionText(response) || 'Sem análise disponível.';
};