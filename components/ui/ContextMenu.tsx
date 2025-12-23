import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  shortcut?: string;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, items }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-64 bg-[#252526] border border-[#454545] shadow-xl rounded-sm py-1 text-[13px] text-[#cccccc] select-none"
      style={{ top: y, left: x }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="h-[1px] bg-[#454545] my-1 mx-2" />;
        }

        return (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors flex items-center justify-between group ${
              item.danger ? 'text-red-400' : ''
            }`}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-xs opacity-60 group-hover:opacity-100">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};