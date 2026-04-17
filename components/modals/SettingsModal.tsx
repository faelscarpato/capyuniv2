import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useAIStore } from '../../features/ai/store/aiStore';
import { useRuntimeModeStore } from '../../features/local-runtime/store/runtimeModeStore';
import { useSupabaseAuth } from '../../hooks/useAuth';
import { Icon } from '../ui/Icon';

type TabId = 'account' | 'agents' | 'providers' | 'runtime' | 'appearance' | 'about';

const PROVIDER_LINKS = {
  gemini: 'https://aistudio.google.com/app/apikey',
  groq: 'https://console.groq.com/keys',
  openai: 'https://platform.openai.com/api-keys',
  llama: 'https://en.wikipedia.org/wiki/Llama_(language_model)',
  local: 'Use local model or ollama'
};

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen, language, setTheme, currentTheme } = useUIStore();
  const { setApiKey, setProviderApiKey, preferredProvider, apiKey, geminiApiKey, groqApiKey, llm7ApiKey } = useAIStore();
  const { mode, setMode } = useRuntimeModeStore();
  const { user, signOut } = useSupabaseAuth();
  
  const [activeTab, setActiveTab] = useState<TabId>('account');
  
  const tt = (pt: string, en: string) => (language === 'pt' ? pt : en);

  const [geminiKey, setGeminiKey] = useState(geminiApiKey);
  const [groqKey, setGroqKey] = useState(groqApiKey);
  const [llm7Key, setLlm7Key] = useState(llm7ApiKey);
  const [customProvider, setCustomProvider] = useState({ url: '', key: '' });

  const saveProviderKey = (provider: string, key: string) => {
    setProviderApiKey(provider as any, key);
  };

  if (!isSettingsOpen) return null;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'account', label: tt('Conta', 'Account'), icon: 'User' },
    { id: 'agents', label: tt('Agentes IA', 'AI Agents'), icon: 'Bot' },
    { id: 'providers', label: tt('Provedores', 'Providers'), icon: 'Network' },
    { id: 'runtime', label: tt('Runtime', 'Runtime'), icon: 'Cpu' },
    { id: 'appearance', label: tt('Aparência', 'Appearance'), icon: 'Palette' },
    { id: 'about', label: tt('Sobre', 'About'), icon: 'Info' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4"
      onClick={() => setSettingsOpen(false)}
    >
      <div 
        className="w-full max-w-3xl h-[85vh] bg-ide-activity border border-ide-border shadow-2xl rounded-lg flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ide-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="Settings" className="text-ide-secondary" />
            {tt('Configurações', 'Settings')}
          </h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="text-gray-400 hover:text-white p-1"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs - Desktop */}
          <div className="hidden md:flex flex-col w-48 border-r border-ide-border bg-ide-panel/50 p-2 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-ide-accent/20 text-ide-accent' 
                    : 'text-gray-400 hover:text-white hover:bg-ide-hover'
                }`}
              >
                <Icon name={tab.icon as any} size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4">
            
            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icon name="User" size={18} />
                    {tt('Conta', 'Account')}
                  </h3>
                  
                  {user ? (
                    <div className="bg-ide-bg p-4 rounded border border-ide-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">ID: {user.id}</p>
                        </div>
                        <button
                          onClick={signOut}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-sm"
                        >
                          {tt('Sair', 'Sign Out')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-ide-bg p-4 rounded border border-ide-border text-center">
                      <p className="text-gray-400 mb-3">
                        {tt('Entre com sua conta para sincronizar workspaces', 'Sign in to sync workspaces')}
                      </p>
                      <button
                        onClick={() => useUIStore.getState().setAuthOpen(true)}
                        className="px-4 py-2 bg-ide-accent hover:bg-ide-accent/80 text-white rounded"
                      >
                        {tt('Entrar / Criar Conta', 'Sign In / Sign Up')}
                      </button>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icon name="History" size={18} />
                    {tt('Snapshots', 'Snapshots')}
                  </h3>
                  <div className="bg-ide-bg p-4 rounded border border-ide-border">
                    <p className="text-sm text-gray-400 mb-3">
                      {tt('Gerencie snapshots do workspace', 'Manage workspace snapshots')}
                    </p>
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        useUIStore.getState().setSnapshotsOpen(true);
                      }}
                      className="px-3 py-1.5 bg-ide-accent/20 hover:bg-ide-accent/40 text-ide-accent rounded text-sm"
                    >
                      {tt('Abrir Snapshots', 'Open Snapshots')}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* AGENTS TAB */}
            {activeTab === 'agents' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icon name="Bot" size={18} />
                    {tt('Agentes IA', 'AI Agents')}
                  </h3>
                  
                  <div className="bg-ide-bg p-4 rounded border border-ide-border mb-4">
                    <h4 className="text-white font-medium mb-2">{tt('Como obter chave da API?', 'How to get API key?')}</h4>
                    <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                      <li>{tt('Acesse o link do provedor abaixo', 'Access the provider link below')}</li>
                      <li>{tt('Crie uma conta ou faça login', 'Create account or sign in')}</li>
                      <li>{tt('Gere uma nova chave de API', 'Generate new API key')}</li>
                      <li>{tt('Copie e cole no campo correspondente', 'Copy and paste in the corresponding field')}</li>
                    </ol>
                  </div>

                  {/* Gemini */}
                  <div className="border border-ide-border rounded mb-3 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Gemini (Google)</span>
                      <a href={PROVIDER_LINKS.gemini} target="_blank" rel="noopener" className="text-xs text-ide-secondary hover:text-white">
                        {tt('Obter chave', 'Get key')} →
                      </a>
                    </div>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full bg-ide-input border border-ide-border rounded px-3 py-1.5 text-sm text-white mb-2"
                    />
                    <button
                      onClick={() => saveProviderKey('gemini', geminiKey)}
                      className="w-full px-3 py-1.5 bg-ide-accent/20 hover:bg-ide-accent/40 text-ide-accent rounded text-sm"
                    >
                      {tt('Salvar', 'Save')}
                    </button>
                  </div>

                  {/* Groq */}
                  <div className="border border-ide-border rounded mb-3 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Groq</span>
                      <a href={PROVIDER_LINKS.groq} target="_blank" rel="noopener" className="text-xs text-ide-secondary hover:text-white">
                        {tt('Obter chave', 'Get key')} →
                      </a>
                    </div>
                    <input
                      type="password"
                      value={groqKey}
                      onChange={e => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full bg-ide-input border border-ide-border rounded px-3 py-1.5 text-sm text-white mb-2"
                    />
                    <button
                      onClick={() => saveProviderKey('groq', groqKey)}
                      className="w-full px-3 py-1.5 bg-ide-accent/20 hover:bg-ide-accent/40 text-ide-accent rounded text-sm"
                    >
                      {tt('Salvar', 'Save')}
                    </button>
                  </div>

                  {/* LLM7 (Custom) */}
                  <div className="border border-ide-border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">LLM7 / Custom</span>
                    </div>
                    <input
                      type="password"
                      value={llm7Key}
                      onChange={e => setLlm7Key(e.target.value)}
                      placeholder="API Key..."
                      className="w-full bg-ide-input border border-ide-border rounded px-3 py-1.5 text-sm text-white mb-2"
                    />
                    <button
                      onClick={() => saveProviderKey('llm7', llm7Key)}
                      className="w-full px-3 py-1.5 bg-ide-accent/20 hover:bg-ide-accent/40 text-ide-accent rounded text-sm"
                    >
                      {tt('Salvar', 'Save')}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* PROVIDERS TAB */}
            {activeTab === 'providers' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icon name="Network" size={18} />
                    {tt('Provedores Customizados', 'Custom Providers')}
                  </h3>
                  
                  <div className="bg-ide-bg p-4 rounded border border-ide-border">
                    <p className="text-sm text-gray-400 mb-4">
                      {tt('Conecte seu próprio provedor de API compatível com OpenAI', 'Connect your own OpenAI-compatible API provider')}
                    </p>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={customProvider.url}
                        onChange={e => setCustomProvider({ ...customProvider, url: e.target.value })}
                        placeholder="https://api.seuprovedor.com/v1"
                        className="w-full bg-ide-input border border-ide-border rounded px-3 py-2 text-sm text-white"
                      />
                      <input
                        type="password"
                        value={customProvider.key}
                        onChange={e => setCustomProvider({ ...customProvider, key: e.target.value })}
                        placeholder="API Key"
                        className="w-full bg-ide-input border border-ide-border rounded px-3 py-2 text-sm text-white"
                      />
                      <button
                        disabled={!customProvider.url || !customProvider.key}
                        className="w-full px-3 py-2 bg-ide-accent/20 hover:bg-ide-accent/40 disabled:opacity-50 text-ide-accent rounded text-sm"
                      >
                        {tt('Conectar Provedor', 'Connect Provider')}
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-3">{tt('Provedores Disponíveis', 'Available Providers')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['OpenAI', 'Anthropic', 'Mistral', 'Cohere', 'Local', 'Ollama'].map(p => (
                      <div key={p} className="bg-ide-bg px-3 py-2 rounded text-sm text-gray-400 border border-ide-border">
                        {p}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* RUNTIME TAB */}
            {activeTab === 'runtime' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icon name="Cpu" size={18} />
                    {tt('Modo de Runtime', 'Runtime Mode')}
                  </h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setMode('online')}
                      className={`w-full p-4 rounded border text-left ${
                        mode === 'online' 
                          ? 'border-ide-accent bg-ide-accent/10' 
                          : 'border-ide-border hover:border-ide-accent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="Globe" size={20} className={mode === 'online' ? 'text-ide-accent' : 'text-gray-400'} />
                        <div>
                          <p className="text-white font-medium">{tt('Online (Padrão)', 'Online (Default)')}</p>
                          <p className="text-xs text-gray-500">{tt('Web Preview in-browser', 'In-browser Web Preview')}</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setMode('local-runtime')}
                      className={`w-full p-4 rounded border text-left ${
                        mode === 'local-runtime' 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-ide-border hover:border-green-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="Terminal" size={20} className={mode === 'local-runtime' ? 'text-green-400' : 'text-gray-400'} />
                        <div>
                          <p className="text-white font-medium">{tt('Local Runtime', 'Local Runtime')}</p>
                          <p className="text-xs text-gray-500">{tt('Executa npm run dev (requer ptyServer)', 'Runs npm run dev (requires ptyServer)')}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Icon name="Palette" size={18} />
                    {tt('Tema', 'Theme')}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {['capy-dark', 'midnight', 'nebula', 'sunset'].map(theme => (
                      <button
                        key={theme}
                        onClick={() => setTheme(theme)}
                        className={`p-3 rounded border text-left capitalize ${
                          currentTheme === theme 
                            ? 'border-ide-accent bg-ide-accent/10' 
                            : 'border-ide-border hover:border-ide-accent'
                        }`}
                      >
                        <span className="text-white text-sm">{theme}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-3">{tt('Idioma', 'Language')}</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-ide-accent/20 text-ide-accent rounded text-sm">
                      Português
                    </button>
                    <button className="px-3 py-1.5 bg-ide-bg border border-ide-border text-gray-400 rounded text-sm hover:text-white">
                      English
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <section className="text-center py-6">
                  <h3 className="text-2xl font-bold text-white mb-2">CapyUNI Codium</h3>
                  <p className="text-gray-400">{tt('Web IDE local-first com IA integrada', 'Local-first web IDE with AI')}</p>
                  <p className="text-xs text-gray-500 mt-2">v0.0.0</p>
                </section>

                <section className="bg-ide-bg p-4 rounded border border-ide-border">
                  <h4 className="text-white font-medium mb-2">{tt('Recursos Implementados', 'Implemented Features')}</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>✅ Snapshots locais</li>
                    <li>✅ Web Preview in-browser</li>
                    <li>✅ Run Project</li>
                    <li>✅ Chat IA por workspace</li>
                    <li>✅ Supabase Auth</li>
                    <li>✅ Quick Templates</li>
                    <li>✅ Telemetry</li>
                  </ul>
                </section>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-ide-border bg-ide-panel text-center text-xs text-gray-500 rounded-b-lg">
          {tt('Pressione Escape para fechar', 'Press Escape to close')}
        </div>
      </div>
    </div>
  );
};