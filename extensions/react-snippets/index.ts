// extensions/react-snippets/index.ts
import { registerExtension, EditorExtension } from '../../lib/extensions';

const reactSnippets: EditorExtension = {
  id: 'react-snippets',
  name: 'React Snippets & Templates',
  description: 'Snippets e templates para React/TSX',
  enabled: true,
  fileTypes: ['tsx', 'jsx', 'ts', 'js'],
  snippets: {
    'component': `
export const ${'ComponentName'}: React.FC<${'Props'}> = (${'props'}) => {
  return (
    <div className="${'container'}">
      ${'// Seu conteúdo aqui'}
    </div>
  );
};
`,
    'useState': `const [${'state'}, set${'State'}] = useState<${'Type'}>(initialValue);`,
    'useEffect': `
useEffect(() => {
  ${'// código do effect'}
  
  return () => {
    ${'// cleanup'}
  };
}, [${'dependencies'}]);
`,
    'styled-component': `
const ${'StyledComponent'} = styled.${'tag'}`
  },
  templates: {
    'useCustomHook': `
export const use${'HookName'} = () => {
  const [state, setState] = useState<${'Type'}>(initial);
  
  useEffect(() => {
    ${'// lógica do hook'}
  }, []);
  
  return { state, setState };
};
`
  },
  refactors: {
    'extract-to-hook': (code: string) => {
      // Lógica simples de refactor (pode ser melhorada com AI)
      return `// Extraiu para hook: ${code.slice(0, 50)}...`;
    }
  }
};

registerExtension(reactSnippets);