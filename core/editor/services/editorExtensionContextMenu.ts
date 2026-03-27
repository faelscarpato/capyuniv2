import type { ContextMenuItem } from '../../../components/ui/ContextMenu';
import { listAvailableRefactors, listAvailableSnippets, listAvailableTemplates } from '../../../lib/extensions';

interface BuildExtensionContextMenuParams {
  fileType: string;
  onInsertSnippet: (content: string, snippetId: string) => void;
  onInsertTemplate: (content: string, templateId: string) => void;
  onApplyRefactor: (refactorId: string, transform: (code: string) => string) => void;
}

export const getCurrentFileType = (fileName?: string, language?: string): string => {
  if (!fileName) return (language || '').toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext || (language || '').toLowerCase();
};

export const buildExtensionContextMenuItems = ({
  fileType,
  onInsertSnippet,
  onInsertTemplate,
  onApplyRefactor
}: BuildExtensionContextMenuParams): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [];
  const snippetEntries = listAvailableSnippets(fileType);
  const templateEntries = listAvailableTemplates(fileType);
  const refactorEntries = listAvailableRefactors(fileType);

  if (snippetEntries.length > 0) {
    items.push({ label: '', onClick: () => {}, separator: true });
    snippetEntries.slice(0, 4).forEach((entry) => {
      items.push({
        label: `Snippet: ${entry.snippetId}`,
        onClick: () => onInsertSnippet(entry.content, entry.snippetId)
      });
    });
  }

  if (templateEntries.length > 0) {
    items.push({ label: '', onClick: () => {}, separator: true });
    templateEntries.slice(0, 3).forEach((entry) => {
      items.push({
        label: `Template: ${entry.snippetId}`,
        onClick: () => onInsertTemplate(entry.content, entry.snippetId)
      });
    });
  }

  if (refactorEntries.length > 0) {
    items.push({ label: '', onClick: () => {}, separator: true });
    refactorEntries.slice(0, 4).forEach((entry) => {
      items.push({
        label: `Refactor: ${entry.refactorId}`,
        onClick: () => onApplyRefactor(entry.refactorId, entry.apply)
      });
    });
  }

  return items;
};

