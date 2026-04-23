// extensions/debug-skill/index.ts
import { registerExtension, ChatSkill } from '../../lib/extensions';

const debugSkill: ChatSkill = {
  id: 'debug-skill',
  name: 'Debug Helper',
  description: 'Ferramentas de debugging via chat',
  enabled: true,
  triggerPhrases: ['debug', 'inspect', 'breakpoint', 'debugger'],
  async onTrigger(message: string, ctx) {
    if (message.includes('debug console')) {
      ctx.runTerminalCommand?.('node --inspect-brk script.js');
      return 'Iniciando Node.js com debugger. Abra chrome://inspect para conectar.';
    }

    if (message.includes('debug browser')) {
      return 'Para debugging no browser, use F12 ou Cmd+Opt+I para abrir DevTools.';
    }

    if (message.includes('breakpoint')) {
      return 'Para adicionar breakpoint, clique na margem esquerda do editor ou use F9.';
    }

    return 'Comandos de debug: "debug console" para Node.js, "debug browser" para navegador, "breakpoint" para info.';
  }
};

registerExtension(debugSkill);