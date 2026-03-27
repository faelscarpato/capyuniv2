import React, { useState, useEffect } from 'react';
import type { AIProvider } from '../../lib/aiProvider';
import { useUIStore } from '../../stores/uiStore';
import { useAIStore } from '../../features/ai/store/aiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Icon } from '../ui/Icon';

const providerLinks: Record<AIProvider, string> = {
  gemini: 'https://aistudio.google.com/app/apikey',
  groq: 'https://console.groq.com/keys',
  llm7: 'https://llm7.io'
};

const providerLabels: Record<AIProvider, string> = {
  gemini: 'Gemini',
  groq: 'Groq',
  llm7: 'LLM7.io'
};

const providerPlaceholders: Record<AIProvider, string> = {
  gemini: 'Cole sua chave AIza...',
  groq: 'Cole sua chave gsk_...',
  llm7: 'Cole sua chave LLM7...'
};

const getProviderApiKey = (
  provider: AIProvider,
  keys: { geminiApiKey: string; groqApiKey: string; llm7ApiKey: string }
): string => {
  if (provider === 'gemini') return keys.geminiApiKey;
  if (provider === 'groq') return keys.groqApiKey;
  return keys.llm7ApiKey;
};

export const ApiKeyModal: React.FC = () => {
  const { isApiKeyModalOpen, setApiKeyModalOpen } = useUIStore();
  const {
    geminiApiKey,
    groqApiKey,
    llm7ApiKey,
    preferredProvider,
    setPreferredProvider,
    setProviderApiKey
  } = useAIStore();
  const { addNotification } = useNotificationStore();
  const [keyInput, setKeyInput] = useState('');

  const currentProviderKey = getProviderApiKey(preferredProvider, {
    geminiApiKey,
    groqApiKey,
    llm7ApiKey
  });

  useEffect(() => {
    if (isApiKeyModalOpen) {
      setKeyInput(currentProviderKey || '');
    }
  }, [isApiKeyModalOpen, currentProviderKey, preferredProvider]);

  const handleSave = () => {
    const cleanKey = keyInput.trim();

    if (!cleanKey) {
      setProviderApiKey(preferredProvider, '');
      addNotification('info', `API Key (${providerLabels[preferredProvider]}) removida.`);
      setApiKeyModalOpen(false);
      return;
    }

    if (preferredProvider === 'gemini' && !cleanKey.startsWith('AIza')) {
      addNotification('warning', 'Formato de chave Gemini parece inválido (esperado: AIza...).');
    }

    setProviderApiKey(preferredProvider, cleanKey);
    addNotification('success', `API Key (${providerLabels[preferredProvider]}) salva!`);
    setApiKeyModalOpen(false);
  };

  if (!isApiKeyModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setApiKeyModalOpen(false)}
    >
      <div
        className="w-full max-w-[500px] bg-ide-activity border border-ide-border shadow-2xl rounded-lg p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={() => setApiKeyModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <Icon name="X" size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-ide-bg rounded-full flex items-center justify-center mb-4 border border-ide-accent/30">
            <Icon name="Key" size={28} className="text-ide-accent" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Configuração Global de IA</h2>
          <p className="text-sm text-gray-400">Escolha o provedor e salve sua chave para o Chat IA.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Provedor</label>
            <select
              value={preferredProvider}
              onChange={(event) => setPreferredProvider(event.target.value as AIProvider)}
              className="w-full bg-ide-input border border-ide-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ide-accent text-white"
            >
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
              <option value="llm7">LLM7.io</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              API Key ({providerLabels[preferredProvider]})
            </label>
            <div className="relative">
              <input
                type="password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder={providerPlaceholders[preferredProvider]}
                className="w-full bg-ide-input border border-ide-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ide-accent text-white"
              />
              <Icon name="Lock" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="bg-ide-bg p-3 rounded border border-white/5 text-xs text-gray-400">
            <p>
              Sua chave é armazenada <strong>apenas no navegador</strong> (LocalStorage) e enviada direto para o
              provedor escolhido.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setApiKeyModalOpen(false)}
              className="flex-1 px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-gray-300 rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-ide-accent hover:bg-opacity-90 text-white font-bold rounded-lg transition-colors shadow-lg shadow-ide-accent/20 text-sm flex items-center justify-center gap-2"
            >
              <Icon name="Check" size={16} /> Salvar Chave
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href={providerLinks[preferredProvider]}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-ide-secondary hover:underline flex items-center justify-center gap-1"
          >
            Obter chave ({providerLabels[preferredProvider]}) <Icon name="ExternalLink" size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};
