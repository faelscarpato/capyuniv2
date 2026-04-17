import { GoogleGenAI } from '@google/genai';
import { getUserFriendlyError } from '../features/ai/services/aiErrorHandler';

interface GenerateTextParams {
  apiKey: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

interface FixCodeParams {
    apiKey: string;
    code: string;
    instruction: string;
    fileName: string;
}

// 1. Basic Text Generation (Updated to 2.5 Flash)
export const generateText = async ({ apiKey, model = 'gemini-2.0-flash', prompt, systemInstruction }: GenerateTextParams): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
          systemInstruction,
      }
  });
  return response.text || '';
};

// 2. Inline Code Fix / Suggestion
export const generateCodeFix = async ({ apiKey, code, instruction, fileName }: FixCodeParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Use gemini-2.5-flash for coding (efficient & free tier eligible)
    const model = 'gemini-2.0-flash';

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
        const response = await ai.models.generateContent({
            model,
            contents: code,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.2
            }
        });
        
        let result = response.text || code;
        
        // Strip markdown if the model disregarded instructions
        if (result.startsWith('```')) {
            result = result.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
        }

        return result;
    } catch (error: any) {
        console.error("Code Fix Error", error);
        const friendlyError = getUserFriendlyError(error);
        throw new Error(friendlyError);
    }
};

// 3. Lightweight Hover Analysis
export const analyzeCodeHover = async (apiKey: string, codeSnippet: string, language: string): Promise<string> => {
    if (!apiKey) return "Configure sua API Key para ver a análise.";
    
    const ai = new GoogleGenAI({ apiKey });
    // Updated to gemini-2.5-flash for speed and reliability
    const model = 'gemini-2.0-flash'; 

    const prompt = `Analise este trecho de código (${language}) brevemente em Português.
    Explique a função e aponte bugs ou riscos de segurança se houver.
    Seja conciso (máximo 3 frases).
    Código:
    ${codeSnippet}`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text || "Sem análise disponível.";
    } catch (error) {
        return getUserFriendlyError(error);
    }
};

interface GenerateNanoImageParams {
  apiKey: string;
  prompt: string;
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export const generateNanoImage = async (_params: GenerateNanoImageParams): Promise<string> => {
  throw new Error('Image generation is not available in this build yet.');
};
