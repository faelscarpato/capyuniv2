import { GoogleGenAI, Type } from '@google/genai';

interface GenerateTextParams {
  apiKey: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

interface GroundingParams {
  apiKey: string;
  prompt: string;
  type: 'search' | 'maps';
}

interface FixCodeParams {
    apiKey: string;
    code: string;
    instruction: string;
    fileName: string;
}

interface GenerateImageParams {
    apiKey: string;
    prompt: string;
    model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
    aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

// 1. Basic Text Generation (Legacy, kept for backward compat if needed)
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

// 2. Grounding (Search & Maps)
export const generateGroundingContent = async ({ apiKey, prompt, type }: GroundingParams) => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Per instructions: Search uses gemini-3-flash-preview, Maps uses gemini-2.5-flash
    const modelName = type === 'search' ? 'gemini-3-flash-preview' : 'gemini-2.5-flash';
    
    const tools = [];
    if (type === 'search') {
        tools.push({ googleSearch: {} });
    } else {
        tools.push({ googleMaps: {} });
    }

    const systemInstruction = "Você é um assistente útil. Responda SEMPRE em Português do Brasil. Para buscas, forneça um resumo claro. Para mapas, forneça detalhes do local.";

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                tools,
                systemInstruction
            }
        });

        // Extract grounding metadata
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const text = response.text || "Nenhum resultado encontrado.";

        return { text, chunks };
    } catch (error: any) {
        console.error("Grounding Error", error);
        throw new Error(error.message || "Falha ao buscar dados.");
    }
};

// 3. Inline Code Fix / Suggestion
export const generateCodeFix = async ({ apiKey, code, instruction, fileName }: FixCodeParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Use a smart model for coding
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
        throw error;
    }
};

// 4. Lightweight Hover Analysis
export const analyzeCodeHover = async (apiKey: string, codeSnippet: string, language: string): Promise<string> => {
    if (!apiKey) return "Configure sua API Key para ver a análise.";
    
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.0-flash-lite-preview-02-05'; // Fast model

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
        return "Erro na análise IA.";
    }
};

// 5. Image Generation (Nano Banana)
export const generateNanoImage = async ({ apiKey, prompt, model, aspectRatio }: GenerateImageParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    // imageSize: "1K" // Optional, default is 1K
                }
            }
        });

        // Iterate through candidates to find image part
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) throw new Error("No content generated.");

        for (const part of parts) {
            if (part.inlineData) {
                const base64String = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${base64String}`;
            }
        }
        
        throw new Error("No image data found in response.");

    } catch (error: any) {
        console.error("Image Gen Error", error);
        throw new Error(error.message || "Failed to generate image.");
    }
};