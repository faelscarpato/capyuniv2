import React, { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { generateNanoImage } from '../../lib/geminiClient';
import { Icon } from '../ui/Icon';
import { t } from '../../lib/i18n';

export const NanoBananaView: React.FC = () => {
    const { apiKey } = useChatStore();
    const { language } = useUIStore();
    
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
    const [model, setModel] = useState<'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'>('gemini-2.5-flash-image');
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!apiKey) {
            setError('API Key is missing. Check AI Chat.');
            return;
        }
        if (!prompt.trim()) return;

        setLoading(true);
        setError('');
        setImageUrl(null);

        try {
            const base64Image = await generateNanoImage({
                apiKey,
                prompt,
                model,
                aspectRatio
            });
            setImageUrl(base64Image);
        } catch (err: any) {
            setError(err.message || 'Generation failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `nano-banana-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-ide-sidebar text-ide-text">
            {/* Header */}
            <div className="px-4 py-3 border-b border-ide-activity flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon name="Banana" size={18} className="text-yellow-400" />
                    <span className="font-bold text-sm tracking-wide">{t('nanoBanana', language)}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                
                {/* Prompt Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-ide-muted">{t('promptPlaceholder', language).split(' ')[0]}</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('promptPlaceholder', language)}
                        className="w-full bg-ide-input border border-ide-border rounded p-3 text-sm focus:outline-none focus:border-ide-accent resize-none h-24"
                    />
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-ide-muted">{t('model', language)}</label>
                        <select 
                            value={model} 
                            onChange={(e) => setModel(e.target.value as any)}
                            className="w-full bg-ide-input border border-ide-border rounded p-2 text-xs focus:outline-none"
                        >
                            <option value="gemini-2.5-flash-image">Flash Image (Fast)</option>
                            <option value="gemini-3-pro-image-preview">Pro Image (High Q)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-ide-muted">{t('aspectRatio', language)}</label>
                        <select 
                            value={aspectRatio} 
                            onChange={(e) => setAspectRatio(e.target.value as any)}
                            className="w-full bg-ide-input border border-ide-border rounded p-2 text-xs focus:outline-none"
                        >
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="4:3">4:3</option>
                            <option value="3:4">3:4</option>
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <button 
                    onClick={handleGenerate} 
                    disabled={loading || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-2.5 rounded shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            {t('generating', language)}
                        </>
                    ) : (
                        <>
                            <Icon name="Sparkles" size={16} />
                            {t('generateImage', language)}
                        </>
                    )}
                </button>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded">
                        {error}
                    </div>
                )}

                {/* Result */}
                {imageUrl && (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="relative group rounded-lg overflow-hidden border border-ide-border shadow-2xl">
                            <img src={imageUrl} alt="Generated" className="w-full h-auto" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={handleDownload}
                                    className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Icon name="Download" size={16} />
                                    {t('download', language)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};