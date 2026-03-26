export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  files: Array<{ path: string; content: string }>;
}

export const quickStartTemplates: ProjectTemplate[] = [
  {
    id: 'react-basic',
    name: 'React Basic',
    description: 'Entrypoint React + componente inicial.',
    files: [
      {
        path: 'src/main.tsx',
        content:
          "import { createRoot } from 'react-dom/client';\nimport { App } from './App';\n\ncreateRoot(document.getElementById('root')!).render(<App />);\n"
      },
      {
        path: 'src/App.tsx',
        content: "export const App = () => <h1>Hello CapyUNI</h1>;\n"
      }
    ]
  },
  {
    id: 'node-cli',
    name: 'Node CLI',
    description: 'Projeto inicial de linha de comando.',
    files: [
      {
        path: 'src/index.ts',
        content: "console.log('CapyUNI CLI ready');\n"
      }
    ]
  }
];

