import { generateCodeFix } from '../../../lib/aiProvider';
import type { AIProvider } from '../../../lib/aiProvider';

interface EditorFile {
  id: string;
  name: string;
}

interface ChatStateSnapshot {
  preferredProvider: AIProvider;
  geminiApiKey: string;
  groqApiKey: string;
  llm7ApiKey: string;
}

interface NotificationPort {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => void;
}

interface RunEditorAIFixParams {
  editor: any;
  file: EditorFile | null;
  chatState: ChatStateSnapshot;
  notifications: NotificationPort;
}

const resolveActiveKey = (state: ChatStateSnapshot): string => {
  if (state.preferredProvider === 'gemini') return state.geminiApiKey;
  if (state.preferredProvider === 'groq') return state.groqApiKey;
  return state.llm7ApiKey;
};

export const runEditorAIFix = async ({
  editor,
  file,
  chatState,
  notifications
}: RunEditorAIFixParams): Promise<void> => {
  if (!editor || !file) return;
  const activeKey = resolveActiveKey(chatState);

  if (!activeKey) {
    notifications.addNotification('error', 'API Key missing. Go to AI Chat to set it.');
    return;
  }

  const model = editor.getModel();
  const selection = editor.getSelection();
  if (!model || !selection) return;

  const isSelection = !selection.isEmpty();
  const codeToFix = isSelection ? model.getValueInRange(selection) : model.getValue();

  notifications.addNotification('info', 'Capy AI is thinking...', 4000);

  try {
    const instruction = isSelection
      ? 'Analyze this code selection. Fix any errors, optimize logic, and improve readability. Return ONLY the code.'
      : 'Generate code here based on the file context or fix global errors. Return the Full file content.';

    const fixedCode = await generateCodeFix({
      provider: chatState.preferredProvider,
      apiKeys: {
        geminiApiKey: chatState.geminiApiKey,
        groqApiKey: chatState.groqApiKey,
        llm7ApiKey: chatState.llm7ApiKey
      },
      params: {
        code: codeToFix,
        instruction,
        fileName: file.name
      }
    });

    editor.executeEdits('capy-ai', [
      {
        range: isSelection ? selection : model.getFullModelRange(),
        text: fixedCode,
        forceMoveMarkers: true
      }
    ]);

    notifications.addNotification('success', 'Code updated by Capy!');
  } catch (err: any) {
    notifications.addNotification('error', `AI Fix failed: ${err.message}`);
  }
};

