import React, { useState } from 'react';
import { Icon } from '../ui/Icon';

export const ExtensionsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock Extensions Data
  const extensions = [
    { id: 'prettier', name: 'Prettier - Code formatter', author: 'Prettier', downloads: '38M', installed: true, icon: 'CheckCircle' },
    { id: 'eslint', name: 'ESLint', author: 'Microsoft', downloads: '28M', installed: false, icon: 'ShieldAlert' },
    { id: 'react', name: 'ES7+ React/Redux Snippets', author: 'dsznajder', downloads: '12M', installed: true, icon: 'Code' },
    { id: 'python', name: 'Python', author: 'Microsoft', downloads: '100M', installed: false, icon: 'FileJson' },
    { id: 'docker', name: 'Docker', author: 'Microsoft', downloads: '25M', installed: false, icon: 'Box' },
    { id: 'live-server', name: 'Live Server', author: 'Ritwick Dey', downloads: '40M', installed: true, icon: 'Radio' },
  ];

  const filtered = extensions.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-ide-sidebar text-ide-text">
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
        EXTENSIONS
      </div>
      
      <div className="px-4 pb-4">
        <div className="relative">
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Extensions in Marketplace"
                className="w-full bg-ide-input text-white text-sm px-2 py-1.5 rounded border border-ide-border focus:border-ide-accent focus:outline-none"
            />
            <Icon name="Search" size={14} className="absolute right-2 top-2 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {filtered.map(ext => (
            <div key={ext.id} className="flex gap-3 p-2 hover:bg-ide-bg rounded cursor-pointer group mb-1">
                <div className="w-10 h-10 bg-ide-activity rounded flex items-center justify-center flex-shrink-0">
                    <Icon name={ext.icon as any} size={20} className="text-ide-accent" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-sm truncate">{ext.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex gap-2 items-center">
                        <span>{ext.author}</span>
                        <span className="flex items-center gap-0.5"><Icon name="Download" size={10}/> {ext.downloads}</span>
                    </div>
                    <div className="mt-1">
                        {ext.installed ? (
                            <span className="text-[10px] text-ide-secondary bg-ide-secondary/10 px-1 rounded">Installed</span>
                        ) : (
                             <button className="bg-ide-accent text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                Install
                             </button>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};