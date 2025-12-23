import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';

export const DocsModal: React.FC = () => {
  const { isDocsOpen, setDocsOpen } = useUIStore();

  if (!isDocsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4" onClick={() => setDocsOpen(false)}>
      <div 
        className="w-full max-w-[800px] h-[85vh] bg-ide-activity border border-ide-border shadow-2xl rounded-lg flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ide-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="Book" className="text-ide-secondary" />
                Documentação CapyUNI
            </h2>
            <button 
                onClick={() => setDocsOpen(false)}
                className="text-gray-400 hover:text-white"
            >
                <Icon name="X" size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-gray-300 space-y-8">
            
            <section>
                <h3 className="text-lg font-bold text-ide-accent mb-3 flex items-center gap-2">
                    <Icon name="Zap" size={18} /> Como Usar
                </h3>
                <div className="space-y-4">
                    <div className="bg-ide-bg p-4 rounded border border-ide-border">
                        <h4 className="font-bold text-white text-sm mb-2">Explorer & Arquivos</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-400">
                            <li>Clique com o <strong>botão direito</strong> no Explorer para criar arquivos, pastas ou deletar itens.</li>
                            <li>Arraste e solte arquivos para movê-los entre pastas.</li>
                            <li>Seus arquivos são salvos automaticamente no navegador (IndexedDB).</li>
                        </ul>
                    </div>
                    
                    <div className="bg-ide-bg p-4 rounded border border-ide-border">
                        <h4 className="font-bold text-white text-sm mb-2">Atalhos de Teclado</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Toggle Sidebar</span> <kbd className="bg-ide-input px-1 rounded">Ctrl+B</kbd></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Quick Open</span> <kbd className="bg-ide-input px-1 rounded">Ctrl+P</kbd></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Command Palette</span> <kbd className="bg-ide-input px-1 rounded">Ctrl+Shift+P</kbd></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Salvar (Auto)</span> <kbd className="bg-ide-input px-1 rounded">Ctrl+S</kbd></div>
                            <div className="flex justify-between border-b border-white/5 pb-1"><span>Terminal</span> <kbd className="bg-ide-input px-1 rounded">Ctrl+`</kbd></div>
                        </div>
                    </div>

                    <div className="bg-ide-bg p-4 rounded border border-ide-border">
                        <h4 className="font-bold text-white text-sm mb-2">Inteligência Artificial (Capy Chat)</h4>
                        <p className="text-sm text-gray-400 mb-2">
                            Clique no ícone de robô na barra lateral direita. Insira sua chave da API Gemini (gratuita).
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-400">
                            <li>Peça para criar componentes React completos.</li>
                            <li>Use "Apply Changes" para injetar o código gerado diretamente no arquivo.</li>
                            <li>Peça para refatorar ou explicar códigos complexos.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold text-ide-secondary mb-3 flex items-center gap-2">
                    <Icon name="Cpu" size={18} /> Arquitetura & Tecnologia
                </h3>
                <div className="text-sm text-gray-400 leading-relaxed space-y-4">
                    <p>
                        O CapyUNI Codium foi construído para simular uma experiência nativa de IDE dentro do navegador.
                        Diferente de editores online comuns, ele possui um sistema de arquivos virtual persistente.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-ide-panel rounded">
                            <strong className="text-white block mb-1">Core</strong>
                            React 18, TypeScript e Vite para performance máxima e tipagem estática.
                        </div>
                        <div className="p-3 bg-ide-panel rounded">
                            <strong className="text-white block mb-1">Editor Engine</strong>
                            Monaco Editor (o mesmo do VS Code) para syntax highlighting e IntelliSense.
                        </div>
                        <div className="p-3 bg-ide-panel rounded">
                            <strong className="text-white block mb-1">State Management</strong>
                            Zustand para gerenciamento de estado global (arquivos, abas, UI) sem re-renders desnecessários.
                        </div>
                        <div className="p-3 bg-ide-panel rounded">
                            <strong className="text-white block mb-1">Persistência</strong>
                            IndexedDB (via idb-keyval) armazena todo o workspace localmente no seu navegador. Nada é perdido ao recarregar.
                        </div>
                        <div className="p-3 bg-ide-panel rounded">
                            <strong className="text-white block mb-1">Preview Engine</strong>
                            Um sistema de Bundling em tempo real (in-browser) que transpila React/TSX usando Babel Standalone e injeta em um iframe isolado.
                        </div>
                    </div>
                </div>
            </section>

        </div>
        
        <div className="p-4 border-t border-ide-border bg-ide-panel text-center text-xs text-gray-500 rounded-b-lg">
            CapyUNI Codium © 2025 - Open Source Software
        </div>
      </div>
    </div>
  );
};