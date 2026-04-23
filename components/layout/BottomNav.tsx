import React, { useState } from 'react';
import { Icon } from '../ui/Icon';

interface BottomNavProps {
  onNavigate: (view: string) => void;
  activeView: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ onNavigate, activeView }) => {
  const navItems = [
    { id: 'explorer', label: 'Files', icon: 'Files' },
    { id: 'search', label: 'Search', icon: 'Search' },
    { id: 'terminal', label: 'Terminal', icon: 'Terminal' },
    { id: 'git', label: 'Git', icon: 'GitBranch' },
    { id: 'ai', label: 'AI', icon: 'Bot' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ide-bg border-t border-ide-border flex justify-around items-center h-16 pb-safe-area-inset-bottom z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
            activeView === item.id
              ? 'bg-ide-accent text-white'
              : 'text-ide-muted hover:text-ide-text hover:bg-ide-hover'
          }`}
          aria-label={item.label}
        >
          <Icon name={item.icon as any} size={20} className="mb-1" />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export { BottomNav };