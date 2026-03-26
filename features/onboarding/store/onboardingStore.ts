import { create } from 'zustand';

const STORAGE_KEY = 'capy_onboarding_v2';

interface OnboardingState {
  hasCompletedWelcome: boolean;
  hasConfiguredAI: boolean;
  hasUsedTerminal: boolean;
  markWelcomeCompleted: () => void;
  markAIConfigured: () => void;
  markTerminalUsed: () => void;
}

const readPersisted = (): Pick<OnboardingState, 'hasCompletedWelcome' | 'hasConfiguredAI' | 'hasUsedTerminal'> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { hasCompletedWelcome: false, hasConfiguredAI: false, hasUsedTerminal: false };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      hasCompletedWelcome: Boolean(parsed.hasCompletedWelcome),
      hasConfiguredAI: Boolean(parsed.hasConfiguredAI),
      hasUsedTerminal: Boolean(parsed.hasUsedTerminal)
    };
  } catch {
    return { hasCompletedWelcome: false, hasConfiguredAI: false, hasUsedTerminal: false };
  }
};

const persist = (state: Pick<OnboardingState, 'hasCompletedWelcome' | 'hasConfiguredAI' | 'hasUsedTerminal'>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // noop
  }
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...readPersisted(),
  markWelcomeCompleted: () => {
    set({ hasCompletedWelcome: true });
    const { hasCompletedWelcome, hasConfiguredAI, hasUsedTerminal } = get();
    persist({ hasCompletedWelcome, hasConfiguredAI, hasUsedTerminal });
  },
  markAIConfigured: () => {
    set({ hasConfiguredAI: true });
    const { hasCompletedWelcome, hasConfiguredAI, hasUsedTerminal } = get();
    persist({ hasCompletedWelcome, hasConfiguredAI, hasUsedTerminal });
  },
  markTerminalUsed: () => {
    set({ hasUsedTerminal: true });
    const { hasCompletedWelcome, hasConfiguredAI, hasUsedTerminal } = get();
    persist({ hasCompletedWelcome, hasConfiguredAI, hasUsedTerminal });
  }
}));

