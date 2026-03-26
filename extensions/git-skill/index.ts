// extensions/git-skill/index.ts
import { registerExtension, ChatSkill } from '../../lib/extensions';

declare global {
  interface Window {
    api?: {
      gitStatus?: (workspacePath: string) => Promise<string>;
      gitCommit?: (workspacePath: string, message: string) => Promise<void>;
      gitPush?: (workspacePath: string) => Promise<void>;
    };
  }
}

const gitSkill: ChatSkill = {
  id: 'git-skill',
  name: 'Git Helper',
  description: 'Comandos Git via chat (commit, status, push)',
  enabled: true,
  triggerPhrases: ['git commit', 'git push', 'git status', 'git pull', 'git log'],
  async onTrigger(message: string, ctx) {
    const api = window.api;

    const runFallback = (command: string): string => {
      ctx.runTerminalCommand?.(command);
      return `Comando enviado ao terminal: \`${command}\``;
    };
    
    if (message.includes('git status')) {
      if (api?.gitStatus) {
        try {
          const status = await api.gitStatus('.');
          return `Status Git:\n${status}`;
        } catch {
          return 'Erro ao ler status. Verifique se está em um repo Git.';
        }
      }
      return runFallback('git status');
    }
    
    if (message.includes('git commit')) {
      const match = message.match(/git commit "(.*?)"/);
      if (match) {
        const msg = match[1];
        if (api?.gitCommit) {
          try {
            await api.gitCommit('.', msg);
            return `Commit criado: "${msg}"`;
          } catch {
            return 'Erro no commit.';
          }
        }
        return runFallback(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
      }
      return 'Use: "git commit \"sua mensagem\""';
    }
    
    if (message.includes('git push')) {
      if (api?.gitPush) {
        try {
          await api.gitPush('.');
          return 'Push realizado.';
        } catch {
          return 'Erro no push.';
        }
      }
      return runFallback('git push');
    }
    
    return 'Comandos: git status, git commit "msg", git push';
  }
};

registerExtension(gitSkill);
