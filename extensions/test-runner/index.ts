// extensions/test-runner/index.ts
import { registerExtension, type ChatContext, type EditorExtension, type ChatSkill } from '../../lib/extensions';

// 1. Editor Extension para testes
const testSnippets: EditorExtension = {
  id: 'test-runner',
  name: 'Test Runner',
  description: 'Snippets Vitest/Jest + rodar testes',
  enabled: true,
  fileTypes: ['ts', 'tsx', 'js', 'jsx'],
  snippets: {
    'test': `
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('should render', () => {
    expect(1).toBe(1);
  });
});
`,
    'mock': `const mockFn = vi.fn(() => 'return value');`
  },
  refactors: {
    'generate-tests': (code: string) => {
      // Placeholder - pode integrar AI para gerar testes
      return `// Testes gerados para:\n${code}\n\n// TODO: AI gerar testes reais`;
    }
  }
};

// 2. Chat Skill para rodar testes
const testSkill: ChatSkill = {
  id: 'test-runner-skill',
  name: 'Test Runner',
  description: 'Rodar testes via chat',
  enabled: true,
  triggerPhrases: ['run tests', 'teste', 'vitest', 'jest'],
  async onTrigger(message: string, ctx: ChatContext) {
    const lower = message.toLowerCase();
    if (lower.includes('vitest')) {
      ctx.runTerminalCommand?.('npm run test');
      return 'Test Runner: comando executado `npm run test`.';
    }

    if (lower.includes('jest')) {
      ctx.runTerminalCommand?.('npx jest');
      return 'Test Runner: comando executado `npx jest`.';
    }

    ctx.runTerminalCommand?.('npm test');
    return 'Test Runner: comando executado `npm test`.';
  }
};

registerExtension(testSnippets);
registerExtension(testSkill);
