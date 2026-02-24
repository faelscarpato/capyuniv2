import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';

export const AboutModal: React.FC = () => {
  const { isAboutOpen, setAboutOpen } = useUIStore();

  if (!isAboutOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-500" onClick={() => setAboutOpen(false)}>
      <div
        className="w-full max-w-[450px] bg-ide-panel/90 backdrop-blur-2xl border border-ide-border-strong shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-3xl p-8 relative animate-in fade-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setAboutOpen(false)}
          className="absolute top-6 right-6 text-ide-muted hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
        >
          <Icon name="X" size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-ide-bg rounded-2xl flex items-center justify-center mb-5 border border-ide-accent/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] rotate-3 hover:rotate-0 transition-transform duration-500 group">
            <Icon name="TerminalSquare" size={40} className="text-ide-accent group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">CapyUNI Codium</h2>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-ide-accent/10 border border-ide-accent/20 text-[10px] font-bold text-ide-accent uppercase tracking-widest">
            v1.0.0 Stable
          </div>
        </div>

        <p className="text-ide-muted text-[15px] leading-relaxed mb-8 text-center font-medium">
          O ambiente de desenvolvimento local-first mais leve e inteligente.
          Potencializado por IA e desenhado para a web moderna de 2026.
        </p>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-ide-muted uppercase tracking-[0.2em] text-center mb-4">Criado por Rafael Scarpato</h3>

          <a href="https://github.com/faelscarpato" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-ide-bg/50 rounded-2xl hover:bg-ide-accent/10 border border-ide-border hover:border-ide-accent/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-ide-accent/20 transition-colors">
              <Icon name="Github" size={20} className="text-ide-muted group-hover:text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white group-hover:text-ide-accent transition-colors">GitHub</span>
              <span className="text-xs text-ide-muted uppercase tracking-tighter">github.com/faelscarpato</span>
            </div>
            <Icon name="ExternalLink" size={14} className="ml-auto text-ide-muted group-hover:text-ide-accent opacity-0 group-hover:opacity-100 transition-all" />
          </a>

          <a href="https://instagram.com/rafaelscarpato" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-ide-bg/50 rounded-2xl hover:bg-ide-secondary/10 border border-ide-border hover:border-ide-secondary/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-ide-secondary/20 transition-colors">
              <Icon name="Instagram" size={20} className="text-ide-muted group-hover:text-pink-500" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white group-hover:text-ide-secondary transition-colors">Instagram</span>
              <span className="text-xs text-ide-muted uppercase tracking-tighter">@rafaelscarpato</span>
            </div>
            <Icon name="ExternalLink" size={14} className="ml-auto text-ide-muted group-hover:text-ide-secondary opacity-0 group-hover:opacity-100 transition-all" />
          </a>
        </div>
      </div>
    </div>
  );
};