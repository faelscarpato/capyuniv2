import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';

export const AboutModal: React.FC = () => {
  const { isAboutOpen, setAboutOpen } = useUIStore();

  if (!isAboutOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setAboutOpen(false)}>
      <div 
        className="w-full max-w-[450px] bg-ide-activity border border-ide-border shadow-2xl rounded-lg p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
            onClick={() => setAboutOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
            <Icon name="X" size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-ide-bg rounded-full flex items-center justify-center mb-4 border border-ide-accent/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                 <Icon name="TerminalSquare" size={32} className="text-ide-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">CapyUNI Codium</h2>
            <p className="text-sm text-gray-400 font-mono">v1.0.0 (Web Edition)</p>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-6 text-center">
            CapyUNI Codium é um ambiente de desenvolvimento web persistente, leve e impulsionado por IA. 
            Criado para demonstrar o poder de aplicações web modernas com React, IndexedDB e Monaco Editor.
        </p>

        <div className="border-t border-ide-border pt-6 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-2">Desenvolvido por Rafael Scarpato</h3>
            
            <a href="https://github.com/faelscarpato" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-ide-bg rounded hover:bg-ide-panel border border-transparent hover:border-ide-accent transition-all group">
                <Icon name="Github" size={20} className="text-gray-400 group-hover:text-white" />
                <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-gray-200">GitHub</span>
                    <span className="text-xs text-gray-500">github.com/faelscarpato</span>
                </div>
                <Icon name="ExternalLink" size={14} className="ml-auto text-gray-600 group-hover:text-ide-accent" />
            </a>

            <a href="https://instagram.com/rafaelscarpato" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-ide-bg rounded hover:bg-ide-panel border border-transparent hover:border-ide-accent transition-all group">
                <Icon name="Instagram" size={20} className="text-gray-400 group-hover:text-pink-500" />
                <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-gray-200">Instagram</span>
                    <span className="text-xs text-gray-500">@rafaelscarpato</span>
                </div>
                <Icon name="ExternalLink" size={14} className="ml-auto text-gray-600 group-hover:text-ide-accent" />
            </a>
        </div>
      </div>
    </div>
  );
};