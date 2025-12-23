import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../ui/Icon';

const STEPS = [
    {
        title: "Bem-vindo ao CapyUNI",
        icon: "TerminalSquare",
        color: "text-ide-accent",
        content: (
            <div className="space-y-3">
                <p>O CapyUNI é um IDE Web completo que roda inteiramente no seu navegador.</p>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                    <li>Arquivos persistentes (não somem ao atualizar).</li>
                    <li>Editor Monaco (mesmo do VS Code).</li>
                    <li>Preview em tempo real.</li>
                </ul>
            </div>
        )
    },
    {
        title: "Inteligência Artificial (Gemini)",
        icon: "Bot",
        color: "text-pink-500",
        content: (
            <div className="space-y-4">
                <p>O Capy conta com um Engenheiro de Software Sênior (IA) integrado para criar códigos, refatorar e explicar arquivos.</p>
                
                <div className="bg-ide-input p-3 rounded border border-ide-border">
                    <strong className="text-white block mb-2">Como configurar:</strong>
                    <ol className="list-decimal list-inside text-gray-400 space-y-2 text-xs">
                        <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 underline hover:text-blue-300">Google AI Studio</a> e faça login.</li>
                        <li>Clique em <strong>Create API Key</strong>.</li>
                        <li>Copie a chave gerada (começa com <code>AIza...</code>).</li>
                        <li>No CapyUNI, clique no ícone de <strong>Robô</strong> na barra lateral direita.</li>
                        <li>Clique no ícone de <strong>Chave (Key)</strong> e cole sua chave.</li>
                    </ol>
                </div>
                <p className="text-xs text-yellow-500 italic">Sua chave é salva apenas no seu navegador (LocalStorage).</p>
            </div>
        )
    },
    {
        title: "CapyUniverse Integration",
        icon: "Rocket",
        color: "text-purple-500",
        content: (
            <div className="space-y-3">
                <p>Acesse ferramentas exclusivas do ecossistema Capy sem sair do editor.</p>
                <div className="flex gap-2 items-center text-sm bg-ide-bg p-2 rounded">
                    <Icon name="Rocket" className="text-purple-400" />
                    <span>Clique no foguete na barra lateral para abrir o CapyUniverse em modo split-view.</span>
                </div>
                <p className="text-xs text-gray-400">Útil para acessar documentações externas, ferramentas de design e utilitários.</p>
            </div>
        )
    },
    {
        title: "Dicas de Produtividade",
        icon: "Zap",
        color: "text-yellow-400",
        content: (
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-ide-bg p-2 rounded border border-white/5">
                    <strong className="block text-white mb-1">Ctrl + P</strong>
                    <span className="text-gray-400">Busca rápida de arquivos (Quick Open).</span>
                </div>
                <div className="bg-ide-bg p-2 rounded border border-white/5">
                    <strong className="block text-white mb-1">Ctrl + Shift + P</strong>
                    <span className="text-gray-400">Paleta de Comandos (Temas, Layout, etc).</span>
                </div>
                <div className="bg-ide-bg p-2 rounded border border-white/5">
                    <strong className="block text-white mb-1">Botão Direito</strong>
                    <span className="text-gray-400">No Explorer para criar pastas/arquivos.</span>
                </div>
                <div className="bg-ide-bg p-2 rounded border border-white/5">
                    <strong className="block text-white mb-1">F5</strong>
                    <span className="text-gray-400">Recarrega o Web Preview.</span>
                </div>
            </div>
        )
    }
];

export const TutorialModal: React.FC = () => {
    const { isTutorialOpen, setTutorialOpen } = useUIStore();
    const [currentStep, setCurrentStep] = useState(0);

    if (!isTutorialOpen) return null;

    const step = STEPS[currentStep];

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1);
        }
    };

    const handleClose = () => {
        setTutorialOpen(false);
        localStorage.setItem('capy_tutorial_seen', 'true');
        setCurrentStep(0);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={handleClose}>
            <div 
                className="w-full max-w-[500px] bg-ide-activity border border-ide-border shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Progress */}
                <div className="bg-ide-panel p-6 pb-0 relative">
                    <div className="absolute top-4 right-4">
                        <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
                            <Icon name="X" size={20} />
                        </button>
                    </div>
                    
                    <div className="flex justify-center mb-6">
                        <div className={`w-16 h-16 rounded-full bg-ide-bg border border-ide-border flex items-center justify-center shadow-lg ${step.color}`}>
                            <Icon name={step.icon as any} size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white text-center mb-2">{step.title}</h2>
                    
                    <div className="flex justify-center gap-1.5 mb-6">
                        {STEPS.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? `w-8 ${step.color.replace('text-', 'bg-')}` : 'w-2 bg-ide-border'}`} 
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-2 text-sm text-gray-300 leading-relaxed min-h-[200px]">
                    {step.content}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-ide-border bg-ide-panel flex justify-between items-center">
                    <button 
                        onClick={handlePrev} 
                        disabled={currentStep === 0}
                        className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors text-sm font-medium"
                    >
                        Anterior
                    </button>

                    <button 
                        onClick={handleNext}
                        className="bg-ide-accent hover:bg-opacity-90 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-ide-accent/20 transition-all flex items-center gap-2"
                    >
                        {currentStep === STEPS.length - 1 ? 'Codar' : 'Próximo'}
                        {currentStep !== STEPS.length - 1 && <Icon name="ArrowRight" size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};