import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { FileNode } from '../../types';
import { Icon } from '../ui/Icon';

const REACT_VERSION = '19.2.3';
const LUCIDE_VERSION = '0.562.0';
const ENTRY_PRIORITY = ['src/main.tsx', 'src/index.tsx', 'index.tsx'];

export const WebPreview: React.FC = () => {
  const { files } = useWorkspaceStore();
  const { addConsoleLog, previewFileId } = useUIStore();
  const [srcDoc, setSrcDoc] = useState('');
  const [currentPreviewName, setCurrentPreviewName] = useState('Initializing...');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'CONSOLE_LOG') {
        addConsoleLog(`[Preview] ${event.data.message}`);
      } else if (event.data.type === 'PREVIEW_ERROR') {
        addConsoleLog(`[Preview Error] ${event.data.message}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addConsoleLog]);

  const getFullPath = (node: FileNode): string => {
    const stateFiles = useWorkspaceStore.getState().files;
    let path = node.name;
    let parent = stateFiles[node.parentId || ''];
    while (parent && parent.id !== 'root') {
      path = `${parent.name}/${path}`;
      parent = stateFiles[parent.parentId || ''];
    }
    return path;
  };

  const allFiles = useMemo(() => Object.values(files).filter((file) => file.type === 'file') as FileNode[], [files]);

  const findByPath = (targetPath: string): FileNode | undefined => {
    const normalizedTarget = targetPath.replace(/^\/+/, '');
    return allFiles.find((file) => getFullPath(file) === normalizedTarget);
  };

  const findEntrypoint = (): FileNode | undefined => {
    for (const path of ENTRY_PRIORITY) {
      const direct = findByPath(path);
      if (direct) return direct;
    }

    return allFiles.find((file) => file.name.endsWith('.tsx') && /(createRoot\s*\(|ReactDOM\.createRoot\s*\()/.test(file.content || ''));
  };

  const setEntryError = (message: string) => {
    setCurrentPreviewName('Preview Error');
    setSrcDoc(`<!doctype html><html><body style="margin:0;padding:24px;background:#1e1e1e;color:#d4d4d4;font-family:ui-sans-serif,system-ui;"><h2 style="margin:0 0 8px;">Web Preview</h2><p style="margin:0;">${message}</p></body></html>`);
  };

  const buildBootloader = (payloadBase64: string) => {
    const template = `
<script>
window.process = window.process || { env: { NODE_ENV: 'development' } };
const sendPreviewError = function(message) {
  window.parent.postMessage({ type: 'PREVIEW_ERROR', message: String(message || 'Unknown preview error') }, '*');
};
window.addEventListener('error', function(event) {
  const details = [event.message, event.filename, event.lineno, event.colno].filter(Boolean).join(' | ');
  sendPreviewError(details || 'Runtime error in iframe');
});
window.addEventListener('unhandledrejection', function(event) {
  sendPreviewError('Unhandled Promise Rejection: ' + (event.reason && event.reason.message ? event.reason.message : event.reason || 'Unknown reason'));
});
</script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script>
(async function () {
  const postLog = function(type, args) {
    const text = args.map(function(arg) {
      if (typeof arg === 'string') return arg;
      try { return JSON.stringify(arg); } catch (e) { return String(arg); }
    }).join(' ');
    window.parent.postMessage({ type: type === 'error' ? 'PREVIEW_ERROR' : 'CONSOLE_LOG', message: text }, '*');
  };

  ['log', 'info', 'warn', 'error', 'debug'].forEach(function(method) {
    const original = console[method];
    console[method] = function() {
      const args = Array.from(arguments);
      original.apply(console, args);
      const first = args[0];
      if (typeof first === 'string' && first.includes('cdn.tailwindcss.com')) return;
      postLog(method, args);
    };
  });

  const raw = '__PAYLOAD__';
  const files = JSON.parse(decodeURIComponent(escape(atob(raw))));
  const importMap = { imports: {} };

  importMap.imports['react'] = 'https://esm.sh/react@__REACT__?dev';
  importMap.imports['react-dom'] = 'https://esm.sh/react-dom@__REACT__?dev';
  importMap.imports['react-dom/client'] = 'https://esm.sh/react-dom@__REACT__/client?dev';
  importMap.imports['react/jsx-runtime'] = 'https://esm.sh/react@__REACT__/jsx-runtime?dev';
  importMap.imports['react/jsx-dev-runtime'] = 'https://esm.sh/react@__REACT__/jsx-dev-runtime?dev';
  importMap.imports['lucide-react'] = 'https://esm.sh/lucide-react@__LUCIDE__';

  const exts = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json', '.css'];

  const normalizePath = function(path) {
    const out = [];
    path.split('/').forEach(function(part) {
      if (!part || part === '.') return;
      if (part === '..') out.pop();
      else out.push(part);
    });
    return './' + out.join('/');
  };

  const dirname = function(path) {
    const index = path.lastIndexOf('/');
    return index === -1 ? './' : path.slice(0, index + 1);
  };

  const resolveSpecifier = function(fromPath, specifier) {
    if (!specifier) return specifier;
    if (/^(https?:|data:|blob:|node:)/.test(specifier)) return specifier;
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) return specifier;

    const base = specifier.startsWith('/') ? '.' + specifier : dirname(fromPath) + specifier;
    const normalized = normalizePath(base);

    const candidates = [normalized];
    exts.forEach(function(ext) { candidates.push(normalized + ext); });
    candidates.push(normalized + '/index.tsx');
    candidates.push(normalized + '/index.ts');
    candidates.push(normalized + '/index.jsx');
    candidates.push(normalized + '/index.js');

    for (const candidate of candidates) {
      if (Object.prototype.hasOwnProperty.call(files, candidate)) {
        return candidate.endsWith('.css') ? candidate + '?capy-style' : candidate;
      }
    }

    return normalized;
  };

  const rewriteSpecifiers = function(code, fromPath) {
    let out = code;
    out = out.replace(/(import\\s+(?:[^'"\\n]*?\\s+from\\s+)?)(['"])([^'"\\n]+)\\2/g, function(_, prefix, quote, specifier) {
      return prefix + quote + resolveSpecifier(fromPath, specifier) + quote;
    });
    out = out.replace(/(export\\s+(?:[^'"\\n]*?\\s+from\\s+))(['"])([^'"\\n]+)\\2/g, function(_, prefix, quote, specifier) {
      return prefix + quote + resolveSpecifier(fromPath, specifier) + quote;
    });
    out = out.replace(/(import\\s*\\(\\s*)(['"])([^'"\\n]+)\\2(\\s*\\))/g, function(_, p1, quote, specifier, p2) {
      return p1 + quote + resolveSpecifier(fromPath, specifier) + quote + p2;
    });
    return out;
  };

  const createModule = function(code) {
    return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  };

  const registerAliases = function(path, url) {
    importMap.imports[path] = url;
    const noExt = path.replace(/\\.[^/.]+$/, '');
    if (noExt !== path) importMap.imports[noExt] = url;

    if (path.endsWith('/index.tsx') || path.endsWith('/index.ts') || path.endsWith('/index.jsx') || path.endsWith('/index.js')) {
      const dirAlias = path.replace(/\\/index\\.[^/.]+$/, '');
      importMap.imports[dirAlias] = url;
    }
  };

  try {
    Object.keys(files).filter(function(path) { return path.endsWith('.css'); }).forEach(function(cssPath) {
      const styleId = btoa(cssPath);
      const cssText = JSON.stringify(files[cssPath] || '');
      const moduleCode = [
        'const styleId = ' + JSON.stringify(styleId) + ';',
        'if (!document.querySelector(\'style[data-capy-style="\' + styleId + '\'"])) {',
        '  const style = document.createElement(\'style\');',
        '  style.setAttribute(\'data-capy-style\', styleId);',
        '  style.textContent = ' + cssText + ';',
        '  document.head.appendChild(style);',
        '}',
        'export default {};'
      ].join('\\n');

      const moduleUrl = createModule(moduleCode);
      registerAliases(cssPath + '?capy-style', moduleUrl);
    });

    Object.keys(files)
      .filter(function(path) { return /\\.(tsx?|jsx?|mjs|cjs|js)$/.test(path); })
      .forEach(function(filePath) {
        const rewritten = rewriteSpecifiers(files[filePath], filePath);
        const transformed = Babel.transform(rewritten, {
          presets: [
            ['react', { runtime: 'automatic', development: true }],
            ['typescript', { isTSX: true, allExtensions: true }]
          ],
          filename: filePath,
          sourceMaps: 'inline'
        });

        const moduleUrl = createModule(transformed.code || rewritten);
        registerAliases(filePath, moduleUrl);
      });

    const importMapEl = document.createElement('script');
    importMapEl.type = 'importmap';
    importMapEl.textContent = JSON.stringify(importMap);
    document.head.appendChild(importMapEl);

    if (document.readyState === 'loading') {
      await new Promise(function(resolve) { document.addEventListener('DOMContentLoaded', resolve, { once: true }); });
    }

    const localScripts = Array.from(document.querySelectorAll('script[src]')).filter(function(script) {
      const src = script.getAttribute('src') || '';
      return src && !/^(https?:|data:|blob:)/.test(src);
    });

    localScripts.forEach(function(script) {
      const src = script.getAttribute('src') || '';
      const normalized = src.startsWith('.') ? src : './' + src.replace(/^\\//, '');
      const mapped = importMap.imports[normalized] || importMap.imports[normalized.replace(/\\.[^/.]+$/, '')];
      if (!mapped) return;

      const moduleScript = document.createElement('script');
      moduleScript.type = 'module';
      moduleScript.textContent = 'import ' + JSON.stringify(normalized) + ';';
      script.replaceWith(moduleScript);
    });
  } catch (error) {
    sendPreviewError(error && error.message ? error.message : error);
  }
})();
</script>
`;

    return template
      .replace('__PAYLOAD__', payloadBase64)
      .replaceAll('__REACT__', REACT_VERSION)
      .replace('__LUCIDE__', LUCIDE_VERSION);
  };

  const generatePreview = () => {
    const fileMap: Record<string, string> = {};
    allFiles.forEach((file) => {
      const fullPath = `./${getFullPath(file).replace(/^\.\//, '')}`;
      fileMap[fullPath] = file.content || '';
    });

    let entryFile: FileNode | undefined;
    let useSyntheticHtml = false;
    let syntheticEntryPath = '';

    if (previewFileId && files[previewFileId] && files[previewFileId].type === 'file') {
      const selected = files[previewFileId];
      if (selected.name.endsWith('.html')) {
        entryFile = selected;
      } else if (selected.name.match(/\.(tsx?|jsx?)$/)) {
        entryFile = selected;
        useSyntheticHtml = true;
        syntheticEntryPath = `./${getFullPath(selected)}`;
      }
    }

    if (!entryFile) {
      entryFile = allFiles.find((file) => file.name === 'index.html' && (file.parentId === 'root' || !file.parentId));
    }

    if (!entryFile) {
      const reactEntry = findEntrypoint();
      if (reactEntry) {
        entryFile = reactEntry;
        useSyntheticHtml = true;
        syntheticEntryPath = `./${getFullPath(reactEntry)}`;
      }
    }

    if (!entryFile) {
      setEntryError('Nenhum entrypoint React encontrado. Tente criar src/main.tsx, src/index.tsx ou index.tsx.');
      return;
    }

    setCurrentPreviewName(useSyntheticHtml ? `Wrapper for ${entryFile.name}` : entryFile.name);

    const rawHtml = useSyntheticHtml
      ? `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Capy App</title></head><body><div id="root"></div><script type="module" src="${syntheticEntryPath}"></script></body></html>`
      : (entryFile.content || '');

    const payloadBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(fileMap))));
    const bootloader = buildBootloader(payloadBase64);

    const finalHtml = rawHtml.includes('</body>')
      ? rawHtml.replace('</body>', `${bootloader}</body>`)
      : `${rawHtml}${bootloader}`;

    setSrcDoc(finalHtml);
  };

  useEffect(() => {
    const timer = setTimeout(generatePreview, 700);
    return () => clearTimeout(timer);
  }, [files, previewFileId]);

  const openInNewTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-2 justify-between flex-shrink-0 select-none">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Icon name="Globe" size={14} />
          <span className="font-mono max-w-[240px] truncate" title={currentPreviewName}>
            {currentPreviewName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openInNewTab} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs px-1 py-0.5 rounded hover:bg-gray-200">
            <Icon name="ExternalLink" size={12} /> Open
          </button>
          <button onClick={generatePreview} className="text-gray-500 hover:text-gray-900 px-1 py-0.5 rounded hover:bg-gray-200" title="Force Reload">
            <Icon name="RefreshCw" size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 relative bg-white overflow-hidden">
        <iframe
          ref={iframeRef}
          title="preview"
          srcDoc={srcDoc}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      </div>
    </div>
  );
};
