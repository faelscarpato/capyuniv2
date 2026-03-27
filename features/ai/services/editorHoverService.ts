import { analyzeHover } from '../../../lib/aiProvider';
import { useAIStore } from '../store/aiStore';

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown'];

export const registerAIHoverProviders = (monaco: any): (() => void) => {
  const hoverCache = new Map<string, string>();

  const disposables = SUPPORTED_LANGUAGES.map((lang) =>
    monaco.languages.registerHoverProvider(lang, {
      provideHover: async (model: any, position: any) => {
        const chatState = useAIStore.getState();
        const provider = chatState.preferredProvider;
        const apiKeys = {
          geminiApiKey: chatState.geminiApiKey,
          groqApiKey: chatState.groqApiKey,
          llm7ApiKey: chatState.llm7ApiKey
        };

        const hasActiveKey =
          provider === 'gemini'
            ? apiKeys.geminiApiKey
            : provider === 'groq'
              ? apiKeys.groqApiKey
              : apiKeys.llm7ApiKey;
        if (!hasActiveKey) return null;

        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const range = new monaco.Range(
          position.lineNumber,
          Math.max(1, position.column - 50),
          position.lineNumber,
          Math.min(model.getLineMaxColumn(position.lineNumber), position.column + 50)
        );

        const codeContext = model.getValueInRange(range);
        if (codeContext.trim().length < 5) return null;

        const cacheKey = `${lang}:${position.lineNumber}:${codeContext.trim()}`;
        if (hoverCache.has(cacheKey)) {
          return {
            range,
            contents: [{ value: '**🔍 Análise Capy AI**' }, { value: hoverCache.get(cacheKey) || '' }]
          };
        }

        const analysis = await analyzeHover(provider, apiKeys, codeContext, lang);
        hoverCache.set(cacheKey, analysis);
        return {
          range,
          contents: [{ value: '**🔍 Análise Capy AI**' }, { value: analysis }]
        };
      }
    })
  );

  return () => {
    disposables.forEach((disposable: any) => disposable?.dispose?.());
  };
};
