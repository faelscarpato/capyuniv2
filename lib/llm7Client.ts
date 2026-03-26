import OpenAI from 'openai';

interface LLM7GenerateTextParams {
  apiKey: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

interface LLM7FixCodeParams {
  apiKey: string;
  model?: string;
  code: string;
  instruction: string;
  fileName: string;
}

export interface GroundingLikeResult {
  text: string;
  chunks: { title: string; url: string; snippet: string }[];
}

export const LLM7_MODELS = {
  fast: 'deepseek-r1',
  smart: 'qwen2.5-coder-32b-instruct',
  coder: 'qwen2.5-coder-32b-instruct'
} as const;

const createLLM7Client = (apiKey: string): OpenAI => {
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.llm7.io/v1',
    dangerouslyAllowBrowser: true
  });
};

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

export const llm7GenerateText = async ({
  apiKey,
  model = LLM7_MODELS.fast,
  prompt,
  systemInstruction
}: LLM7GenerateTextParams): Promise<string> => {
  const client = createLLM7Client(apiKey);

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await client.chat.completions.create({
      model,
      messages
    });

    return readCompletionText(response.choices[0]?.message?.content);
  } catch (error: unknown) {
    console.error('LLM7 Generate Text Error', error);
    throw error;
  }
};

export const llm7CodeFix = async ({
  apiKey,
  model = LLM7_MODELS.coder,
  code,
  instruction,
  fileName
}: LLM7FixCodeParams): Promise<string> => {
  const client = createLLM7Client(apiKey);
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

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: code }
      ],
      temperature: 0.2
    });

    let result = readCompletionText(response.choices[0]?.message?.content) || code;

    if (result.startsWith('```')) {
      result = stripMarkdownCodeFence(result);
    }

    return result;
  } catch (error: unknown) {
    console.error('LLM7 Code Fix Error', error);
    throw error;
  }
};

export const llm7AnalyzeHover = async (apiKey: string, codeSnippet: string, language: string): Promise<string> => {
  if (!apiKey) return 'Configure sua API Key para ver a análise.';

  const client = createLLM7Client(apiKey);
  const prompt = `Analise este trecho de código (${language}) brevemente em Português.
    Explique a função e aponte bugs ou riscos de segurança se houver.
    Seja conciso (máximo 3 frases).
    Código:
    ${codeSnippet}`;

  try {
    const response = await client.chat.completions.create({
      model: LLM7_MODELS.fast,
      messages: [{ role: 'user', content: prompt }]
    });

    return readCompletionText(response.choices[0]?.message?.content) || 'Sem análise disponível.';
  } catch (error: unknown) {
    console.error('LLM7 Hover Analysis Error', error);
    return 'Erro na análise IA.';
  }
};

export const llm7Websearch = async (apiKey: string, query: string): Promise<GroundingLikeResult> => {
  const client = createLLM7Client(apiKey);
  const systemPrompt = `
Você é um assistente de pesquisa web.
- Pesquise informações atuais e confiáveis sobre o tema pedido.
- Monte uma resposta em Português do Brasil, clara e direta.
- Sempre liste as principais fontes em bullet points no final, no formato: [Título](URL).
- Não invente links.
`;

  try {
    const response = await client.chat.completions.create({
      model: LLM7_MODELS.fast,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ]
    });

    const text = readCompletionText(response.choices[0]?.message?.content);

    return {
      text,
      chunks: []
    };
  } catch (error: unknown) {
    console.error('LLM7 Websearch Error', error);
    throw error;
  }
};
