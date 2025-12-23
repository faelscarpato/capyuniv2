import React, { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { generateGroundingContent } from '../../lib/geminiClient';
import { Icon } from '../ui/Icon';
import { marked } from 'marked';

export const GroundingView: React.FC = () => {
  const { apiKey } = useChatStore();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'maps'>('search');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string, chunks: any[] } | null>(null);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = async () => {
      if (!apiKey) {
          setError("Por favor, configure sua API Key na aba de Chat (IA) primeiro.");
          return;
      }
      if (!query.trim()) return;

      setLoading(true);
      setError('');
      setResult(null);
      setLastQuery(query);

      try {
          const data = await generateGroundingContent({
              apiKey,
              prompt: query,
              type: mode
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

  return (
    <div className="flex flex-col h-full bg-[#202124] text-[#bdc1c6] font-sans">
        {/* Header Style mimicking Google Dark Mode */}
        <div className="px-4 py-3 border-b border-[#3c4043] flex justify-between items-center bg-[#303134]">
            <div className="flex items-center gap-2">
                <span className="font-medium text-white">Google {mode === 'search' ? 'Search' : 'Maps'}</span>
            </div>
            {mode === 'search' ? <Icon name="Search" size={16} className="text-[#8ab4f8]" /> : <Icon name="MapPin" size={16} className="text-[#81c995]" />}
        </div>

        {/* Search Bar Area */}
        <div className="p-4 bg-[#202124]">
            {/* Toggle Pills */}
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setMode('search')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${mode === 'search' ? 'bg-[#303134] text-[#8ab4f8] border-[#3c4043]' : 'bg-transparent text-[#9aa0a6] border-transparent hover:bg-[#303134]'}`}
                >
                    Todas
                </button>
                <button 
                    onClick={() => setMode('maps')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${mode === 'maps' ? 'bg-[#303134] text-[#81c995] border-[#3c4043]' : 'bg-transparent text-[#9aa0a6] border-transparent hover:bg-[#303134]'}`}
                >
                    Maps
                </button>
            </div>

            <div className="relative group">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === 'search' ? "Pesquisar no Google..." : "Buscar local..."}
                    className="w-full bg-[#303134] text-white text-sm px-4 py-2.5 rounded-full border border-transparent group-hover:border-[#5f6368] group-focus-within:bg-[#303134] group-focus-within:border-transparent group-focus-within:shadow-md focus:outline-none placeholder-gray-500 shadow-sm transition-all"
                />
                <button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-3 top-2 text-[#8ab4f8] disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin" /> : <Icon name="Search" size={18} />}
                </button>
            </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
            {error && (
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded text-red-200 text-sm mb-4">
                    {error}
                </div>
            )}

            {!result && !loading && !error && (
                <div className="flex flex-col items-center justify-center h-40 text-[#9aa0a6] text-xs">
                    <Icon name="Globe2" size={32} className="mb-2 opacity-50" />
                    <p>Faça uma pesquisa para ver os resultados</p>
                </div>
            )}

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                     
                     {/* MAPS EMBED - Only shows in Maps mode or if query implies location */}
                     {mode === 'maps' && lastQuery && (
                         <div className="w-full h-48 rounded-xl overflow-hidden shadow-lg border border-[#3c4043] mb-4">
                             <iframe 
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                style={{ border: 0 }}
                                loading="lazy" 
                                allowFullScreen
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(lastQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                             ></iframe>
                         </div>
                     )}

                     {/* AI Summary "Featured Snippet" style */}
                     <div className="bg-[#303134] p-4 rounded-xl border border-[#3c4043]">
                        <div className="flex items-center gap-2 mb-2">
                             <Icon name="Sparkles" size={14} className="text-[#f28b82]" />
                             <span className="text-xs font-bold text-[#e8eaed] uppercase tracking-wide">Visão Geral da IA</span>
                        </div>
                        <div 
                           className="prose prose-invert prose-sm text-[#bdc1c6] max-w-none leading-relaxed"
                           dangerouslySetInnerHTML={{ __html: marked.parse(result.text) as string }}
                        />
                     </div>

                     {/* Search Results / Chunks */}
                     {result.chunks.length > 0 && (
                        <div className="space-y-6">
                            {result.chunks.map((chunk, i) => {
                                // Google Search Result Card Style
                                if (chunk.web?.uri && chunk.web?.title) {
                                     return (
                                        <div key={i} className="flex flex-col gap-1 group">
                                            <div className="flex items-center gap-2 text-xs text-[#dadce0] mb-0.5">
                                                <div className="w-6 h-6 rounded-full bg-[#303134] flex items-center justify-center border border-[#3c4043]">
                                                    <Icon name="Globe" size={12} className="opacity-70"/>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-[200px]">{new URL(chunk.web.uri).hostname}</span>
                                                    <span className="text-[10px] text-[#9aa0a6] truncate max-w-[250px]">{chunk.web.uri}</span>
                                                </div>
                                            </div>
                                            <a 
                                                href={chunk.web.uri} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-[#8ab4f8] text-lg hover:underline decoration-[#8ab4f8] truncate"
                                            >
                                                {chunk.web.title}
                                            </a>
                                            {/* We don't get snippets from chunk sometimes, but if we did, it would go here */}
                                            <div className="text-sm text-[#bdc1c6] line-clamp-2">
                                                {/* Fallback description if available or just empty */}
                                                Click para acessar a fonte original.
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                     )}
                </div>
            )}
        </div>
    </div>
  );
};