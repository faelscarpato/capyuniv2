import React from 'react';
import { Icon } from '../ui/Icon';

export const CapyUniverseView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-ide-bg">
        <div className="h-8 bg-ide-activity border-b border-ide-border flex items-center px-3 justify-between flex-shrink-0 select-none">
            <div className="flex items-center gap-2 text-xs font-bold text-ide-text">
                <Icon name="Rocket" size={14} className="text-purple-400" />
                <span>CapyUniverse</span>
            </div>
            <a 
                href="https://faelscarpato.github.io/capyuniverse/" 
                target="_blank" 
                rel="noreferrer"
                className="text-ide-muted hover:text-ide-text"
                title="Open in Browser"
            >
                <Icon name="ExternalLink" size={14} />
            </a>
        </div>
        <div className="flex-1 bg-white relative">
            <iframe 
                src="https://faelscarpato.github.io/capyuniverse/" 
                title="CapyUniverse"
                className="w-full h-full border-none"
                style={{ filter: 'contrast(1.05)' }}
            />
        </div>
    </div>
  );
};