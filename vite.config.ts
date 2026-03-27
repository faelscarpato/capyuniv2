import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const WORKSPACE_DIR = path.join(process.cwd(), '.workspace');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/.workspace/**'],
        usePolling: true,
        interval: 1000,
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/monaco-editor') || id.includes('@monaco-editor/react')) {
              return 'editor-monaco';
            }
            if (id.includes('node_modules/marked') || id.includes('node_modules/dompurify')) {
              return 'markdown-runtime';
            }
            if (id.includes('node_modules/openai')) {
              return 'ai-provider-openai';
            }
            if (id.includes('node_modules/@google/genai')) {
              return 'ai-provider-gemini';
            }
            if (id.includes('/features/ai/providers/')) {
              return 'ai-adapters-runtime';
            }
            if (id.includes('/features/ai/services/AIOrchestrator')) {
              return 'ai-orchestrator-runtime';
            }
            if (id.includes('/features/ai/services/editor')) {
              return 'ai-editor-runtime';
            }
            if (id.includes('/features/ai/store/')) {
              return 'ai-store-runtime';
            }
            if (id.includes('node_modules/@xterm') || id.includes('/components/terminal/')) {
              return 'terminal-runtime';
            }
            return undefined;
          }
        }
      }
    }
  };
});
