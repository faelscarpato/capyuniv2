export const workspaceTabsService = {
  openTab: (openTabs: string[], fileId: string): string[] => {
    return openTabs.includes(fileId) ? openTabs : [...openTabs, fileId];
  },

  closeTab: (openTabs: string[], fileId: string): string[] => {
    return openTabs.filter((tabId) => tabId !== fileId);
  },

  getNextActiveAfterClose: (openTabs: string[], currentActiveId: string | null, closedId: string): string | null => {
    if (currentActiveId !== closedId) return currentActiveId;
    return openTabs[openTabs.length - 1] || null;
  },

  sanitizeAfterDeletion: (
    openTabs: string[],
    files: Record<string, unknown>,
    activeTabId: string | null,
    removedId: string
  ): { openTabs: string[]; activeTabId: string | null } => {
    const nextTabs = openTabs.filter((tabId) => Boolean(files[tabId]));
    const nextActive = activeTabId === removedId ? (nextTabs[0] || null) : activeTabId;
    return { openTabs: nextTabs, activeTabId: nextActive };
  }
};

