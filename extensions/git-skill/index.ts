// extensions/git-skill/index.ts
import { registerExtension, ChatSkill } from '../../lib/extensions';

interface ChatContext {
  workspacePath: string;
  currentFile?: string;
}

const gitSkill: ChatSkill = {
  id: 'git-skill',
  name: 'Git Helper',
  description: 'Comandos Git via chat (commit, status, push)',
  enabled: true,
  triggerPhrases: ['git commit', 'git push', 'git status', 'git pull', 'git log'],
  async onTrigger(message: string, ctx: ChatContext) {
    const workspace = ctx.workspacePath;
    
    if (message.includes('git status')) {
      try {
        const status = await window.api.gitStatus(workspace);
        return `📁 Status Git:\n\`\`\`\n${status}\n\`\`\``;
      } catch {
        return '❌ Erro ao ler status. Verifique se está em um repo Git.';
      }
    }
    
    if (message.includes('git commit')) {
      const match = message.match(/git commit "(.*?)"/);
      if (match) {
        const msg = match[1];
        try {
          await window.api.gitCommit(workspace, msg);
          return `✅ Commit criado: "${msg}"`;
        } catch {
          return '❌ Erro no commit.';
        }
      }
      return '💡 Use: "git commit \"sua mensagem\""';
    }
    
    if (message.includes('git push')) {
      try {
        await window.api.gitPush(workspace);
        return '🚀 Push realizado!';
      } catch {
        return '❌ Erro no push.';
      }
    }
    
    return '💡 Comandos: git status, git commit "msg", git push';
  }
};

registerExtension(gitSkill);