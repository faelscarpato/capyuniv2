import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { workspacePackageService } from '../../features/productivity/import-export/workspacePackageService';
import { themes } from '../../lib/themes';
import { useNotificationStore } from '../../stores/notificationStore';
import { t } from '../../lib/i18n';
import { executeAppCommand, executeMenuCommand } from '../../core/commands/handlers/registerDefaultCommands';

export const Topbar: React.FC = () => {
  const { importWorkspaceData } = useWorkspaceStore();
  const {
    setTheme, toggleQuickOpen,
    setAboutOpen, setDocsOpen,
    setTutorialOpen, isMobile, currentTheme, language, setLanguage, setApiKeyModalOpen
  } = useUIStore();
  const { addNotification } = useNotificationStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addNotification('info', 'Importando workspace...', 2000);
      try {
        const newFiles = await workspacePackageService.importZip(file);
        if (newFiles) {
          importWorkspaceData(newFiles);
          addNotification('success', 'Workspace importado com sucesso!');
        } else {
          addNotification('error', 'Falha ao processar o arquivo ZIP.');
        }
      } catch (err) {
        console.error("Import error", err);
        addNotification('error', 'Erro ao carregar o arquivo ZIP.');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveMenu(null);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setActiveMenu(null);
  };

  const handleWelcomeReload = () => {
    executeMenuCommand('workspace.reload');
    setActiveMenu(null);
  };

  const runCommandAndClose = (id: string) => {
    executeAppCommand(id);
    setActiveMenu(null);
  };

  // Generate Theme Menu Items dynamically
  const themeItems = Object.values(themes).map(t => ({
    label: t.label,
    action: () => { setTheme(t.id); setActiveMenu(null); },
    icon: t.type === 'light' ? 'Sun' : 'Moon',
    active: currentTheme === t.id
  }));

  const menuItems: Record<string, { label: string; action: () => void; shortcut?: string; separator?: boolean; danger?: boolean; icon?: any; active?: boolean }[]> = {
    [t('file', language)]: [
      { label: t('newFile', language), action: () => { executeMenuCommand('workspace.createFile'); setActiveMenu(null); }, shortcut: 'Ctrl+N' },
      { label: t('newFolder', language), action: () => { executeMenuCommand('workspace.createFolder'); setActiveMenu(null); } },
      { label: t('openFile', language), action: () => { toggleQuickOpen(); setActiveMenu(null); }, shortcut: 'Ctrl+P' },
      { label: '', action: () => { }, separator: true },
      { label: t('saveWorkspace', language), action: () => { executeMenuCommand('workspace.save'); setActiveMenu(null); }, shortcut: 'Ctrl+S' },
      { label: '', action: () => { }, separator: true },
      { label: t('renameFile', language), action: () => { executeMenuCommand('workspace.renameActive'); setActiveMenu(null); } },
      { label: t('deleteFile', language), action: () => { executeMenuCommand('workspace.deleteActive'); setActiveMenu(null); }, danger: true },
      { label: '', action: () => { }, separator: true },
      { label: t('importZip', language), action: handleImportClick },
      { label: t('exportZip', language), action: () => { executeMenuCommand('workspace.exportZip'); setActiveMenu(null); } },
      { label: '', action: () => { }, separator: true },
      { label: t('closeProject', language), action: () => { executeMenuCommand('workspace.close'); setActiveMenu(null); }, danger: true },
    ],
    [t('edit', language)]: [
      { label: t('undo', language), action: () => { setActiveMenu(null); }, shortcut: 'Ctrl+Z' },
      { label: t('redo', language), action: () => { setActiveMenu(null); }, shortcut: 'Ctrl+Y' },
      { label: '', action: () => { }, separator: true },
      { label: t('find', language), action: () => runCommandAndClose('ui.openSearch'), shortcut: 'Ctrl+F' },
      { label: t('replace', language), action: () => runCommandAndClose('ui.openSearch'), shortcut: 'Ctrl+H' },
    ],
    [t('view', language)]: [
      { label: t('explorer', language), action: () => { executeMenuCommand('ui.openExplorer'); setActiveMenu(null); }, shortcut: 'Ctrl+Shift+E', icon: 'Files' },
      { label: t('search', language), action: () => { executeMenuCommand('ui.openSearch'); setActiveMenu(null); }, shortcut: 'Ctrl+Shift+F', icon: 'Search' },
      { label: t('extensions', language), action: () => { executeMenuCommand('ui.openExtensions'); setActiveMenu(null); }, shortcut: 'Ctrl+Shift+X', icon: 'Blocks' },
      { label: '', action: () => { }, separator: true },
      { label: t('toggleSidebar', language), action: () => { executeMenuCommand('ui.toggleSidebar'); setActiveMenu(null); }, shortcut: 'Ctrl+B' },
      { label: t('togglePanel', language), action: () => { executeMenuCommand('ui.togglePanel'); setActiveMenu(null); }, shortcut: 'Ctrl+`' },
    ],
    // New Functions Menu
    [t('functions', language)]: [
      { label: t('webPreview', language), action: () => runCommandAndClose('ui.openPreviewRight'), icon: 'Globe' },
      { label: t('capyUniverse', language), action: () => runCommandAndClose('ui.openCapyUniverse'), icon: 'Rocket' },
      { label: t('aiChat', language), action: () => { executeMenuCommand('ui.openChat'); setActiveMenu(null); }, icon: 'Bot' },
      { label: t('webSearch', language), action: () => runCommandAndClose('ui.openGrounding'), icon: 'Globe2' },
      { label: '', action: () => { }, separator: true },
      // Themes moved here
      ...themeItems
    ],
    [t('run', language)]: [
      { label: t('startPreview', language), action: () => runCommandAndClose('panel.openPreview'), shortcut: 'F5' },
      { label: language === 'pt' ? 'Ativar Runtime Local' : 'Activate Local Runtime', action: () => runCommandAndClose('runtime.activateLocal'), icon: 'Terminal' },
      { label: language === 'pt' ? 'Desconectar Runtime Local' : 'Disconnect Local Runtime', action: () => runCommandAndClose('runtime.disconnect'), icon: 'XCircle' },
    ],
    [t('help', language)]: [
      { label: t('welcome', language), action: handleWelcomeReload, icon: 'RefreshCcw' },
      { label: '', action: () => { }, separator: true },
      { label: t('configApiKey', language), action: () => { setApiKeyModalOpen(true); setActiveMenu(null); }, icon: 'Key' },
      { label: '', action: () => { }, separator: true },
      { label: t('tutorial', language), action: () => { setTutorialOpen(true); setActiveMenu(null); }, icon: 'GraduationCap' },
      { label: t('docs', language), action: () => { setDocsOpen(true); setActiveMenu(null); }, icon: 'Book' },
      { label: 'CapyUniverse (External)', action: () => { window.open('https://faelscarpato.github.io/capyuniverse/', '_blank'); setActiveMenu(null); }, icon: 'ExternalLink' },
      { label: '', action: () => { }, separator: true },
      // Language Switcher
      { label: 'Português', action: () => { setLanguage('pt'); setActiveMenu(null); }, icon: language === 'pt' ? 'Check' : undefined },
      { label: 'English', action: () => { setLanguage('en'); setActiveMenu(null); }, icon: language === 'en' ? 'Check' : undefined },
      { label: '', action: () => { }, separator: true },
      { label: t('about', language), action: () => { setAboutOpen(true); setActiveMenu(null); }, icon: 'Info' },
    ]
  };

  // Map menu keys to icons for mobile view. These names correspond to
  // lucide-react icons registered in the Icon component. When adding a
  // new menu section, ensure there is an appropriate icon here. If a
  // mapping is missing the button will fall back to the menu key text.
  const menuIconMap: Record<string, string> = {
    [t('file', language)]: 'Files',
    [t('edit', language)]: 'Wand2',
    [t('view', language)]: 'Layout',
    [t('functions', language)]: 'Rocket',
    [t('run', language)]: 'Terminal',
    [t('help', language)]: 'Info'
  };
  const menuKeys = Object.keys(menuItems);

  return (
    <div className="h-10 bg-ide-bg flex items-center justify-between px-3 border-b border-ide-border select-none relative z-[100] text-ide-text">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".zip,application/zip,application/x-zip-compressed,multipart/x-zip"
        onChange={handleImport}
      />

      <div className="flex items-center gap-2">
        {/* Fake Window Controls - Hide on mobile */}
        {!isMobile && (
          <div className="flex gap-1.5 mr-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        )}

        <div className="flex items-center gap-2 font-bold text-lg mr-2 sm:mr-4">
          <Icon name="TerminalSquare" className="w-5 h-5 text-ide-accent" />
          {/* Text only on desktop */}
          {!isMobile && (
            <>
              <span className="text-ide-accent">Capy</span>
              <span className="text-ide-text">UNI</span>
            </>
          )}
        </div>

        {/* Menu Items - Removed overflow-x-auto to allow dropdowns to pop out properly */}
        <div ref={menuRef} className="flex gap-1">
          {menuKeys.map((key, index) => {
            // Determine alignment: The last 3 items (Functions, Run, Help) align to right to avoid overflow
            // Indices: 0, 1, 2 = Left. 3, 4, 5 = Right.
            const isRightAligned = index >= 3;

            return (
              <div key={key} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === key ? null : key)}
                  onMouseEnter={() => !isMobile && activeMenu && setActiveMenu(key)}
                  className={`px-2 sm:px-3 py-1 flex items-center justify-center rounded hover:bg-ide-hover transition-colors ${activeMenu === key ? 'bg-ide-hover text-ide-text' : 'text-ide-muted hover:text-ide-text'}`}
                  title={key}
                >
                  {isMobile ? (
                    menuIconMap[key] ? <Icon name={menuIconMap[key]} size={18} /> : <span className="text-xs capitalize">{key}</span>
                  ) : (
                    <span className="text-xs capitalize">{key}</span>
                  )}
                </button>

                {activeMenu === key && (
                  <div
                    className={`absolute top-full mt-1 w-56 sm:w-60 bg-ide-activity border border-ide-border shadow-xl rounded-sm py-1 flex flex-col text-sm text-ide-text z-[150] ${isRightAligned ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}
                  >
                    {menuItems[key].map((item, idx) => (
                      item.separator ? (
                        <div key={idx} className="h-px bg-ide-border my-1 mx-2" />
                      ) : (
                        <button
                          type="button"
                          key={idx}
                          onClick={item.action}
                          className={`w-full text-left px-4 py-2 sm:py-1.5 hover:bg-ide-accent hover:text-white transition-colors flex justify-between items-center ${item.danger ? 'text-red-400 hover:text-white' : 'text-ide-text'}`}
                        >
                          <span className="flex items-center gap-2">
                            {/* If active checkmark, show it. If icon, show it. */}
                            {item.active ? (
                              <Icon name="Check" size={14} className="text-ide-accent" />
                            ) : (
                              item.icon && <Icon name={item.icon} size={14} className="opacity-70" />
                            )}
                            {!item.active && !item.icon && <span className="w-3.5" />}

                            {item.label}
                          </span>
                          {!isMobile && item.shortcut && <span className="text-xs opacity-50 ml-4">{item.shortcut}</span>}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!isMobile && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="flex bg-ide-accent hover:bg-opacity-90 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all items-center gap-1 shadow-lg shadow-ide-accent/20"
          >
            {language === 'pt' ? 'COMEÇAR AGORA' : 'START NOW'} <Icon name="ChevronRight" size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
