import React from 'react';
import { Icon } from '../ui/Icon';
import { useUIStore } from '../../stores/uiStore';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/*
 * MobileMoreSheet
 *
 * Displays a full screen sheet on mobile that groups secondary actions
 * into a simple list. The sheet slides up from the bottom when `isOpen`
 * is true and is dismissed when clicking outside or pressing the close
 * button. Actions in the sheet leverage the existing UI store to open
 * sidebars or modals. New pages such as Docs, Community, Blog and
 * Pricing are rendered through the sidebar views.
 */
export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ isOpen, onClose }) => {
  const {
    setSidebarOpen,
    setActiveSidebarView,
    setSettingsOpen,
    setAboutOpen,
    setDocsOpen
  } = useUIStore();

  if (!isOpen) return null;

  const handleOpenSidebar = (view: any) => {
    setActiveSidebarView(view);
    setSidebarOpen(true);
    onClose();
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
    onClose();
  };

  // Items definition for the More sheet. Each item defines a label,
  // optional icon and onClick handler. Group headings can be
  // represented by items with a separator set to true.
  const items = [
    { label: 'Docs', icon: 'Book', onClick: () => handleOpenSidebar('docs') },
    { label: 'Extensions', icon: 'Blocks', onClick: () => handleOpenSidebar('extensions') },
    { label: 'Community', icon: 'Users', onClick: () => handleOpenSidebar('community') },
    { label: 'Blog', icon: 'Newspaper', onClick: () => handleOpenSidebar('blog') },
    { label: 'Pricing', icon: 'CreditCard', onClick: () => handleOpenSidebar('pricing') },
    { label: '', separator: true },
    { label: 'Settings', icon: 'Settings', onClick: handleOpenSettings },
    { label: 'About', icon: 'Info', onClick: () => { setAboutOpen(true); onClose(); } },
    { label: 'Docs (Modal)', icon: 'BookOpen', onClick: () => { setDocsOpen(true); onClose(); } },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[120] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet container */}
      <div
        className="fixed inset-x-0 bottom-0 z-[121] bg-ide-activity text-ide-text border-t border-ide-border shadow-2xl rounded-t-xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-6 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ide-border">
          <div className="flex items-center gap-2">
            <Icon name="Menu" size={20} />
            <span className="font-semibold">Mais</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ide-muted hover:text-ide-text"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="py-2">
          {items.map((item, idx) => {
            if ('separator' in item && item.separator) {
              return <div key={`sep-${idx}`} className="my-2 h-px bg-ide-border" />;
            }
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick as any}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ide-hover transition-colors text-sm"
              >
                {item.icon && <Icon name={item.icon} size={18} className="text-ide-muted" />}
                <span className="flex-1 text-left text-ide-text">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};