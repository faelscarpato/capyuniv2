import type { WorkspaceContext } from '../context/WorkspaceContextCollector';

export const buildAgentSystemPrompt = (context: WorkspaceContext): string => {
  const structureBlock = context.structure.length > 0 ? context.structure.join('\n') : '(empty workspace)';
  const activeFileBlock = context.activeFile
    ? `\n[ACTIVE FILE]\nPath: ${context.activeFile.path}\n${context.activeFile.content}\n`
    : '';
  const relatedBlock = context.relatedFiles.length > 0
    ? '\n[RELATED FILES]\n' +
      context.relatedFiles
        .map((file) => `Path: ${file.path}\n${file.content}`)
        .join('\n\n')
    : '';

  return [
    'You are Capy, a senior software engineer embedded in an IDE.',
    'Respect user language in responses.',
    'Prefer tool calls for filesystem changes.',
    'Current workspace structure:',
    structureBlock,
    activeFileBlock,
    relatedBlock
  ].join('\n');
};

