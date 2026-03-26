import React, { useMemo, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { websearch } from '../../lib/websearch';
import { Icon } from '../ui/Icon';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const GroundingView: React.FC = () => {
  const { llm7ApiKey } = useChatStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; chunks: Array<{ title: string; url: string; snippet: string }> } | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
      if (!llm7ApiKey) {
          setError("Por favor, configure sua API Key do LLM7 para usar Web Search.");
          return;
      }
      if (!query.trim()) return;

      setLoading(true);
      setError('');
      setResult(null);

      try {
          const data = await websearch({
              llm7ApiKey,
              prompt: query
          });
          setResult(data);
      } catch (err: any) {
          setError(err.message || "A busca falhou.");
      } finally {
          setLoading(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
  };

  const sanitizedHtml = useMemo(() => {
      if (!result) return '';
      const rawHtml = marked.parse(result.text) as string;
      return DOMPurify.sanitize(rawHtml);
  }, [result]);

  return (
    <div className="flex flex-col h-full bg-ide-sidebar text-ide-text">
        <div className="px-4 py-3 border-b border-ide-border flex justify-between items-center bg-ide-activity">
            <div className="flex items-center gap-2">
                <span className="font-medium text-white">Web Search</span>
            </div>
            <Icon name="Search" size={16} className="text-ide-accent" />
        </div>

        <div className="p-4 bg-ide-sidebar border-b border-ide-border">
            <div className="relative group">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pesquisar na web..."
                    className="w-full bg-ide-input text-white text-sm px-4 py-2.5 rounded-lg border border-ide-border focus:outline-none focus:border-ide-accent/60 transition-all"
                />
                <button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-3 top-2 text-ide-accent disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-ide-accent border-t-transparent rounded-full animate-spin" /> : <Icon name="Search" size={18} />}
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
            {error && (
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded text-red-200 text-sm mb-4 mt-4">
                    {error}
                </div>
            )}

            {!result && !loading && !error && (
                <div className="flex flex-col items-center justify-center h-40 text-ide-muted text-xs">
                    <Icon name="Globe2" size={32} className="mb-2 opacity-50" />
                    <p>Faça uma pesquisa para ver os resultados</p>
                </div>
            )}

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 mt-4">
                     <div className="bg-ide-activity p-4 rounded-lg border border-ide-border">
                        <div className="flex items-center gap-2 mb-2">
                             <Icon name="Sparkles" size={14} className="text-ide-accent" />
                             <span className="text-xs font-bold text-white uppercase tracking-wide">Resumo</span>
                        </div>
                        <div 
                           className="prose prose-invert prose-sm text-ide-text max-w-none leading-relaxed"
                           dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                        />
                     </div>

                     {result.chunks.length > 0 && (
                        <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-ide-muted">Fontes</div>
                            {result.chunks.map((chunk, i) => (
                                <a
                                    key={`${chunk.url}-${i}`}
                                    href={chunk.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block bg-ide-activity border border-ide-border rounded-lg p-3 hover:border-ide-accent/50 transition-colors"
                                >
                                    <div className="text-sm font-semibold text-blue-300 truncate">{chunk.title}</div>
                                    <div className="text-[11px] text-ide-muted truncate">{chunk.url}</div>
                                    {chunk.snippet && <div className="text-xs text-ide-text mt-2 line-clamp-2">{chunk.snippet}</div>}
                                </a>
                            ))}
                        </div>
                     )}
                </div>
            )}
        </div>
    </div>
  );
};
