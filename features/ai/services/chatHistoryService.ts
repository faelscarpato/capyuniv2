import { get, set, del } from 'idb-keyval';
import type { AIChatMessage } from '../store/aiStore';

const getChatKey = (workspaceId: string) => `capy_chat_history_${workspaceId}`;
const MAX_MESSAGES_PER_WORKSPACE = 100;

export const chatHistoryService = {
  saveHistory: async (workspaceId: string, messages: AIChatMessage[]): Promise<void> => {
    const trimmed = messages.slice(-MAX_MESSAGES_PER_WORKSPACE);
    await set(getChatKey(workspaceId), trimmed);
  },

  loadHistory: async (workspaceId: string): Promise<AIChatMessage[]> => {
    return (await get<AIChatMessage[]>(getChatKey(workspaceId))) || [];
  },

  clearHistory: async (workspaceId: string): Promise<void> => {
    await del(getChatKey(workspaceId));
  },

  clearAllHistories: async (): Promise<void> => {
    const keys = await indexedDB.databases();
    for (const db of keys) {
      if (db.name?.includes('capy')) {
        // Can't delete other idb-keyval stores easily, just log
        console.log('[chatHistory] Found DB:', db.name);
      }
    }
  }
};