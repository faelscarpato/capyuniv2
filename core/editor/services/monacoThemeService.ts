import { themes } from '../../../lib/themes';

export const defineCapyMonacoThemes = (monaco: any): void => {
  monaco.editor.defineTheme('capy-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'keyword', foreground: '8B5CF6', fontStyle: 'bold' },
      { token: 'string', foreground: '10B981' },
      { token: 'number', foreground: 'F43F5E' },
      { token: 'type', foreground: '3B82F6' }
    ],
    colors: {
      'editor.background': '#0F172A',
      'editor.foreground': '#F8FAFC',
      'editorLineNumber.foreground': '#334155',
      'editor.lineHighlightBackground': '#1E293B',
      'editorCursor.foreground': '#8B5CF6',
      'editorIndentGuide.background': '#1E293B',
      'editorIndentGuide.activeBackground': '#334155',
      'editor.selectionBackground': '#8B5CF633'
    }
  });

  monaco.editor.defineTheme('midnight-pro', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '555555', fontStyle: 'italic' },
      { token: 'keyword', foreground: '3b82f6', fontStyle: 'bold' },
      { token: 'string', foreground: 'ef4444' },
      { token: 'variable', foreground: 'F5F5F7' },
      { token: 'type', foreground: '06b6d4' },
      { token: 'function', foreground: '8b5cf6' }
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#F5F5F7',
      'editorCursor.foreground': '#3b82f6',
      'editor.lineHighlightBackground': '#111111',
      'editorLineNumber.foreground': '#333333',
      'editorLineNumber.activeForeground': '#3b82f6',
      'editorIndentGuide.background': '#111111',
      'editorIndentGuide.activeBackground': '#333333',
      'sidebar.background': '#000000',
      'editor.selectionBackground': '#3b82f644',
      'editorBracketMatch.background': '#3b82f633',
      'editorBracketMatch.border': '#3b82f6'
    }
  });

  monaco.editor.defineTheme('capy-glass', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#00000000'
    }
  });
};

export const applyMonacoTheme = (monaco: any, currentTheme: string): void => {
  const themeDef = themes[currentTheme];
  monaco.editor.setTheme(themeDef?.monacoTheme || 'vs-dark');
};

