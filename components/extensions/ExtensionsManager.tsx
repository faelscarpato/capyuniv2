import React, { useMemo, useState } from 'react';
import { disableExtension, enableExtension, listChatSkills, listEditorExtensions } from '../../lib/extensions';
import { Icon } from '../ui/Icon';

export const ExtensionsManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [renderVersion, setRenderVersion] = useState(0);

  const editorExtensions = useMemo(() => {
    const all = listEditorExtensions();
    return all.filter((ext) => ext.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, renderVersion]);

  const chatSkills = useMemo(() => {
    const all = listChatSkills();
    return all.filter((ext) => ext.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, renderVersion]);

  const toggleExtension = (id: string, enabled: boolean) => {
    if (enabled) disableExtension(id);
    else enableExtension(id);
    setRenderVersion((value) => value + 1);
  };

  return (
    <div className="flex flex-col h-full bg-ide-sidebar text-ide-text">
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">EXTENSIONS MANAGER</div>

      <div className="px-4 pb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search installed extensions"
            className="w-full bg-ide-input text-white text-sm px-2 py-1.5 rounded border border-ide-border focus:border-ide-accent focus:outline-none"
          />
          <Icon name="Search" size={14} className="absolute right-2 top-2 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-5">
        <section>
          <div className="px-2 pb-2 text-[11px] uppercase tracking-wide text-gray-500">Editor Extensions</div>
          <div className="space-y-1">
            {editorExtensions.map((ext) => {
              const snippetCount = Object.keys(ext.snippets || {}).length;
              const templateCount = Object.keys(ext.templates || {}).length;
              const refactorCount = Object.keys(ext.refactors || {}).length;

              return (
                <div key={ext.id} className="flex gap-3 p-2 hover:bg-ide-bg rounded border border-transparent hover:border-ide-border">
                  <div className="w-10 h-10 bg-ide-activity rounded flex items-center justify-center flex-shrink-0">
                    <Icon name="Blocks" size={18} className="text-ide-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-sm truncate">{ext.name}</span>
                      <button
                        onClick={() => toggleExtension(ext.id, ext.enabled)}
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          ext.enabled
                            ? 'text-ide-secondary bg-ide-secondary/10'
                            : 'bg-ide-accent text-white hover:bg-opacity-80'
                        }`}
                      >
                        {ext.enabled ? 'Enabled' : 'Enable'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {ext.description || 'No description.'}
                    </div>
                    <div className="text-[10px] text-ide-muted mt-1">
                      snippets: {snippetCount} | templates: {templateCount} | refactors: {refactorCount}
                    </div>
                  </div>
                </div>
              );
            })}
            {editorExtensions.length === 0 && (
              <div className="text-xs text-gray-500 px-2 py-3">No editor extensions found.</div>
            )}
          </div>
        </section>

        <section>
          <div className="px-2 pb-2 text-[11px] uppercase tracking-wide text-gray-500">Chat Skills</div>
          <div className="space-y-1">
            {chatSkills.map((skill) => (
              <div key={skill.id} className="flex gap-3 p-2 hover:bg-ide-bg rounded border border-transparent hover:border-ide-border">
                <div className="w-10 h-10 bg-ide-activity rounded flex items-center justify-center flex-shrink-0">
                  <Icon name="Bot" size={18} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-sm truncate">{skill.name}</span>
                    <button
                      onClick={() => toggleExtension(skill.id, skill.enabled)}
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        skill.enabled
                          ? 'text-ide-secondary bg-ide-secondary/10'
                          : 'bg-ide-accent text-white hover:bg-opacity-80'
                      }`}
                    >
                      {skill.enabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{skill.description || 'No description.'}</div>
                  <div className="text-[10px] text-ide-muted mt-1">
                    triggers: {skill.triggerPhrases.join(', ')}
                  </div>
                </div>
              </div>
            ))}
            {chatSkills.length === 0 && <div className="text-xs text-gray-500 px-2 py-3">No chat skills found.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};
