import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';
import { useUIStore } from '../../stores/uiStore';
import { themes } from '../../lib/themes';

interface Props {
    onLaunch: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onLaunch }) => {
    const { setTheme, currentTheme } = useUIStore();
    const [animateIn, setAnimateIn] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        setTimeout(() => setAnimateIn(true), 100);
    }, []);

    const handleThemeSelect = (themeId: string) => {
        setTheme(themeId);
        // Launch immediately
        setIsLeaving(true);
        setTimeout(() => {
            onLaunch();
        }, 600);
    };

    // Filter out vscode-dark as requested
    const displayThemes = Object.values(themes).filter(t => t.id !== 'vscode-dark');

    // Matrix Code Rain Effect Text
    const codeSnippet = `const init = () => { console.log("System Ready"); }; function boot() { return true; } import { App } from 'capy'; const x = 0; while(true) { run(); } const capy = new AI(); capy.code(); `;
    const repeatedCode = Array(50).fill(codeSnippet).join(" ");

    return (
        <div className={`fixed inset-0 z-[999] bg-black text-white transition-opacity duration-700 overflow-hidden font-sans selection:bg-purple-500/30 ${isLeaving ? 'opacity-0 scale-95' : 'opacity-100'}`}>
            
            {/* Matrix / Code Rain Animation Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden flex flex-col justify-center">
                 <div className="whitespace-nowrap font-mono text-sm text-green-500 animate-[scroll_20s_linear_infinite] leading-loose" style={{ transform: 'rotate(-5deg) scale(1.5)' }}>
                     {repeatedCode}
                 </div>
                 <div className="whitespace-nowrap font-mono text-sm text-blue-500 animate-[scroll_25s_linear_infinite_reverse] leading-loose" style={{ transform: 'rotate(-5deg) scale(1.5)' }}>
                     {repeatedCode}
                 </div>
                 <div className="whitespace-nowrap font-mono text-sm text-purple-500 animate-[scroll_30s_linear_infinite] leading-loose" style={{ transform: 'rotate(-5deg) scale(1.5)' }}>
                     {repeatedCode}
                 </div>
                 {/* CSS Animation injection */}
                 <style>{`
                    @keyframes scroll {
                        from { transform: translateX(0) rotate(-5deg) scale(1.5); }
                        to { transform: translateX(-50%) rotate(-5deg) scale(1.5); }
                    }
                 `}</style>
            </div>

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] bg-purple-900/10 rounded-full blur-[120px] animate-pulse duration-[10000ms]"></div>
                <div className="absolute bottom-[0%] right-[0%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]"></div>
            </div>

            {/* Main Content */}
            <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-4 py-10 transition-all duration-1000 ease-out transform ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                
                {/* Hero Section */}
                <div className="text-center mb-10 md:mb-16 mt-4">
                    <div className="inline-flex items-center justify-center p-4 md:p-5 mb-6 md:mb-8 bg-white/5 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-md relative group overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                         <Icon name="TerminalSquare" size={48} className="text-[#3b82f6] relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] md:w-16 md:h-16" />
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">
                        <span className="text-white">Capy</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] via-[#8B5CF6] to-[#ef4444]">UNI</span>
                    </h1>
                    
                    <p className="text-lg md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed px-4">
                        Selecione seu estilo para iniciar a sessão
                    </p>
                </div>

                {/* Theme Cards */}
                <div className="w-full mb-12">
                    <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
                        {displayThemes.map((theme, idx) => {
                            const isSelected = currentTheme === theme.id;
                            return (
                                <button 
                                    key={theme.id}
                                    onClick={() => handleThemeSelect(theme.id)}
                                    className={`
                                        group relative flex flex-col items-center gap-3 md:gap-4 w-full max-w-[160px] md:max-w-[200px] transition-all duration-300
                                        ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                                        active:scale-95
                                    `}
                                    style={{ transitionDelay: `${idx * 100 + 200}ms` }}
                                >
                                    <div className={`
                                        w-full aspect-video rounded-xl border transition-all duration-300 overflow-hidden relative shadow-2xl
                                        border-white/10 hover:border-[#3b82f6] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]
                                        group-hover:scale-105
                                    `}>
                                        {/* Abstract UI Preview */}
                                        <div className="w-full h-full flex" style={{ backgroundColor: theme.colors['--ide-bg'] }}>
                                            <div className="w-[15%] h-full border-r" style={{ backgroundColor: theme.colors['--ide-activity'], borderColor: theme.colors['--ide-border'] }} />
                                            <div className="w-[25%] h-full border-r" style={{ backgroundColor: theme.colors['--ide-sidebar'], borderColor: theme.colors['--ide-border'] }} />
                                            <div className="flex-1 p-2 md:p-3 flex flex-col gap-2">
                                                <div className="w-1/3 h-1.5 md:h-2 rounded-full" style={{ backgroundColor: theme.colors['--ide-accent'] }} />
                                                <div className="w-2/3 h-1.5 md:h-2 rounded-full opacity-30" style={{ backgroundColor: theme.colors['--ide-text'] }} />
                                                <div className="w-1/2 h-1.5 md:h-2 rounded-full opacity-30" style={{ backgroundColor: theme.colors['--ide-text'] }} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <span className={`text-sm font-medium tracking-wide transition-colors ${isSelected ? 'text-[#3b82f6]' : 'text-slate-400 group-hover:text-white'}`}>
                                        {theme.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                 {/* Footer */}
                <div className="text-slate-600 text-xs font-mono tracking-wider opacity-50 pb-4 text-center mt-auto">
                    CAPYUNI v1.0.0 • POWERED BY GEMINI • LOCAL FIRST
                </div>
            </div>
            
        </div>
    );
};